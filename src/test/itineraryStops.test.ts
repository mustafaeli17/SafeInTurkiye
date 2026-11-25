import {describe, expect, it, vi, afterEach} from 'vitest';
import {publicCities} from '../lib/publicRoutes';
import {appendStops, assignStop, directoryStop, directionsHref, entryKey, manualStop, moveDayStop, placeStop, planCityForName, readPlan, slotForStop, stopDetailPath, tourStop, validPlanDate} from '../components/FirstVisitPlan/plan';
import type {DirectoryEntry} from '../lib/directory';
import {editDayPlan} from '../components/FirstVisitPlan/useDayPlan';
import {parseGooglePlaces} from '../services/googleNearby';
import type {NearbyPlaceRecord} from '../services/nearbyPlaces';

const hotel: NearbyPlaceRecord = {
  id: 'google:AnExample', cityName: 'Denizli', category: 'hotel', name: 'Provider display name',
  address: 'Provider display address', coordinates: {lat:37.8,lng:29.1}, distanceMeters:160,
  rating:4.7, reviewCount:240, phone: null, telephoneUrl: null, website:null, openingHours:null,
  sourceUrl:'https://maps.google.com/', photo:{url:'/api/place-photo?temporary',sourceUrl:'',authors:[]},
};
const first = '2026-12-01', second = '2026-12-02';
afterEach(() => vi.unstubAllGlobals());

