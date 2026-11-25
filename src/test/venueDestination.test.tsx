import {afterEach,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import PlaceTravelLinks from '../components/PlaceTravelLinks';
import TransitJourney from '../components/TransitJourney';
import {directory,registerPublishedEntry} from '../lib/directory';
import {searchLanguages} from '../lib/searchLocales';
import {clearTransitHandoff,setTransitHandoff} from '../lib/transitHandoff';
import {resolveTransitEndpoint} from '../lib/transitEndpoint';
import {changedTaxiVenue,readVenueDestination,venueDestination,venueGuideCity,venueTravelHref} from '../lib/venueDestination';

const name='Köşe & Avlu',coordinates={lat:37.0388,lng:27.4298};
const venue={name,coordinates,googlePlaceId:'test_ID-1'};
const chosen=venueDestination(venue)!;
afterEach(()=>{
  clearTransitHandoff();
  const i=directory.findIndex(entry=>entry.id==='venue-test');
  if(i>=0) directory.splice(i,1);
});

it.each(searchLanguages)('opens the existing taxi and transit routes for the exact public destination in %s',lang=>{
  const html=renderToStaticMarkup(<PlaceTravelLinks {...venue} lang={lang} city="Bodrum"/>);
  const hrefs=[...html.matchAll(/href="([^"]+)"/g)].map(match=>new URL(match[1].replaceAll('&amp;','&'),'https://example.test'));
  const prefix=lang==='en'?'':'/'+lang;
  expect(hrefs.map(url=>url.pathname)).toEqual([prefix+'/taxi',prefix+'/transport']);
  for(const url of hrefs){
    expect(readVenueDestination(url.search)).toEqual(chosen);
    expect(url.searchParams.get('city')).toBe('mugla');
    expect(url.searchParams.has('origin')).toBe(false);
  }
  if(lang!=='en') expect(html).not.toContain('Estimate taxi fare');
});

it('preserves the selected coordinates when transit requests a route, while leaving the new origin unselected',async()=>{
  const previous={lat:40,lng:28,label:'Previous route'};
  setTransitHandoff({origin:previous,destination:previous});
  const html=renderToStaticMarkup(<TransitJourney city="Muğla" lang="en" examples={['From','To']} venue={chosen}/>);
  expect(html).toContain('value="Köşe &amp; Avlu"');
  expect(html).toContain('value=""');
  expect(html).not.toContain(previous.label);
  expect(await resolveTransitEndpoint(null,chosen,name)).toEqual(coordinates);
});

it('uses the matching city guide for provider provinces, districts and localized city names',()=>{
  expect(venueGuideCity('Nevşehir','İstanbul')).toBe('cappadocia');
  expect(venueGuideCity('Göreme, Nevşehir Province')).toBe('cappadocia');
  expect(venueGuideCity('伊斯坦布尔','Antalya')).toBe('istanbul');
  expect(venueGuideCity('unknown','Capadocia')).toBe('cappadocia');
  expect(venueGuideCity('unknown')).toBeUndefined();
});

it('changes taxi inputs only for a different destination, preserving the trip across transit and browser Back',()=>{
  const query='to=Test&toLat=37.3&toLng=27.5';
  const applied=changedTaxiVenue('taxi',query,null)!;
  expect(applied.destination?.label).toBe('Test');
  expect(changedTaxiVenue('transit','city=mugla',applied.signature)).toBeNull();
  expect(changedTaxiVenue('taxi',query,applied.signature)).toBeNull();
  expect(changedTaxiVenue('taxi',query+'&utm_source=test',applied.signature)).toBeNull();
  expect(changedTaxiVenue('taxi',query.replace('27.5','28.5'),applied.signature)?.destination?.lng).toBe(28.5);
  expect(changedTaxiVenue('taxi','',applied.signature)).toEqual({destination:null,signature:null});
});

it('keeps a published coordinate pair, supports non-Google venues and never substitutes a city centre',()=>{
  const row={id:'venue-test',name,city:{name:'Muğla'}};
  const entry=registerPublishedEntry({...row,editorial_metadata:{coordinates}},'activities');
  const point=venueDestination(entry)!;
  expect(point).toEqual({label:name,...coordinates});
  expect(venueTravelHref('transit',point,'tr',entry.city)).not.toContain('toPlaceId');
  const missing=registerPublishedEntry(row,'activities');
  expect(renderToStaticMarkup(<PlaceTravelLinks lang="tr" {...missing}/>)).toBe('');
  expect(venueDestination({name:'  ',coordinates})).toBeNull();
});

it.each(['','to=X&toLat=40&toLng=','to=X&toLat=90.1&toLng=28','to=X&toLat=0&toLng=0','to=X&toLat=NaN&toLng=28','to=X&toLat=52.3&toLng=4.1'])('ignores incomplete or out-of-area destination parameters: %s',query=>{
  expect(readVenueDestination(query)).toBeNull();
});
