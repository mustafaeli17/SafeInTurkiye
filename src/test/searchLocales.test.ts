import {expect,it} from 'vitest';
import {localizePath,parseLocalePath,searchLanguages} from '../lib/searchLocales';
it('round trips every public language without losing search or selected place',()=>{
 for(const lang of searchLanguages){
  const path=localizePath('/restaurants?city=aydin&place=google%3Atest#details',lang);
  expect(parseLocalePath(path)).toEqual({lang,path:'/restaurants?city=aydin&place=google%3Atest#details'});
  expect(localizePath(path,lang)).toBe(path);
  expect(localizePath(path,'en')).toBe('/restaurants?city=aydin&place=google%3Atest#details');
 }
});
it('keeps root language routes stable and does not invent unknown language variants',()=>{
 expect(localizePath('/','ar')).toBe('/ar');
 expect(parseLocalePath('/ar')).toEqual({lang:'ar',path:'/'});
 expect(parseLocalePath('/xx/taxi')).toEqual({lang:'en',path:'/xx/taxi'});
 expect(localizePath('https://example.com/','tr')).toBe('https://example.com/');
 expect(localizePath('/api/places','tr')).toBe('/api/places');
 expect(localizePath('/taxi','invalid')).toBe('/taxi');
});
