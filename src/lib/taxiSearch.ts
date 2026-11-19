import {taxiCityFromAddress} from './taxiCity'
/** Search across Türkiye, without silently preferring İstanbul streets.
 * Both inputs use the same country scope; the selected result supplies its province.
 */
export function taxiSearchUrl(query:string):string {
 const params=new URLSearchParams({q:query.trim(),limit:'5',countrycode:'TR'});
 return `https://photon.komoot.io/api/?${params}`;
}

export function parseTaxiPlaces(data: unknown): {label:string;lat:number;lng:number;city:string}[] {
 const features=(data as {features?:unknown[]}|null)?.features
 if(!Array.isArray(features))return []
 const seen=new Set<string>()
 return features.flatMap(feature=>{
  const f=feature as {geometry?:{coordinates?:unknown[]};properties?:Record<string,unknown>}|null
  const [lng,lat]=f?.geometry?.coordinates??[]
  const p=f?.properties??{}
  if(typeof lat!=='number'||typeof lng!=='number'||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return []
  const label=[p.name,p.street,p.housenumber,p.district,p.city,p.state,p.country].filter((v,i,a)=>typeof v==='string'&&v.trim()&&a.indexOf(v)===i).join(', ')
  const id=`${lat},${lng},${label}`
  if(!label||seen.has(id))return []
  seen.add(id)
  return [{label,lat,lng,city:taxiCityFromAddress(p.countrycode,p.state)}]
 }).slice(0,5)
}
