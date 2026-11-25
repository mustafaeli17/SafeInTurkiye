import type {SupabaseClient} from '@supabase/supabase-js'
import {isRetiredDirectoryEntry} from '../lib/retiredDirectory'
import type {Placement,SponsorBusiness,SponsorCity,SponsorContext,metricNames} from '../lib/sponsorship'

const pageSize=150
type Rows<T>={data:T[]|null;error:unknown}
async function readPages<T>(read:(from:number,to:number)=>PromiseLike<Rows<T>>):Promise<T[]>{
 const rows:T[]=[]
 for(let from=0;;from+=pageSize){
  const result=await read(from,from+pageSize-1)
  if(result.error||!result.data)throw Error('SPONSOR_READ_FAILED')
  rows.push(...result.data)
  if(result.data.length<pageSize)return rows
 }
}
export const placementFields='id,business_id,business_kind,context,starts_at,ends_at,priority,active'
export async function loadSponsorInventory(client:SupabaseClient,signal:AbortSignal){
 const [businesses,cities,placements]=await Promise.all([
  readPages<SponsorBusiness>((from,to)=>client.from('published_editorial_businesses').select('id,kind,slug,name,city_id,description,address,website,editorial_metadata').order('kind').order('id').range(from,to).abortSignal(signal)),
  readPages<SponsorCity>((from,to)=>client.from('cities').select('id,name').eq('active',true).eq('status','PUBLISHED').order('id').range(from,to).abortSignal(signal)),
  readPages<Placement>((from,to)=>client.from('sponsored_placements').select(placementFields).order('id').range(from,to).abortSignal(signal))
 ])
 businesses.sort((a,b)=>a.name.localeCompare(b.name,'tr'))
 return {businesses,cities,placements}
}

type RankedPlacement=Pick<Placement,'id'|'business_id'|'business_kind'|'priority'|'ends_at'>
type Candidate={id:string;kind:string}
const key=(kind:string,id:string)=>kind+'/'+id
/** The SQL schema uses a polymorphic business ID. Match kind and ID before ranking. */
export async function rankedSponsorBusinesses(client:SupabaseClient,context:string,candidates:Candidate[],signal:AbortSignal){
 const allowed=new Set(candidates.map(b=>key(b.kind,b.id)))
 const ids=[...new Set(candidates.map(b=>b.id))]
 const now=new Date().toISOString()
 const best=new Map<string,RankedPlacement>()
 // Keep UUID lists below common gateway URL limits. A business may have multiple placements.
 for(let start=0;start<ids.length;start+=64){
  const chunk=ids.slice(start,start+64)
  const placements=await readPages<RankedPlacement>((from,to)=>client.from('sponsored_placements').select('id,business_id,business_kind,priority,ends_at')
   .eq('context',context).in('business_id',chunk).eq('active',true).lte('starts_at',now).gt('ends_at',now)
   .order('id').range(from,to).abortSignal(signal))
  for(const row of placements){
   const business=key(row.business_kind,row.business_id),previous=best.get(business)
   if(allowed.has(business)&&(!previous||row.priority>previous.priority||row.priority===previous.priority&&row.id<previous.id))best.set(business,row)
  }
 }
 return best
}
type CityCard=Pick<SponsorBusiness,'id'|'name'|'kind'|'slug'>
export async function loadCitySponsors(client:SupabaseClient,city:string,signal:AbortSignal){
 const location=await client.from('cities').select('id').eq('name',city).eq('active',true).eq('status','PUBLISHED').abortSignal(signal).maybeSingle()
 if(location.error)throw location.error
 if(!location.data)return []
 const candidates=await readPages<CityCard>((from,to)=>client.from('published_editorial_businesses').select('id,kind,name,slug').eq('city_id',location.data!.id)
  .order('kind').order('id').range(from,to).abortSignal(signal))
 const eligible=candidates.filter(row=>row.slug&&row.name?.trim()&&!isRetiredDirectoryEntry(row.kind,row.slug))
 const best=await rankedSponsorBusinesses(client,'city',eligible,signal)
 return eligible.flatMap(row=>{
  const placement=best.get(key(row.kind,row.id))
  return placement?[{...row,priority:placement.priority,ends_at:placement.ends_at}]:[]
 }).sort((a,b)=>b.priority-a.priority||key(a.kind,a.id).localeCompare(key(b.kind,b.id))).slice(0,12)
}

export type EventCount={type:keyof typeof metricNames;total:number}
const contextEvents:Record<SponsorContext,readonly EventCount['type'][]>={
 city:['impression'],
 hotels:['impression','detail_open','phone_click','website_click','directions_click'],
 restaurants:['impression','detail_open','phone_click','website_click','directions_click'],
 activities:['impression','detail_open','phone_click','website_click','directions_click'],
}
export async function readPlacementCounts(client:SupabaseClient,row:Placement,signal:AbortSignal):Promise<EventCount[]>{
 return Promise.all(contextEvents[row.context].map(async type=>{
  const result=await client.from('business_events').select('id',{head:true,count:'exact'})
   .eq('business_key',key(row.business_kind,row.business_id)).eq('context',row.context).eq('event_type',type)
   .gte('created_at',row.starts_at).lt('created_at',row.ends_at).abortSignal(signal)
  if(result.error||result.count===null)throw Error('BUSINESS_EVENTS_UNAVAILABLE')
  return {type,total:result.count}
 }))
}

export async function saveSponsorPlacement(client:SupabaseClient,id:string,existing:Placement|null,values:Partial<Omit<Placement,'id'>>):Promise<Placement>{
 const table=client.from('sponsored_placements')
 const query=existing?table.update(values):table.insert({...values,id})
 // The schema has no update timestamp. Match the original editable fields to detect concurrent edits.
 if(existing)for(const [column,value] of Object.entries(existing))query.eq(column,value)
 const result=await query.select(placementFields).abortSignal(AbortSignal.timeout(12000)).single()
 if(!result.error&&result.data)return result.data as Placement

 // A timeout can occur after the write committed. The draft keeps its ID on retry.
 const check=client.from('sponsored_placements').select(placementFields)
 for(const [column,value] of Object.entries({...existing,...values,id}))check.eq(column,value)
 const confirmed=await check.abortSignal(AbortSignal.timeout(8000)).maybeSingle()
 if(confirmed.error||!confirmed.data)throw Error('SPONSOR_WRITE_NOT_CONFIRMED')
 return confirmed.data as Placement
}
