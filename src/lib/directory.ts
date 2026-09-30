import records from '../data/directory.json';
import regionalHotels from '../data/regionalHotels.json';
import regionalRestaurants from '../data/regionalRestaurants.json';
import regionalActivities from '../data/regionalActivities.json';
import cityGuides from '../data/cityGuides.json';
import photoAlternatives from '../data/photoAlternatives.json';
import publication from '../data/photoPublication.json';
import cinemas from '../data/cinemas.json';
import { safeWebsite } from '../services/nearbyPlaces';
export interface DirectoryEntry {
  id:string; kind:string; slug:string; name:string; city:string;
  description:Record<string,string>; website:string; sourceUrl:string;
  lastVerified:string|null; gallery:string[]; imageUrl?:string; address?:string; phone?:string; openingHours?:string; category?:string;
}
const editorialArchive:DirectoryEntry[]=[...records,...regionalHotels.map(hotel=>({...hotel,id:hotel.slug,kind:'hotels',sourceUrl:hotel.sourceUrl??hotel.website,lastVerified:'2026-09-28',gallery:[]})),...regionalActivities.map(activity=>{const source=cityGuides.find(city=>city.name===activity.city)!.source;return {...activity,id:activity.slug,kind:'activities',website:source,sourceUrl:source,lastVerified:'2026-09-28'};}),...photoAlternatives];
editorialArchive.push(...cinemas.map(cinema=>({...cinema,id:cinema.slug,kind:'activities',category:'Cinema',gallery:['cinema-wide'],sourceUrl:cinema.website,lastVerified:'2026-09-29',description:{tr:'Güncel filmleri, seansları ve gösterim dilini sinemanın resmî sayfasından kontrol edin. Bilet işlemleri işletmenin sitesinde yapılır.',en:'Check current films, screening times and languages on the cinema’s official page. Ticket purchases take place on the operator’s website.'}})));
for(const entry of editorialArchive)if(entry.id.startsWith('cinema'))entry.category='Cinema';
editorialArchive.push(...regionalRestaurants.map(restaurant=>({...restaurant,id:restaurant.slug,kind:'restaurants',sourceUrl:restaurant.website,lastVerified:'2026-09-28',gallery:[]})));
const galleries:Record<string,string[]>=publication.galleries;
export const photoCuratedCatalog = publication.source === 'photo-curated';
// Recoverable editorial archive remains on disk. One explicit publication list
// governs listing, city pages, detail routes and generated sitemap.
export const curatedDirectory:DirectoryEntry[]=editorialArchive.filter(entry=>galleries[entry.id]?.length).map(entry=>({...entry,gallery:galleries[entry.id]}));
export const directory: DirectoryEntry[] = [...curatedDirectory];
for(const slug of ['koza-han','karatay-tile-museum']){
 const entry=curatedDirectory.find(item=>item.slug===slug);
 if(entry)entry.gallery=[slug];
}
export function registerPublishedEntry(row: {id:string;name:string;description?:string|null;address?:string|null;website?:string|null;image_url?:string|null;city?:{name?:string}|null}, kind:string): DirectoryEntry {
  const slugName=row.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'place';
  const website=safeWebsite(row.website)??'';
  const entry:DirectoryEntry={id:row.id,kind,slug:`${slugName}--${row.id}`,name:row.name,city:row.city?.name??'',description:{en:row.description??''},website,sourceUrl:website,lastVerified:null,gallery:[],address:row.address??undefined};
  if(row.image_url){try{const image=new URL(row.image_url);if(image.protocol==='https:'&&!image.username&&!image.password)entry.imageUrl=image.href;}catch{/* Invalid image URLs are not rendered. */}}
  const existing=directory.findIndex(item=>item.id===row.id);
  if(existing>=0)directory[existing]=entry;else directory.push(entry);
  return entry;
}
export const entryPath = (entry: DirectoryEntry) => `/${entry.kind}/${entry.slug}`;
export function directoryEntry(path: string) {
  return directory.find(entry => entryPath(entry) === path.replace(/\/$/, ''));
}
export function openDirectoryEntry(id: string) {
  const entry = directory.find(item => item.id === id);
  if (!entry) return false;
  window.history.pushState({}, '', entryPath(entry));
  window.dispatchEvent(new PopStateEvent('popstate'));
  return true;
}
