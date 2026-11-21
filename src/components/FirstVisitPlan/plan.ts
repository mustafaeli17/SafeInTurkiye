import type {NearbyPlaceRecord} from '../../services/nearbyPlaces';
import {isEditorialPlace, validEditorialDetailId} from '../../lib/editorialDiscovery';
import {isValidCenter} from '../../services/nearbyPlaces';
import type {PlanCity} from './titles';
export {isPlanCity, type PlanCity} from './titles';

export const walks = {
  'İstanbul': [['square', 'ayasofya'], ['karakoy', 'galata']],
  Antalya: [['gate', 'oldTown', 'harbour']],
} as const satisfies Record<PlanCity, readonly (readonly string[])[]>;
export type Landmark = (typeof walks)[PlanCity][number][number];

const mapNames: Record<Landmark, string> = {
  square: 'Sultanahmet Meydanı', ayasofya: 'Ayasofya', karakoy: 'Karaköy', galata: 'Galata Kulesi',
  gate: 'Hadrian Kapısı', oldTown: 'Kaleiçi', harbour: 'Kaleiçi Yat Limanı',
};
type WalkStop = {kind: 'landmark'; id: Landmark};
type GoogleStop = {kind: 'google'; id: string; nickname: string};
type EditorialStop = {kind: 'editorial'; id: string; label: string; lat: number; lng: number};
export type DayStop = WalkStop | GoogleStop | EditorialStop;
const googleId = /^google:[A-Za-z0-9_-]{1,250}$/;
const shortText = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 100) : '';

/** Only the ID comes from a Google record. A nickname is entered by the visitor. */
export function restaurantStop(place: NearbyPlaceRecord, nickname = ''): DayStop | null {
  if (place.category !== 'restaurant') return null;
  if (googleId.test(place.id)) return {kind: 'google', id: place.id, nickname: shortText(nickname)};
  if (isEditorialPlace(place) && place.id.startsWith('cms:restaurants:') && validEditorialDetailId(place.id) && isValidCenter(place.coordinates)) {
    return {kind: 'editorial', id: place.id, label: shortText(place.name), lat: place.coordinates.lat, lng: place.coordinates.lng};
  }
  return null;
}

/** Validate stored input and project onto the fields owned by each source. */
export function readPlan(raw: string | null, city: PlanCity): DayStop[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const landmarks: readonly string[] = walks[city].flat();
    const stops = new Map<string, DayStop>();
    for (const entry of parsed) {
      if (!entry || typeof entry.id !== 'string' || stops.has(entry.id)) continue;
      if (entry.kind === 'landmark' && landmarks.includes(entry.id)) {
        stops.set(entry.id, {kind: 'landmark', id: entry.id as Landmark});
      } else if (entry.kind === 'google' && googleId.test(entry.id)) {
        stops.set(entry.id, {kind: 'google', id: entry.id, nickname: shortText(entry.nickname)});
      } else if (entry.kind === 'editorial' && entry.id.startsWith('cms:restaurants:') && validEditorialDetailId(entry.id) && isValidCenter(entry)) {
        stops.set(entry.id, {kind: 'editorial', id: entry.id, label: shortText(entry.label), lat: entry.lat, lng: entry.lng});
      }
    }
    return [...stops.values()];
  } catch {
    return [];
  }
}

export function appendStops(current: DayStop[], additions: DayStop[]): DayStop[] {
  const ids = new Set(current.map(stop => stop.id));
  const next = current.slice();
  for (const stop of additions) {
    if (ids.has(stop.id)) continue;
    ids.add(stop.id);
    next.push(stop);
  }
  return next;
}

export function moveStop(current: DayStop[], id: string, offset: -1 | 1): DayStop[] {
  const start = current.findIndex(stop => stop.id === id);
  const end = start + offset;
  if (start < 0 || end < 0 || end >= current.length) return current;
  const next = current.slice();
  [next[start], next[end]] = [next[end], next[start]];
  return next;
}

export function directionsHref(city: PlanCity, destination: DayStop, origin?: DayStop) {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  function endpoint(key: 'origin' | 'destination', stop: DayStop) {
    if (stop.kind === 'google') {
      url.searchParams.set(key, 'Restaurant, ' + city + ', Türkiye');
      url.searchParams.set(key + '_place_id', stop.id.slice(7));
    } else if (stop.kind === 'editorial') {
      url.searchParams.set(key, stop.lat + ',' + stop.lng);
    } else {
      url.searchParams.set(key, mapNames[stop.id] + ', ' + city + ', Türkiye');
    }
  }
  endpoint('destination', destination);
  if (origin) endpoint('origin', origin);
  if (origin?.kind === 'landmark' && destination.kind === 'landmark' &&
    walks[city].some((walk: readonly string[]) => walk.includes(origin.id) && walk.includes(destination.id))) {
    url.searchParams.set('travelmode', 'walking');
  }
  return url.href;
}
