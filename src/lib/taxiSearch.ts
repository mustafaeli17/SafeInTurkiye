import {taxiCityFromAddress} from './taxiCity'
/** Search across Türkiye, without silently preferring İstanbul streets.
 * Both inputs use the same country scope; the selected result supplies its province.
 */
export function taxiSearchUrl(query:string):string {
 const params=new URLSearchParams({q:query.trim(),limit:'10',countrycode:'TR'});
 return `https://photon.komoot.io/api/?${params}`;
}

const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ı/g,'i').trim()
function preferredKind(query:string):string|undefined {
 const q=normalize(query)
 // Explicit sub-place searches must not silently become a different destination.
 if(/metro|tram|station|durak|istasyon|yolu|cadd|sokak|road|street|misafir|salon|terminal|parking|otopark|hotel|otel/.test(q))return undefined
 if(/havalimani|havaalani|airport|aeropuerto|aeroport|flughafen|аэропорт|مطار|机场/.test(q))return 'aerodrome'
 if(/hastane|hospital|hopital|krankenhaus|больниц|مستشفى|医院/.test(q))return 'hospital'
 if(/muze|museum|museo|musee|музе|متحف|博物馆/.test(q))return 'museum'
 return undefined
}
export function parseTaxiPlaces(data: unknown, query=''): {label:string;lat:number;lng:number;city:string}[] {
 const features=(data as {features?:unknown[]}|null)?.features
 if(!Array.isArray(features))return []
 const seen=new Set<string>()
 const preferred=preferredKind(query)
 return features.flatMap(feature=>{
  const f=feature as {geometry?:{coordinates?:unknown[]};properties?:Record<string,unknown>}|null
  if(!Array.isArray(f?.geometry?.coordinates))return []
  const [lng,lat]=f.geometry.coordinates
  const p=f?.properties??{}
  if(typeof p.countrycode==='string'&&p.countrycode.toLowerCase()!=='tr')return []
  if(typeof lat!=='number'||typeof lng!=='number'||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return []
  const parts=[p.name,p.street,p.housenumber,p.district,p.city,p.state,p.country].flatMap(v=>typeof v==='string'&&v.trim()?[v.trim()]:typeof v==='number'&&Number.isFinite(v)?[String(v)]:[])
  const label=parts.filter((v,i,a)=>a.findIndex(other=>normalize(other)===normalize(v))===i).join(', ')
  const id=`${lat},${lng},${label}`
  if(!label||seen.has(id))return []
  seen.add(id)
  return [{label,lat,lng,city:taxiCityFromAddress(p.countrycode,p.state),rank:preferred&&p.osm_value===preferred?1:0}]
 }).sort((a,b)=>b.rank-a.rank).slice(0,5).map(({rank: _rank,...place})=>place)
}
