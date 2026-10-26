import {reservationStaff,reservationOrigin,reservationDb,withinReservationBudget} from '../server/restaurantRequests.js';
import type {ReservationHttpRequest,ReservationHttpResponse} from '../server/restaurantRequests.js';
import {validBusinessKey,businessKeyFromSource} from '../src/lib/businessIdentity.js';
export default async function handler(req:ReservationHttpRequest,res:ReservationHttpResponse){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 if(!reservationOrigin(req)||!await reservationStaff(req))return res.status(403).json({error:'NOT_ALLOWED'});
 if(!withinReservationBudget(req))return res.status(429).json({error:'BUSY'});
 try{
  const input=typeof req.body==='string'?JSON.parse(req.body):req.body as any;
  if(!input||JSON.stringify(input).length>2000)return res.status(400).json({error:'INVALID_INPUT'});
  let key=validBusinessKey(input.key)?input.key:businessKeyFromSource(String(input.source??''));
  // Older CMS requests retained their canonical source URL, rather than an ID.
  if(!key&&typeof input.source==='string'){
   const url=new URL(input.source),match=url.pathname.match(/^\/(hotels|restaurants|activities)\/([a-z0-9-]+)$/);
   if(['safeinturkiye.com','www.safeinturkiye.com'].includes(url.hostname)&&match){
    const rows=await reservationDb(`published_editorial_businesses?select=id&kind=eq.${match[1]}&slug=eq.${encodeURIComponent(match[2])}&limit=1`);
    if(rows[0])key=match[1]+'/'+rows[0].id;
   }
  }
  if(!key)return res.status(404).json({error:'NOT_FOUND'});
  if(key.startsWith('google/')){
   const apiKey=process.env.GOOGLE_PLACES_API_KEY;if(!apiKey)return res.status(503).json({error:'UNAVAILABLE'});
   const response=await fetch('https://places.googleapis.com/v1/places/'+encodeURIComponent(key.slice(7))+'?languageCode=tr',{
    headers:{'X-Goog-Api-Key':apiKey,'X-Goog-FieldMask':'id,displayName,formattedAddress,addressComponents,internationalPhoneNumber,websiteUri,googleMapsUri,attributions'},signal:AbortSignal.timeout(8000)});
   if(!response.ok)return res.status(response.status===404?404:503).json({error:'UNAVAILABLE'});
   const place=await response.json();if(place.id!==key.slice(7)||!place.displayName?.text)return res.status(503).json({error:'UNAVAILABLE'});
   const city=place.addressComponents?.find((c:any)=>c.types?.includes('administrative_area_level_1'))?.longText;
   return res.status(200).json({name:place.displayName.text,city,address:place.formattedAddress,phone:place.internationalPhoneNumber,website:place.websiteUri,map:place.googleMapsUri,provider:'Google Maps',attributions:place.attributions??[]});
  }
  const [kind,id]=key.split('/');const rows=await reservationDb(`published_editorial_businesses?select=name,address,website,editorial_metadata,city_id&kind=eq.${kind}&id=eq.${id}&limit=1`);
  if(!rows[0])return res.status(404).json({error:'NOT_FOUND'});
  const b=rows[0],cities=b.city_id?await reservationDb(`cities?select=name&id=eq.${encodeURIComponent(b.city_id)}&limit=1`):[];
  return res.status(200).json({name:b.name,city:cities[0]?.name,address:b.address,website:b.website,phone:b.editorial_metadata?.phone,provider:'SafeInTürkiye CMS'});
 }catch{return res.status(503).json({error:'UNAVAILABLE'});}
}
