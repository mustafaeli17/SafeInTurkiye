import { readLanguagePreference } from './languagePreference';
import { safeWebsite } from '../services/nearbyPlaces';
import {navigateTo} from './browserNavigation';
export interface DirectoryEntry {
  id:string; kind:string; slug:string; name:string; city:string;
  description:Record<string,string>; website:string; sourceUrl:string;
  lastVerified:string|null; gallery:string[]; imageUrl?:string; address?:string; phone?:string; openingHours?:string; category?:string;
}
// API discovery supplies public listings; only explicitly published CMS entries
// are registered here for sponsor detail pages. The pre-API catalog is retired.
export const curatedDirectory:DirectoryEntry[]=[];
export const directory:DirectoryEntry[]=[];
export function registerPublishedEntry(row: {id:string;name:string;description?:string|null;address?:string|null;website?:string|null;image_url?:string|null;public_slug?:string|null;editorial_metadata?:Partial<DirectoryEntry>|null;city?:{name?:string}|null}, kind:string): DirectoryEntry {
  const slugName=row.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'place';
  const website=safeWebsite(row.website)??'';
  const metadata=row.editorial_metadata??{};
  const entry:DirectoryEntry={id:row.id,kind,slug:row.public_slug??`${slugName}--${row.id}`,name:row.name,city:row.city?.name??metadata.city??'',description:{...metadata.description,en:row.description??''},website,sourceUrl:safeWebsite(metadata.sourceUrl)??website,lastVerified:metadata.lastVerified??null,gallery:Array.isArray(metadata.gallery)?metadata.gallery.filter(value=>typeof value==='string'):[],address:row.address??undefined,phone:metadata.phone,openingHours:metadata.openingHours,category:metadata.category};
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
  const prefix=readLanguagePreference()==='tr'&&entry.description.tr?'/tr':'';
  navigateTo(prefix+entryPath(entry));
  return true;
}
