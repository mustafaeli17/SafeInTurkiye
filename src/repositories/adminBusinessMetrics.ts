import type {SupabaseClient} from '@supabase/supabase-js'
import {metricNames} from '../lib/sponsorship'
import {isRetiredDirectoryEntry} from '../lib/retiredDirectory'

type Metric={business_key:string;month_start:string;event_type:keyof typeof metricNames;total:number}
type Name={name:string;href?:string}
export type MetricsCursor=Pick<Metric,'business_key'|'month_start'>
const businessesPerPage=12
// The monthly view contains at most one row per supported event type for a business.
const rowLimit=businessesPerPage*Object.keys(metricNames).length+1

export async function loadBusinessMetrics(client:SupabaseClient, month:string, cursor:MetricsCursor|null, signal:AbortSignal){
 const query=()=>client.from('business_metrics').select('business_key,month_start,event_type,total')
  .order('month_start',{ascending:false}).order('business_key').order('event_type')
 const checked=(result:{error:unknown;data:unknown})=>{
  if(result.error||!Array.isArray(result.data))throw Error('METRICS_UNAVAILABLE')
  return result.data as Metric[]
 }
 const first=query()
 if(cursor){
  first.eq('month_start',cursor.month_start).gt('business_key',cursor.business_key)
 }else if(month){
  const after=new Date(month+'-01T00:00:00Z')
  after.setUTCMonth(after.getUTCMonth()+1)
  first.gte('month_start',month+'-01T00:00:00Z').lt('month_start',after.toISOString())
 }
 const rows=checked(await first.limit(rowLimit).abortSignal(signal))
 if(cursor&&!month&&rows.length<rowLimit){
  rows.push(...checked(await query().lt('month_start',cursor.month_start).limit(rowLimit-rows.length).abortSignal(signal)))
 }
 const groups:Metric[][]=[]
 let more=false
 for(const row of rows){
  const last=groups.at(-1)
  if(last&&last[0].business_key===row.business_key&&last[0].month_start===row.month_start){
   last.push(row)
  }else{
   if(groups.length===businessesPerPage){more=true;break}
   groups.push([row])
  }
 }
 const last=groups.at(-1)?.[0]
 const next=more&&last?{business_key:last.business_key,month_start:last.month_start}:null
 const ids=[...new Set(groups.flatMap(([row])=>/^(hotels|restaurants|activities)\/[a-f\d-]{36}$/i.test(row.business_key)?[row.business_key.split('/')[1]]:[]))]
 const names=new Map<string,Name>()
 let namesIncomplete=false
 if(ids.length){
  const businesses=await client.from('published_editorial_businesses').select('id,kind,name,slug,city_id').in('id',ids).limit(3*ids.length).abortSignal(signal)
  namesIncomplete=!!businesses.error||!businesses.data
  const cityIds=[...new Set((businesses.data??[]).flatMap(b=>b.city_id?[b.city_id]:[]))]
  const cities=cityIds.length?await client.from('cities').select('id,name').in('id',cityIds).abortSignal(signal):{data:[],error:null}
  namesIncomplete=namesIncomplete||!!cities.error||!cities.data
  const cityNames=new Map(cities.data?.map(c=>[c.id,c.name]))
  for(const business of businesses.data??[]){
   const city=cityNames.get(business.city_id)
   names.set(business.kind+'/'+business.id,{name:business.name+(city?' · '+city:''),href:business.slug&&!isRetiredDirectoryEntry(business.kind,business.slug)?'/'+business.kind+'/'+business.slug:undefined})
  }
 }
 return {groups,next,names,namesIncomplete}
}
