import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import NearMeResults from '../components/NearMeResults';
import {editorialPlace,type EditorialRow} from '../lib/editorialDiscovery';
import type {NearbyPlaceRecord} from '../services/nearbyPlaces';

const coordinates={lat:41,lng:29};
const osm:NearbyPlaceRecord={
  id:'node/124',name:'QA museum',category:'museum',coordinates,distanceMeters:20,
  address:null,phone:null,telephoneUrl:null,openingHours:null,website:null,
  sourceUrl:'https://www.openstreetmap.org/node/124',
};
function render(place:NearbyPlaceRecord){
  return renderToStaticMarkup(<NearMeResults places={[place]} lang="en" onOpen={()=>{}}
    categoryLabel={category=>category} distance={n=>String(n)} text={(_tr,en)=>en}
    directions="Directions" businessKey={()=>undefined} onExpired={()=>{}}/>);
}
it('shows the OSM source on its card and initially selects the same first place as the map',()=>{
  const html=render(osm);
  expect(html).toContain('OpenStreetMap');
  expect(html).toContain(osm.sourceUrl);
  expect(html).toContain('data-selected="true"');
  expect(html).not.toContain('>Google Maps<');
});
it('links a Google place to its own directions and attributes its rating',()=>{
  const html=render({...osm,id:'google:QA134',rating:4.2,sourceUrl:'https://maps.google.com/?cid=134'});
  expect(html).toContain('destination_place_id=QA134');
  expect(html).toContain('Google Maps');
  expect(html).toContain('https://maps.google.com/?cid=134');
});
it('identifies the official site of a sponsored editorial place',()=>{
  const row:EditorialRow={id:'aaaa0000-0000-4000-b000-000000000001',name:'QA place',address:'QA street',
    description:'QA description',active:true,status:'PUBLISHED',city:{name:'İstanbul',slug:'istanbul',active:true,status:'PUBLISHED'},
    website:'https://place.example',editorial_metadata:{coordinates}};
  const html=render(editorialPlace(row,'restaurants',coordinates,100,true)!);
  expect(html).toContain('Sponsored');
  expect(html).toContain('Website');
  expect(html).toContain('https://place.example');
});
