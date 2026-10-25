import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {navigateTo,updateLocationQuery} from '../lib/browserNavigation';
import {destinationSlug,discoveryCity} from '../lib/discoveryNavigation';
import {readDiscoveryArea,saveDiscoveryArea} from '../lib/discoveryState';

function setup(start='https://www.safeinturkiye.com/'){
 const target=new EventTarget(),entries=[{url:new URL(start),state:null as unknown}];let index=0;
 const history={
  get state(){return entries[index].state},
  pushState(state:unknown,_title:string,path:string){entries.splice(++index);entries.push({url:new URL(path,start),state});},
  replaceState(state:unknown,_title:string,path:string){entries[index]={url:new URL(path,start),state};},
  back(){if(index){index--;target.dispatchEvent(new Event('popstate'));}},
  forward(){if(index+1<entries.length){index++;target.dispatchEvent(new Event('popstate'));}},
  get length(){return entries.length}
 };
 Object.defineProperty(target,'location',{get:()=>entries[index].url});
 Object.assign(target,{history,scrollTo:vi.fn()});
 vi.stubGlobal('window',target);return target;
}
afterEach(()=>vi.unstubAllGlobals());
describe('browser navigation',()=>{
 beforeEach(()=>setup());
 it('keeps a distinct back/forward entry for each screen and city',()=>{
  const b=window;
  navigateTo('/restaurants?city=istanbul');navigateTo('/restaurants?city=antalya');navigateTo('/taxi?city=antalya');
  expect(b.history.length).toBe(4);b.history.back();expect(b.location.pathname+b.location.search).toBe('/restaurants?city=antalya');
  b.history.back();expect(b.location.search).toBe('?city=istanbul');b.history.forward();expect(b.location.search).toBe('?city=antalya');
 });
 it('does not add duplicate entries or follow an external destination',()=>{
  navigateTo('/restaurants');navigateTo('/restaurants');navigateTo('https://example.com/');
  expect(window.history.length).toBe(2);expect(window.location.pathname).toBe('/restaurants');
 });
 it('preserves the selected region when opening and closing place details',()=>{
  navigateTo('/restaurants?city=bodrum');updateLocationQuery({place:'google:Example'});
  expect(window.location.search).toContain('city=bodrum');window.history.back();expect(window.location.search).toBe('?city=bodrum');
 });
 it('lets replaced query state update without consuming the back button',()=>{
  navigateTo('/activities?city=aydin');updateLocationQuery({category:'museum'},{replace:true});
  expect(window.history.length).toBe(2);window.history.back();expect(window.location.pathname).toBe('/');
 });
 it('round-trips every supported search anchor including Turkish letters',()=>{
  for(const city of ['İstanbul','İzmir','Muğla','Bodrum','Kuşadası','Çeşme','Alaçatı','Cappadocia'])expect(discoveryCity(`city=${destinationSlug(city)}`,'Ankara')).toBe(city);
  expect(discoveryCity('city=unknown','Antalya')).toBe('Antalya');
 });
 it('restores a selected area from tab history without exposing its address in URLs',()=>{
  navigateTo('/restaurants?city=aydin');const area={label:'Beşiktaş, İstanbul',lat:41.04,lng:29};
  saveDiscoveryArea(area,1000);expect(readDiscoveryArea(2000)).toEqual(area);
  updateLocationQuery({place:'google:Example'},{state:{placeList:'/restaurants?city=aydin'}});
  expect(readDiscoveryArea(2000)).toEqual(area);expect(window.location.href).not.toContain('Beşiktaş');
  window.history.back();expect(readDiscoveryArea(2000)).toEqual(area);
  expect(readDiscoveryArea(1801001)).toBeNull();
  updateLocationQuery({city:'antalya'});expect(readDiscoveryArea(2000)).toBeNull();
 });
 it('clears a saved area and rejects malformed stored locations',()=>{
  saveDiscoveryArea({label:'Test',lat:41,lng:29});saveDiscoveryArea(null);expect(readDiscoveryArea()).toBeNull();
  window.history.replaceState({discoveryArea:{scope:'/?city=',until:Date.now()+10000,place:{label:'Unsafe',lat:999,lng:29}}},'',window.location.href);
  expect(readDiscoveryArea()).toBeNull();
 });
});
