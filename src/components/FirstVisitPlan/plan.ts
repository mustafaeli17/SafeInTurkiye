import type {NearbyPlaceRecord} from '../../services/nearbyPlaces';
import {isEditorialPlace, validEditorialDetailId} from '../../lib/editorialDiscovery';
import type {DirectoryEntry} from '../../lib/directory';
import {isRetiredDirectoryEntry} from '../../lib/retiredDirectory';
import {isValidCenter} from '../../services/nearbyPlaces';
import {publicCities} from '../../lib/publicRoutes';
import {mentionedSearchCity} from '../../services/searchCities';
import {isPlanCity, type PlanCity} from './titles';
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
export const planSlots = ['hotel', 'breakfast', 'lunch', 'dinner', 'dessert', 'tour', 'museum', 'activity', 'cinema'] as const;
export type PlanSlot = typeof planSlots[number];
export type PlanSection = 'restaurants' | 'hotels' | 'activities';
type WalkStop = {kind: 'landmark'; id: Landmark};
type GoogleStop = {kind: 'google'; id: string; nickname: string; detailCategory?: 'cafe'};
type EditorialStop = {kind: 'editorial'; id: string; label: string; lat: number; lng: number};
type DirectoryStop = {kind: 'directory'; id: string; section: PlanSection; slug: string; label: string; hasTurkish?: true};
type ManualStop = {kind: 'manual'; id: string; label: string};
type TourStop = {kind: 'tour'; id: string; url: string; nickname: string};
type Schedule = {date?: string; slot?: PlanSlot};
export type DayStop = (WalkStop | GoogleStop | EditorialStop | DirectoryStop | ManualStop | TourStop) & Schedule & {section?: PlanSection};
const googleId = /^google:[A-Za-z0-9_-]{1,250}$/;
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const shortText = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 100) : '';
const isSlot = (value: unknown): value is PlanSlot => planSlots.some(slot => slot === value);
const isSection = (value: unknown): value is PlanSection => value === 'restaurants' || value === 'hotels' || value === 'activities';
export function validPlanDate(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const time = Date.parse(date + 'T12:00:00Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date;
}

export function planCityForName(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const slug = mentionedSearchCity(value);
  return publicCities.find(city => city.slug === slug)?.name ?? null;
}

function editorialSection(id: string): PlanSection | undefined {
  if (!validEditorialDetailId(id)) return;
  const table = id.split(':')[1];
  if (table === 'restaurants' || table === 'hotels') return table;
  if (table === 'activities' || table === 'attractions' || table === 'museums') return 'activities';
}

export function placeStop(place: NearbyPlaceRecord, section: PlanSection, nickname = ''): DayStop | null {
  const canSave = section === 'restaurants' ? ['restaurant', 'cafe'].includes(place.category) :
    section === 'hotels' ? place.category === 'hotel' :
    ['attraction', 'activity', 'historical', 'park', 'museum', 'cinema', 'entertainment'].includes(place.category);
  if (!canSave) return null;
  // Record our directory and the user's itinerary choice; never copy Google display content.
  const slot: PlanSlot = section === 'restaurants' ? 'lunch' : section === 'hotels' ? 'hotel' :
    place.category === 'museum' || place.category === 'cinema' ? place.category : 'activity';
  if (googleId.test(place.id)) return {kind: 'google', id: place.id, nickname: shortText(nickname), section, slot,
    ...(place.category === 'cafe' ? {detailCategory: 'cafe' as const} : {})};
  if (isEditorialPlace(place) && editorialSection(place.id) === section && isValidCenter(place.coordinates)) {
    return {kind: 'editorial', id: place.id, label: shortText(place.name), lat: place.coordinates.lat, lng: place.coordinates.lng, section, slot};
  }
  return null;
}

export function slotForStop(stop: DayStop): PlanSlot {
  if (stop.slot) return stop.slot;
  if (stop.kind === 'tour') return 'tour';
  if (stop.kind === 'landmark' || stop.kind === 'manual') return 'activity';
  return stop.section === 'hotels' ? 'hotel' : stop.section === 'activities' ? 'activity' : 'lunch';
}

function publishedStop(section: unknown, id: string, slug: unknown, name: unknown, hasTurkish: boolean): DirectoryStop | null {
  const label = shortText(name);
  if (!isSection(section) || !label || typeof slug !== 'string' || !/^[a-z0-9]+(?:-{1,2}[a-z0-9]+)*$/.test(slug) || isRetiredDirectoryEntry(section,slug)) return null;
  const prefix = `cms:${section}:`;
  if (!id.startsWith(prefix) || !uuid.test(id.slice(prefix.length))) return null;
  return {kind:'directory', section, id, slug, label, ...(hasTurkish ? {hasTurkish:true as const} : {})};
}

export function directoryStop(entry: DirectoryEntry): DayStop | null {
  const stop = publishedStop(entry.kind,'cms:'+entry.kind+':'+entry.id,entry.slug,entry.name,Boolean(entry.description.tr?.trim()));
  if (!stop) return null;
  const category = entry.category?.trim().toLowerCase();
  const slot = stop.section === 'activities' && (category === 'museum' || category === 'museum & culture') ? 'museum' :
    stop.section === 'activities' && category === 'cinema' ? 'cinema' : slotForStop(stop);
  return {...stop,slot};
}

export function manualStop(label: string, slot: PlanSlot, date?: string): DayStop | null {
  const name = shortText(label);
  if (!name || !isSlot(slot) || (date && !validPlanDate(date))) return null;
  return {kind: 'manual', id: 'manual:' + crypto.randomUUID(), label: name, slot, ...(date ? {date} : {})};
}

export function tourStop(code: string, productUrl: string, nickname = ''): DayStop | null {
  if (typeof code !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(code)) return null;
  try {
    const url = new URL(productUrl);
    if (url.origin !== 'https://www.viator.com' || url.username || url.password || !url.searchParams.get('pid') ||
      !/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:tours|search)\/[^/]/i.test(url.pathname)) return null;
    // Keep partner attribution for the public product; discard fragments and unrelated query data.
    const affiliate = new URL(url.pathname, url.origin);
    for (const key of ['pid', 'mcid', 'medium', 'campaign']) {
      const value = url.searchParams.get(key);
      if (value) affiliate.searchParams.set(key, value);
    }
    return {kind: 'tour', id: 'viator:' + code, url: affiliate.href, nickname: shortText(nickname), slot: 'tour'};
  } catch { return null; }
}

