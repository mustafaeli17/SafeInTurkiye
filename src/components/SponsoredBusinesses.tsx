import {useEffect,useState} from 'react'
import {requireSupabase} from '../lib/supabase'
import {foundationEnabled} from '../lib/foundationConfig'
import {trackBusinessEvent} from '../lib/businessEvents'
type Item={id:string;name:string;kind:string;slug:string;city_id:string}
const label:Record<string,string>={en:'Sponsored',tr:'Sponsorlu',de:'Gesponsert',fr:'Sponsorisé',ar:'إعلان ممول',ru:'Реклама',zh:'赞助推广'}
export default function SponsoredBusinesses({context,lang,city}:{context:string;lang:string;city?:string}){
 const [rows,setRows]=useState<Item[]>([])
 useEffect(()=>{
  if(!foundationEnabled)return
  let cancelled=false
  void(async()=>{
   try{
    const client=requireSupabase(),now=new Date().toISOString()
    const {data:placements,error}=await client.from('sponsored_placements').select('business_id,business_kind').eq('context',context).eq('active',true).lte('starts_at',now).gt('ends_at',now).order('priority',{ascending:false}).limit(12).abortSignal(AbortSignal.timeout(8000))
    if(error)throw error
    if(!placements?.length){if(!cancelled)setRows([]);return}
    let query=client.from('published_editorial_businesses').select('id,name,kind,slug,city_id').in('id',placements.map(row=>row.business_id))
    if(city){const result=await client.from('cities').select('id').eq('name',city).maybeSingle();if(result.error||!result.data){if(!cancelled)setRows([]);return}query=query.eq('city_id',result.data.id)}
    const result=await query.abortSignal(AbortSignal.timeout(8000));if(result.error)throw result.error
    const ordered=placements.flatMap(p=>result.data?.filter(b=>b.id===p.business_id&&b.kind===p.business_kind)??[])
    if(!cancelled)setRows([...new Map(ordered.map(row=>[`${row.kind}/${row.id}`,row])).values()])
   }catch{if(!cancelled)setRows([])}
  })()
  return()=>{cancelled=true}
 },[context,city])
 if(!rows.length)return null
 return <section className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3" aria-label={label[lang]??label.en}>{rows.map(row=><a key={`${row.kind}/${row.id}`} className="rounded-xl border border-sky-100 bg-white p-4" href={`/${row.kind}/${row.slug}`} onClick={()=>trackBusinessEvent(`${row.kind}/${row.id}`,'detail_open',context)}><span className="block text-xs text-slate-500">{label[lang]??label.en}</span><strong>{row.name}</strong></a>)}</section>
}
