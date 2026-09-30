import {safeWebsite} from '../services/nearbyPlaces';
// Temporarily withheld after two independent verification attempts failed.
// Retain original data for review; do not invent a replacement destination.
const withheld=new Set([
 'https://www.hilton.com/en-gb/hotels/xkukudi-doubletree-kusadasi/',
 'https://www.rixos.com/en/hotel-resort/rixos-downtown-antalya',
 'https://www.rixos.com/rixos-downtown-antalya-hotel-faqs',
]);
export function catalogWebsite(value:string){
 const url=safeWebsite(value);return url&&!withheld.has(url)?url:null;
}