export function entryKey(stop: DayStop): string {
  return [stop.id, stop.date || '', slotForStop(stop)].join('|');
}

export function stopDetailPath(city: string, stop: DayStop): string | null {
  if (stop.kind === 'directory') return '/' + stop.section + '/' + stop.slug;
  if (stop.kind !== 'google' && stop.kind !== 'editorial') return null;
  const slug = publicCities.find(item => item.name === city)?.slug;
  if (!slug) return null;
  const params = new URLSearchParams({city: slug, place: stop.id});
  if (stop.kind === 'google' && stop.detailCategory === 'cafe') {
    params.set('category', 'cafe');
    return '/near-me?' + params;
  }
  // The broad activity filter accepts all supported subtypes, regardless of the last directory filter.
  if (stop.section === 'activities') params.set('category', 'activity');
  return '/' + (stop.section ?? 'restaurants') + '?' + params;
}

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
export function readPlan(raw: string | null, city: string): DayStop[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const landmarks: readonly string[] = isPlanCity(city) ? walks[city].flat() : [];
    const stops = new Map<string, DayStop>();
    for (const entry of parsed) {
      if (!entry || typeof entry.id !== 'string') continue;
      let stop: DayStop | null = null;
      if (entry.kind === 'landmark' && landmarks.includes(entry.id)) {
        stop = {kind: 'landmark', id: entry.id as Landmark};
      } else if (entry.kind === 'google' && googleId.test(entry.id)) {
        stop = {kind: 'google', id: entry.id, nickname: shortText(entry.nickname)};
        if (isSection(entry.section)) stop.section = entry.section;
        if (entry.section === 'restaurants' && entry.detailCategory === 'cafe') stop.detailCategory = 'cafe';
      } else if (entry.kind === 'editorial' && editorialSection(entry.id) && isValidCenter(entry)) {
        stop = {kind: 'editorial', id: entry.id, label: shortText(entry.label), lat: entry.lat, lng: entry.lng};
        const section = editorialSection(entry.id);
        if (section !== 'restaurants' || entry.section === section) stop.section = section;
      } else if (entry.kind === 'directory') {
        stop = publishedStop(entry.section,entry.id,entry.slug,entry.label,entry.hasTurkish === true);
      } else if (entry.kind === 'manual' && entry.id.startsWith('manual:') && uuid.test(entry.id.slice(7)) && shortText(entry.label)) {
        stop = {kind: 'manual', id: entry.id, label: shortText(entry.label)};
      } else if (entry.kind === 'tour' && entry.id.startsWith('viator:')) {
        stop = tourStop(entry.id.slice(7), entry.url, entry.nickname);
      }
      if (!stop) continue;
      if (validPlanDate(entry.date)) stop.date = entry.date;
      if (isSlot(entry.slot)) stop.slot = entry.slot;
      const key = entryKey(stop);
      if (!stops.has(key)) stops.set(key, stop);
    }
    return [...stops.values()];
  } catch {
    return [];
  }
}

