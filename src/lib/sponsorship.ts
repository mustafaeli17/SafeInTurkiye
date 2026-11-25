import {publicCities} from './publicRoutes'
import {isRetiredDirectoryEntry} from './retiredDirectory'
import {destinationSlug} from './discoveryNavigation'
import {searchDestinations} from './searchDestinations'
import {isValidCenter, type NearbyCenter} from '../services/nearbyPlaces'

export type SponsorKind='hotels'|'restaurants'|'activities'
export type SponsorContext='city'|SponsorKind
export type SponsorCity={id:string;name:string}
export type SponsorBusiness={id:string;kind:SponsorKind;name:string;slug:string;city_id:string|null;description?:string|null;address?:string|null;website?:string|null;editorial_metadata?:{coordinates?:NearbyCenter;sourceUrl?:string}|null}
export type Placement={id:string;business_id:string;business_kind:SponsorKind;context:SponsorContext;starts_at:string;ends_at:string;priority:number;active:boolean}
export const contextNames:Record<SponsorContext,string>={city:'Şehir rehberi',hotels:'Oteller',restaurants:'Restoranlar',activities:'Aktiviteler'}
export const statusNames={scheduled:'Planlandı',live:'Gösterime uygun',expired:'Süresi doldu',paused:'Duraklatıldı',unavailable:'Yayına uygun değil'}
export const metricNames={impression:'Kart gösterimi',detail_open:'Detay açılması',phone_click:'Telefon tıklaması',website_click:'Site tıklaması',directions_click:'Yol tarifi',reservation_started:'Başlatılan talep',reservation_submitted:'Gönderilen talep'}

export function placementStatus(row:Placement,eligible:boolean,now=Date.now()):keyof typeof statusNames {
 if(Date.parse(row.ends_at)<=now)return 'expired'
 if(!row.active)return 'paused'
 if(!eligible)return 'unavailable'
 return Date.parse(row.starts_at)>now?'scheduled':'live'
}

export function placementContextPath(context:SponsorContext,city:SponsorCity|undefined){
 if(!city)return null
 if(context==='city'){
  const route=publicCities.find(item=>item.name===city.name)
  return route?'/cities/'+route.slug:null
 }
 return city.name in searchDestinations?'/'+context+'?city='+destinationSlug(city.name):'/'+context
}

export function sponsorContexts(business:SponsorBusiness|undefined,city:SponsorCity|undefined):SponsorContext[]{
 if(!business?.name?.trim()||!city||!business.slug||isRetiredDirectoryEntry(business.kind,business.slug))return []
 const result:SponsorContext[]=[]
 if(placementContextPath('city',city))result.push('city')
 const coordinates=business.editorial_metadata?.coordinates
 if(business.address?.trim()&&business.description?.trim()&&coordinates&&isValidCenter(coordinates))result.push(business.kind)
 return result
}

const offset=3*60*60*1000
export function placementDateInput(timestamp:string) {
 const local=new Date(Date.parse(timestamp)+offset)
 if(!Number.isFinite(local.getTime()))return ''
 return local.toISOString().slice(0,-1).replace(/\.000$/,'')
  .replace(/(T\d{2}:\d{2}):00$/,'$1')
}
export function placementTimestamp(value:string){
 if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(value))return null
 const timestamp=Date.parse(value+'+03:00')
 if(!Number.isFinite(timestamp)||new Date(timestamp+offset).toISOString().slice(0,16)!==value.slice(0,16))return null
 return new Date(timestamp).toISOString()
}
export function placementDateLabel(timestamp:string){
 return new Intl.DateTimeFormat('tr-TR',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Istanbul'}).format(new Date(timestamp))
}
