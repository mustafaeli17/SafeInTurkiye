import records from '../data/directory.json';
import regionalHotels from '../data/regionalHotels.json';
import regionalRestaurants from '../data/regionalRestaurants.json';
import regionalActivities from '../data/regionalActivities.json';
import cityGuides from '../data/cityGuides.json';
import { safeWebsite } from '../services/nearbyPlaces';
export interface DirectoryEntry {
  id:string; kind:string; slug:string; name:string; city:string;
  description:Record<string,string>; website:string; sourceUrl:string;
  lastVerified:string|null; gallery:string[]; imageUrl?:string; address?:string; phone?:string; openingHours?:string; category?:string;
}
export const curatedDirectory:DirectoryEntry[]=[...records,...regionalHotels.map(hotel=>({...hotel,id:hotel.slug,kind:'hotels',sourceUrl:hotel.sourceUrl??hotel.website,lastVerified:'2026-09-28',gallery:[]})),...regionalActivities.map(activity=>{const source=cityGuides.find(city=>city.name===activity.city)!.source;return {...activity,id:activity.slug,kind:'activities',website:source,sourceUrl:source,lastVerified:'2026-09-28'};})];
curatedDirectory.push(...regionalRestaurants.map(restaurant=>({...restaurant,id:restaurant.slug,kind:'restaurants',sourceUrl:restaurant.website,lastVerified:'2026-09-28',gallery:[]})));
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