export function appendStops(current: DayStop[], additions: DayStop[]): DayStop[] {
  const ids = new Set(current.map(entryKey));
  const next = current.slice();
  for (const stop of additions) {
    const key = entryKey(stop);
    if (ids.has(key)) continue;
    ids.add(key);
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

export function assignStop(current: DayStop[], key: string, change: Schedule): DayStop[] {
  const index = current.findIndex(stop => entryKey(stop) === key);
  if (index < 0 || (change.date && !validPlanDate(change.date)) || (change.slot !== undefined && !isSlot(change.slot))) return current;
  const updated = {...current[index], ...change};
  if (!updated.date) delete updated.date;
  if (current.some((stop, i) => i !== index && entryKey(stop) === entryKey(updated))) return current;
  return current.map((stop, i) => i === index ? updated : stop);
}

export function moveDayStop(current: DayStop[], key: string, offset: -1 | 1): DayStop[] {
  const start = current.findIndex(stop => entryKey(stop) === key);
  if (start < 0) return current;
  // Days can be interleaved in storage. Swap with the next stop on this same day.
  let end = start + offset;
  while (end >= 0 && end < current.length && current[end].date !== current[start].date) end += offset;
  if (end < 0 || end >= current.length) return current;
  const next = current.slice();
  [next[start], next[end]] = [next[end], next[start]];
  return next;
}

export function directionsHref(city: string, destination: DayStop, origin?: DayStop) {
  if (destination.kind === 'manual' || destination.kind === 'tour' || destination.kind === 'directory') return '';
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  function endpoint(key: 'origin' | 'destination', stop: DayStop) {
    if (stop.kind === 'google') {
      url.searchParams.set(key, city + ', Türkiye');
      url.searchParams.set(key + '_place_id', stop.id.slice(7));
    } else if (stop.kind === 'editorial') {
      url.searchParams.set(key, stop.lat + ',' + stop.lng);
    } else if (stop.kind === 'landmark') {
      url.searchParams.set(key, mapNames[stop.id] + ', ' + city + ', Türkiye');
    }
  }
  endpoint('destination', destination);
  if (origin) endpoint('origin', origin);
  if (isPlanCity(city) && origin?.kind === 'landmark' && destination.kind === 'landmark' &&
    walks[city].some((walk: readonly string[]) => walk.includes(origin.id) && walk.includes(destination.id))) {
    url.searchParams.set('travelmode', 'walking');
  }
  return url.href;
}
