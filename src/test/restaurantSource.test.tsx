import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import RestaurantDetail from '../components/RestaurantDetail';
import {editorialPlace,type EditorialRow} from '../lib/editorialDiscovery';
import type {NearbyPlaceRecord} from '../services/nearbyPlaces';

const coords={lat:41,lng:29};
const record:EditorialRow={
 id:'aaaa0000-0000-4000-b000-000000000001',name:'Test restaurant',address:'Test address',
 description:'Test description',active:true,status:'PUBLISHED',
 city:{name:'İstanbul',slug:'istanbul',active:true,status:'PUBLISHED'},
 website:'https://restaurant.example',editorial_metadata:{coordinates:coords},
};
function render(place:NearbyPlaceRecord){
 return renderToStaticMarkup(<RestaurantDetail place={place} lang="tr" city="İstanbul" text={tr=>tr} directions="Yol tarifi" onExpired={()=>{}}/>);
}
it('identifies a sponsored CMS restaurant and links its website with the correct action',()=>{
 const place=editorialPlace(record,'restaurants',coords,100,true)!;
 const html=render(place);
 expect(html).toContain('Sponsorlu');
 expect(html).toContain('Web sitesi');
 expect(html).toContain('restaurant.example');
 expect(html).not.toContain('>Google Maps');
});
it('keeps correct attribution for map-only editorial, Google and OpenStreetMap restaurants',()=>{
 const place=editorialPlace({...record,website:null},'restaurants',coords,100)!;
 expect(render(place)).toContain('Google Maps');
 const {editorial,...plain}=place;
 expect(editorial.sponsored).toBe(false);
 expect(render({...plain,id:'google:test',sourceUrl:'https://maps.google.com/'})).toContain('Google Maps');
 expect(render({...plain,id:'node/123',sourceUrl:'https://www.openstreetmap.org/node/123'})).toContain('OpenStreetMap');
});
