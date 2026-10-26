import {distanceInMeters,isValidCenter,safeTelephone,safeWebsite} from '../services/nearbyPlaces';
import type {NearbyCategory,NearbyCenter,NearbyPlaceRecord} from '../services/nearbyPlaces';
import {isRetiredDirectoryEntry} from './retiredDirectory';

export const editorialTables=['hotels','restaurants','activities','museums','attractions','exchange_offices'] as const;
export type EditorialTable=typeof editorialTables[number];
export type EditorialMetadata={slug?:string;coordinates?:NearbyCenter;googlePlaceId?:string;phone?:string;openingHours?:string;category?:NearbyCategory;description?:Record<string,string>;imageRights?:string;imageSource?:string;gallery?:string[]};
export type EditorialRow={id:string;name:string;description?:string|null;address?:string|null;website?:string|null;image_url?:string|null;editorial_metadata?:EditorialMetadata|null;public_slug?:string|null;active:boolean;status:string;city_id?:string|null;city?:{name?:string;slug?:string;active?:boolean;status?:string}|null;updated_at?:string};
export type EditorialPlace=NearbyPlaceRecord&{editorial:{table:EditorialTable;description:Record<string,string>;fallbackDescription:string;image:string|null;gallery:string[];imageRights:string;imageSource:string|null;googlePlaceId:string|null;sponsored:boolean}};
const categories:Record<EditorialTable,NearbyCategory>={hotels:'hotel',restaurants:'restaurant',activities:'activity',museums:'museum',attractions:'attraction',exchange_offices:'bureau_de_change'};
export const editorialId=(table:EditorialTable,id:string)=>`cms:${table}:${id}`;
export function validEditorialDetailId(id:string){return /^cms:(hotels|restaurants|activities|museums|attractions|exchange_offices):[a-f0-9-]{36}$/.test(id);}
export function editorialTablesFor(category:'all'|NearbyCategory):EditorialTable[]{return category==='all'?[...editorialTables]:category==='activity'?['activities','museums','attractions']:category==='museum'?['museums','activities']:category==='attraction'?['attractions','activities']:category==='hotel'?['hotels']:category==='restaurant'?['restaurants']:category==='bureau_de_change'?['exchange_offices']:['historical','park','cinema','entertainment'].includes(category)?['activities']:[];}
export function secureEditorialImage(value:unknown):string|null{const url=safeWebsite(value);if(!url?.startsWith('https://'))return null;const parsed=new URL(url);return /(^|\.)(googleusercontent\.com|ggpht\.com|maps\.googleapis\.com|places\.googleapis\.com)$/.test(parsed.hostname)||parsed.pathname==='/api/place-photo'?null:url;}
export function editorialPlace(row:EditorialRow,table:EditorialTable,point:NearbyCenter,radius:number,sponsored=false):EditorialPlace|null{
 if(!row.active||row.status!=='PUBLISHED'||!row.city?.active||row.city.status!=='PUBLISHED'||isRetiredDirectoryEntry(table,row.public_slug??row.editorial_metadata?.slug)||!row.name.trim()||!row.address?.trim()||!row.description?.trim())return null;
 const m=row.editorial_metadata??{},coordinates=m.coordinates;
 if(!coordinates||!isValidCenter(coordinates))return null;
 const distance=distanceInMeters(point,coordinates);if(distance>radius)return null;
 const phone=safeTelephone(m.phone),website=safeWebsite(row.website),sourceUrl=website??`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
 const category=table==='activities'&&['activity','museum','historical','park','cinema','entertainment','attraction'].includes(m.category??'')?m.category!:categories[table];
 const imageRights=typeof m.imageRights==='string'?m.imageRights.trim():'';
 const image=imageRights?secureEditorialImage(row.image_url):null;
 const gallery=imageRights&&Array.isArray(m.gallery)?m.gallery.map(secureEditorialImage).filter((url):url is string=>!!url).slice(0,12):[];
 const descriptions=Object.fromEntries(Object.entries(m.description??{}).filter(([key,value])=>['tr','en','es','de','fr','ar','ru','zh'].includes(key)&&typeof value==='string'&&value.trim()));
 const googlePlaceId=typeof m.googlePlaceId==='string'&&/^[A-Za-z0-9_-]{1,250}$/.test(m.googlePlaceId)?m.googlePlaceId:null;
 return {id:editorialId(table,row.id),name:row.name,category,coordinates,distanceMeters:distance,address:row.address,phone:phone?.phone??null,telephoneUrl:phone?.telephoneUrl??null,website,openingHours:typeof m.openingHours==='string'?m.openingHours:null,sourceUrl,editorial:{table,description:descriptions,fallbackDescription:row.description,image,gallery:[...new Set([...(image?[image]:[]),...gallery])],imageRights,imageSource:secureEditorialImage(m.imageSource),googlePlaceId,sponsored}};
}
export function isEditorialPlace(place:NearbyPlaceRecord):place is EditorialPlace{return 'editorial' in place;}
export function matchesDiscoveryCategory(place:NearbyPlaceRecord,filter:'all'|NearbyCategory){return filter==='all'||place.category===filter||filter==='activity'&&['activity','museum','historical','park','cinema','entertainment','attraction'].includes(place.category);}
// Explicit Google identity only. Never merge different businesses by name or distance.
// Google's photos, ratings and hours are not copied into CMS records.
export function combineDiscovery(google:NearbyPlaceRecord[],editorial:EditorialPlace[],filter:'all'|NearbyCategory){
 const identities=new Set<string>(),ids=new Set<string>();
 const own=editorial.filter(p=>{if(!matchesDiscoveryCategory(p,filter)||ids.has(p.id)||p.editorial.googlePlaceId&&identities.has(p.editorial.googlePlaceId))return false;ids.add(p.id);if(p.editorial.googlePlaceId)identities.add(p.editorial.googlePlaceId);return true;});
 return [...own,...google.filter(p=>matchesDiscoveryCategory(p,filter)&&!(p.id.startsWith('google:')&&identities.has(p.id.slice(7))))].sort((a,b)=>Number(isEditorialPlace(b)&&b.editorial.sponsored)-Number(isEditorialPlace(a)&&a.editorial.sponsored)||a.distanceMeters-b.distanceMeters||a.id.localeCompare(b.id));
}
