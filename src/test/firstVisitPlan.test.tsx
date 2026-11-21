import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, expect, it, vi} from 'vitest';
import FirstVisitPlan from '../components/FirstVisitPlan';
import {searchLanguages, localizePath} from '../lib/searchLocales';
import {appendStops, directionsHref, moveStop, readPlan, restaurantStop, type DayStop} from '../components/FirstVisitPlan/plan';
import {editDayPlan} from '../components/FirstVisitPlan/useDayPlan';
import type {NearbyPlaceRecord} from '../services/nearbyPlaces';
import {editorialPlace} from '../lib/editorialDiscovery';
import RestaurantDetail from '../components/RestaurantDetail';

it('makes the day planner and city restaurant directory reachable in each supported language', () => {
  for (const lang of searchLanguages) {
    for (const [city, slug] of [['İstanbul', 'istanbul'], ['Antalya', 'antalya']]) {
      const html = renderToStaticMarkup(<FirstVisitPlan city={city} lang={lang}/>);
      expect(html).toContain('id="day-plan"');
      expect(html).toContain('type="button"');
      expect(html).toContain(localizePath('/restaurants?city=' + slug, lang));
    }
  }
  expect(renderToStaticMarkup(<FirstVisitPlan city="Ankara" lang="en"/>)).toBe('');
});

const google: NearbyPlaceRecord = {
  id: 'google:DemoPlace', category: 'restaurant', name: 'Provider name', coordinates: {lat: 41, lng: 29}, distanceMeters: 0,
  address: 'Provider address', phone: null, telephoneUrl: null, website: null, openingHours: null,
  sourceUrl: 'https://maps.google.com/', photo: {url: '/api/place-photo?private', sourceUrl: '', authors: []},
};
const square: DayStop = {kind: 'landmark', id: 'square'};
const museum: DayStop = {kind: 'landmark', id: 'ayasofya'};
const gate: DayStop = {kind: 'landmark', id: 'gate'};
afterEach(() => vi.unstubAllGlobals());

it('adds a restaurant to its verified city even if reached through a different city’s search or GPS results', () => {
  const render = (cityName?: string) => renderToStaticMarkup(<RestaurantDetail
    place={{...google, cityName, address:'İstanbul Street'}} lang="en" city="İstanbul" text={(_, en) => en}
    directions="Directions" onExpired={() => {}}/>);
  expect(render('Antalya')).toContain('Add to day plan');
  expect(render('Antalya')).toContain('Antalya');
  expect(render('安塔利亚省')).toContain('Antalya');
  expect(render()).not.toContain('Add to day plan');
  expect(render('Ankara')).not.toContain('Add to day plan');
});

it('persists Google identity and a visitor nickname without retaining provider content or leaking the nickname into directions', () => {
  const saved = restaurantStop(google, 'Lunch with family')!;
  const expected = {kind: 'google', id: 'google:DemoPlace', nickname: 'Lunch with family'};
  expect(saved).toEqual(expected);
  const oldData = JSON.stringify([{...google, ...saved}, {kind: 'google', id: 'bad'}, null, {kind: 'editorial', ...google}, gate, square, square]);
  expect(readPlan(oldData, 'İstanbul')).toEqual([expected, square]);
  expect(readPlan('broken', 'Antalya')).toEqual([]);
  const href = new URL(directionsHref('İstanbul', saved, museum));
  expect(href.searchParams.get('origin')).toBe('Ayasofya, İstanbul, Türkiye');
  expect(href.searchParams.get('destination_place_id')).toBe('DemoPlace');
  expect(href.searchParams.get('destination')).toBeTruthy();
  expect(href.href).not.toMatch(/family|Provider/);
  expect(new URL(directionsHref('İstanbul', square, saved)).searchParams.get('origin_place_id')).toBe('DemoPlace');
});

it('uses a reviewed CMS restaurant location for directions to the selected branch', () => {
  const place = editorialPlace({
    id:'aaaa0000-0000-4000-b000-000000000001', name:'Editorial restaurant', address:'Reviewed address', description:'Our review',
    active:true, status:'PUBLISHED', city:{active:true, status:'PUBLISHED'}, editorial_metadata:{coordinates:{lat:41.01,lng:28.99}},
  }, 'restaurants', {lat:41.01,lng:28.99}, 100)!;
  const stop = restaurantStop(place)!;
  expect(stop).toEqual({kind:'editorial', id:place.id, label:'Editorial restaurant', lat:41.01, lng:28.99});
  expect(readPlan(JSON.stringify([stop]), 'İstanbul')).toEqual([stop]);
  expect(new URL(directionsHref('İstanbul', stop)).searchParams.get('destination')).toBe('41.01,28.99');
  expect(restaurantStop({...google, category: 'hotel'})).toBeNull();
});

it('routes between consecutive stops in the chosen order and starts the first leg from the traveller’s location', () => {
  const current = appendStops([square], [square, museum]);
  expect(current).toEqual([square, museum]);
  const next = moveStop(current, museum.id, -1);
  expect(next).toEqual([museum, square]);
  expect(moveStop(next, museum.id, -1)).toEqual(next);
  expect(moveStop(next, 'missing', 1)).toEqual(next);
  const first = new URL(directionsHref('İstanbul', next[0]));
  expect(first.searchParams.has('origin')).toBe(false);
  const second = new URL(directionsHref('İstanbul', next[1], next[0]));
  expect(second.searchParams.get('origin')).toBe('Ayasofya, İstanbul, Türkiye');
  expect(second.searchParams.get('destination')).toBe('Sultanahmet Meydanı, İstanbul, Türkiye');
  expect(second.searchParams.get('travelmode')).toBe('walking');
});

it('re-reads the latest saved list for every edit and clears only the active city’s data', async () => {
  const values = new Map<string, string>();
  vi.stubGlobal('window', Object.assign(new EventTarget(), {navigator: {}, localStorage: {
    getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v), removeItem: (k: string) => values.delete(k),
  }}));
  await editDayPlan('İstanbul', current => appendStops(current, [square]));
  await editDayPlan('Antalya', current => appendStops(current, [gate]));
  await editDayPlan('İstanbul', current => appendStops(current, [museum]));
  expect([...values.values()].map(raw => JSON.parse(raw))).toEqual([[square, museum], [gate]]);
  await editDayPlan('İstanbul', current => current.filter(stop => stop.id !== square.id));
  expect([...values.values()].map(raw => JSON.parse(raw))).toEqual([[museum], [gate]]);
  await editDayPlan('İstanbul', () => []);
  expect([...values.values()].map(raw => JSON.parse(raw))).toEqual([[gate]]);
});