describe('editable day itinerary', () => {
  it('resolves all published cities and keeps ambiguous or missing locations unassigned', () => {
    for (const {name,slug} of publicCities) {
      expect(planCityForName(name)).toBe(name);
      expect(planCityForName(slug)).toBe(name);
    }
    expect(planCityForName('安塔利亚省')).toBe('Antalya');
    expect(planCityForName('Bodrum')).toBe('Muğla');
    expect(planCityForName('İstanbul - Antalya')).toBeNull();
    expect(planCityForName(undefined)).toBeNull();
  });

  it('reopens saved hotels and activities in their own directory without retaining Google data', () => {
    const stop = placeStop(hotel,'hotels','Our hotel')!;
    expect(stop).toEqual({kind:'google',id:hotel.id,nickname:'Our hotel',section:'hotels',slot:'hotel'});
    expect(stopDetailPath('Denizli',stop)).toBe('/hotels?city=denizli&place=google%3AAnExample');
    expect(placeStop(hotel,'restaurants')).toBeNull();
    const museum = placeStop({...hotel,category:'museum'},'activities')!;
    expect(slotForStop(museum)).toBe('museum');
    expect(stopDetailPath('Denizli',museum)).toContain('/activities?city=denizli');
    expect(readPlan(JSON.stringify([{...hotel,...stop,date:first}]),'Denizli')).toEqual([{...stop,date:first}]);
  });

  it('reopens café-only and activity records through a filter that accepts the saved place type', () => {
    const payload = (type:string) => ({places:[{id:'Example',displayName:{text:'Test place'},primaryType:type,types:[type],
      location:{latitude:hotel.coordinates.lat,longitude:hotel.coordinates.lng},googleMapsUri:'https://maps.google.com/?cid=123'}]});
    const cafePlace = parseGooglePlaces(payload('cafe'),hotel.coordinates,'cafe').places[0];
    const cafe = placeStop(cafePlace,'restaurants')!;
    const [stored] = readPlan(JSON.stringify([cafe]),'Denizli');
    const cafeUrl = new URL(stopDetailPath('Denizli',stored)!, 'https://example.test');
    expect(cafeUrl.pathname).toBe('/near-me');
    expect(Object.fromEntries(cafeUrl.searchParams)).toEqual({city:'denizli',category:'cafe',place:'google:Example'});
    expect(parseGooglePlaces(payload('cafe'),hotel.coordinates,'restaurant').places).toHaveLength(0);
    for (const [category,type] of [['museum','museum'],['attraction','tourist_attraction'],['historical','historical_landmark'],
      ['park','park'],['cinema','movie_theater'],['entertainment','bowling_alley'],['activity','amusement_park']] as const) {
      const place = parseGooglePlaces(payload(type),hotel.coordinates,category).places[0];
      const [saved] = readPlan(JSON.stringify([placeStop(place,'activities')]),'Denizli');
      const url = new URL(stopDetailPath('Denizli',saved)!, 'https://example.test');
      expect(url.pathname).toBe('/activities');
      expect(url.searchParams.get('category')).toBe('activity');
      expect(parseGooglePlaces(payload(type),hotel.coordinates,'activity').places[0].id).toBe(saved.id);
    }
  });

  it('saves a published directory detail by first-party identity and a strictly validated public slug', () => {
    const entry:DirectoryEntry={id:'11111111-2222-3333-4444-555555555555',kind:'hotels',slug:'denizli-qa',name:'QA hotel',city:'Denizli',
      description:{en:'Test English',tr:'Test Turkish'},website:'https://example.test',sourceUrl:'',lastVerified:null,gallery:[]};
    const stop=directoryStop(entry)!;
    expect(stop).toEqual({kind:'directory',section:'hotels',id:'cms:hotels:'+entry.id,slug:entry.slug,label:entry.name,hasTurkish:true,slot:'hotel'});
    expect(stopDetailPath('Denizli',stop)).toBe('/hotels/denizli-qa');
    expect(directionsHref('Denizli',stop)).toBe('');
    expect(readPlan(JSON.stringify([{...stop,lat:123,description:entry.description}]),'Denizli')).toEqual([stop]);
    expect(entryKey(stop)).toBe(entryKey({kind:'editorial',id:stop.id,section:'hotels',slot:'hotel',label:'QA',lat:37,lng:29}));
    expect(directoryStop({...entry,description:{en:'English'}})).not.toHaveProperty('hasTurkish');
    expect(directoryStop({...entry,kind:'activities',category:'Museum & Culture'})).toMatchObject({slot:'museum'});
    expect(directoryStop({...entry,kind:'museums'})).toBeNull();
    expect(directoryStop({...entry,id:'malformed'})).toBeNull();
    expect(readPlan(JSON.stringify([{...stop,section:'restaurants'}]),'Denizli')).toEqual([]);
    for(const slug of ['https://example.test','/safe','../safe','bad%2fpath','x?tracking=yes','foo---bar','']) {
      expect(directoryStop({...entry,slug})).toBeNull();
      expect(readPlan(JSON.stringify([{...stop,slug}]),'Denizli')).toEqual([]);
    }
  });

  it('supports repeated venues on different days or meal slots and rejects a reschedule collision without losing a stop', () => {
    const lunch = {...placeStop({...hotel,category:'restaurant'},'restaurants')!,date:first};
    const dinner = {...lunch,slot:'dinner' as const};
    const later = {...lunch,date:second};
    const visits = appendStops([], [lunch,dinner,later,lunch]);
    expect(visits).toEqual([lunch,dinner,later]);
    expect(readPlan(JSON.stringify(visits),'Denizli')).toEqual(visits);
    expect(assignStop(visits,entryKey(dinner),{slot:'lunch'})).toBe(visits);
    expect(assignStop(visits,entryKey(later),{date:first})).toBe(visits);
    expect(assignStop(visits,entryKey(lunch),{date:'2026-02-31'})).toBe(visits);
    const changed = assignStop(visits,entryKey(dinner),{date:undefined,slot:'dessert'});
    expect(changed[1]).not.toHaveProperty('date');
    expect(changed[1].slot).toBe('dessert');
    expect(visits[1]).toEqual(dinner);
  });

  it('reorders only the active day even when other dates are interleaved', () => {
    const a = manualStop('First','breakfast',first)!;
    const b = manualStop('Another day','activity',second)!;
    const c = manualStop('Last','cinema',first)!;
    const visits = [a,b,c];
    const swapped = moveDayStop(visits,entryKey(c),-1);
    expect(swapped).toEqual([c,b,a]);
    expect(moveDayStop(swapped,entryKey(c),-1)).toBe(swapped);
    expect(moveDayStop(swapped,entryKey(b),1)).toBe(swapped);
    expect(manualStop('   ','hotel')).toBeNull();
    expect(validPlanDate('2028-02-29')).toBe(true);
    expect(validPlanDate('2027-02-29')).toBe(false);
    expect(directionsHref('Bursa',a)).toBe('');
    expect(stopDetailPath('Bursa',a)).toBeNull();
  });

  it('keeps partner product links for a saved tour, drops unrelated parameters and rejects unrelated destinations', () => {
    const url = 'https://www.viator.com/es-ES/tours/Istanbul/test?pid=P123&mcid=42383&medium=api&email=unused#anchor';
    const tour = tourStop('123P4',url,'Boat day')!;
    expect(tour).toEqual({kind:'tour',id:'viator:123P4',slot:'tour',nickname:'Boat day',url:url.split('&email')[0]});
    expect(readPlan(JSON.stringify([{...tour,title:'Provider title',price:120}]),'İstanbul')).toEqual([tour]);
    for (const bad of ['javascript:alert(1)', 'https://other.example/tours/test?pid=P123',
      'https://www.viator.com/account?pid=P123', 'https://user@www.viator.com/tours/test?pid=P123']) {
      expect(tourStop('123P4',bad)).toBeNull();
    }
  });

  it('upgrades old stops in place and writes only validated fields under the existing browser key', async () => {
    const key='sit:day-plan:v1:İstanbul';
    const legacy={kind:'google' as const,id:'google:Cafe',nickname:'Meeting point'};
    const data=new Map([[key,JSON.stringify([legacy])]]);
    vi.stubGlobal('window',Object.assign(new EventTarget(),{navigator:{},localStorage:{
      getItem:(name:string)=>data.get(name)??null, setItem:(name:string,raw:string)=>data.set(name,raw),
      removeItem:(name:string)=>data.delete(name),
    }}));
    const stop={...placeStop(hotel,'hotels')!,date:first,photo:hotel.photo};
    await editDayPlan('İstanbul', current=>appendStops(current,[stop]));
    const raw=data.get(key)!;
    expect(raw).not.toMatch(/Provider|temporary|coordinates|photo/);
    expect(readPlan(raw,'İstanbul')).toEqual([legacy,{kind:'google',id:hotel.id,nickname:'',section:'hotels',slot:'hotel',date:first}]);
    expect(stopDetailPath('İstanbul',legacy)).toContain('/restaurants?city=istanbul');
    expect(data.size).toBe(1);
  });
});
