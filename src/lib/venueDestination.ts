import {isValidCenter, type NearbyCenter} from '../services/nearbyPlaces';
import {mentionedSearchCity,normalizeSearchText} from '../services/searchCities';
import {localizePath} from './searchLocales';
import {sectionPath} from './sectionNavigation';

export type VenueDestination = NearbyCenter & {label:string; mapQuery?:string; provider?:'google'};
export type PublicVenue = {name?:string|null; coordinates?:NearbyCenter|null; googlePlaceId?:string|null};
const placeIdPattern = /^[A-Za-z0-9_-]{1,250}$/;

export function venueDestination(venue:PublicVenue):VenueDestination|null {
  const label=venue.name?.trim(), point=venue.coordinates;
  if (!label || label.length>250 || !point || !isValidCenter(point)) return null;
  // Coarse guard for shared URLs. Tariff selection still uses the independently verified origin.
  if (point.lat<35 || point.lat>43 || point.lng<25 || point.lng>45) return null;
  const id=venue.googlePlaceId;
  return {label,lat:point.lat,lng:point.lng,...(id && placeIdPattern.test(id) ? {mapQuery:'place_id:'+id,provider:'google' as const} : {})};
}

// Only the public venue is shareable. A traveller's starting point stays in the form.
export function venueGuideCity(...names:(string|undefined)[]) {
  for(const name of names){
    if(!name) continue;
    const normalized=normalizeSearchText(name);
    if(/\bnevsehir\b|невшехир|نوشهر|نفسهير|内夫谢希尔/u.test(normalized)) return 'cappadocia';
    const city=mentionedSearchCity(name);
    if(city) return city;
  }
}

export function venueTravelHref(mode:'taxi'|'transit',destination:VenueDestination,lang:string,city?:string,fallbackCity?:string) {
  const params=new URLSearchParams({to:destination.label,toLat:String(destination.lat),toLng:String(destination.lng)});
  if (destination.mapQuery) params.set('toPlaceId',destination.mapQuery.slice('place_id:'.length));
  const citySlug=venueGuideCity(city,fallbackCity);
  if(citySlug) params.set('city',citySlug);
  return localizePath(sectionPath(mode)+'?'+params,lang);
}

export function readVenueDestination(query:string):VenueDestination|null {
  const params=new URLSearchParams(query);
  const lat=params.get('toLat')?.trim(),lng=params.get('toLng')?.trim();
  if (!lat || !lng || !/^-?\d+(\.\d+)?$/.test(lat) || !/^-?\d+(\.\d+)?$/.test(lng)) return null;
  return venueDestination({name:params.get('to'),coordinates:{lat:Number(lat),lng:Number(lng)},googlePlaceId:params.get('toPlaceId')});
}

// The taxi form stays mounted while comparing transit. Preserve an existing trip on browser Back.
export function changedTaxiVenue(section:string,query:string,previous:string|null) {
  if(section!=='taxi') return null;
  const destination=readVenueDestination(query);
  const signature=destination ? JSON.stringify(destination) : null;
  return signature===previous ? null : {destination,signature};
}
