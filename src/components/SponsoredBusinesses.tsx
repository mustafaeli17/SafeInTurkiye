import {useEffect,useRef,useState} from 'react'
import {foundationEnabled} from '../lib/foundationConfig'
import {editorialDiscoveryCopy} from '../lib/editorialDiscoveryCopy'
import {trackBusinessEvent} from '../lib/businessEvents'
import type {loadCitySponsors} from '../repositories/sponsorRepository'

type Cards=Awaited<ReturnType<typeof loadCitySponsors>>
export default function SponsoredBusinesses({context,lang,city}:{context:'city';lang:string;city:string}){
 const [result,setResult]=useState<{city:string;rows:Cards}|null>(null)
 const container=useRef<HTMLElement>(null)
 useEffect(()=>{
  if(!foundationEnabled||!city)return
  const controller=new AbortController()
  let timer:ReturnType<typeof setTimeout>
  const load=async()=>{
   try{
    const [{requireSupabase},{loadCitySponsors}]=await Promise.all([import('../lib/supabase'),import('../repositories/sponsorRepository')])
    if(controller.signal.aborted)return
    const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])
    const rows=await loadCitySponsors(requireSupabase(),city,signal)
    if(controller.signal.aborted)return
    setResult({city,rows})
    if(rows.length){
     const delay=Math.min(...rows.map(row=>Date.parse(row.ends_at)))-Date.now()
     timer=setTimeout(()=>{setResult(null);void load()},Math.min(2147483647,Math.max(1,delay)))
    }
   }catch{if(!controller.signal.aborted)setResult(null)}
  }
  void load()
  return()=>{controller.abort();clearTimeout(timer)}
 },[city])
 useEffect(()=>{
  if(!container.current||result?.city!==city||!('IntersectionObserver' in window))return
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    const key=(entry.target as HTMLElement).dataset.businessKey
    if(key&&entry.intersectionRatio>=0.5){
     observer.unobserve(entry.target)
     trackBusinessEvent(key,'impression',context)
    }
   }
  },{threshold:0.5})
  container.current.querySelectorAll('a[data-business-key]').forEach(link=>observer.observe(link))
  return()=>observer.disconnect()
 },[result,city,context])
 if(result?.city!==city||!result.rows.length)return null
 const label=(editorialDiscoveryCopy[lang]??editorialDiscoveryCopy.en)[1]
 return <section ref={container} className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3" aria-label={label}>{result.rows.map(row=>
  <a key={row.kind+'/'+row.id} data-business-key={row.kind+'/'+row.id} className="rounded-xl border border-sky-100 bg-white p-4" href={'/'+row.kind+'/'+row.slug}>
   <span className="block text-xs text-slate-500">{label}</span><strong>{row.name}</strong>
  </a>)}</section>
}
