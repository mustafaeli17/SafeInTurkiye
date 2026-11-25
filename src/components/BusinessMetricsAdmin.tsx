import {useEffect,useState} from 'react'
import {requireSupabase} from '../lib/supabase'
import {isRetiredDirectoryEntry} from '../lib/retiredDirectory'
import {metricNames} from '../lib/sponsorship'
import AdminBusinessInfo from './AdminBusinessInfo'
import './SponsorshipAdmin.css'

type Metric={business_key:string;month_start:string;event_type:keyof typeof metricNames;total:number}
type Name={name:string;href?:string}
const pageSize=48

async function readPage(month:string,page:number,signal:AbortSignal){
 const client=requireSupabase()
 let query=client.from('business_metrics').select('business_key,month_start,event_type,total')
 if(month){
  const after=new Date(month+'-01T00:00:00Z')
  after.setUTCMonth(after.getUTCMonth()+1)
  query=query.gte('month_start',month+'-01T00:00:00Z').lt('month_start',after.toISOString())
 }
 const result=await query.order('month_start',{ascending:false}).order('business_key').order('event_type')
  .range(page*pageSize,(page+1)*pageSize).abortSignal(signal)
 if(result.error)throw result.error
 const rows=(result.data??[]).slice(0,pageSize) as Metric[]
 const more=(result.data?.length??0)>pageSize
 const ids=[...new Set(rows.flatMap(row=>/^(hotels|restaurants|activities)\/[a-f\d-]{36}$/i.test(row.business_key)?[row.business_key.split('/')[1]]:[]))]
 const names=new Map<string,Name>()
 let namesIncomplete=false
 if(ids.length){
  const businesses=await client.from('published_editorial_businesses').select('id,kind,name,slug,city_id').in('id',ids).limit(3*pageSize).abortSignal(signal)
  namesIncomplete=!!businesses.error
  const cityIds=[...new Set((businesses.data??[]).flatMap(b=>b.city_id?[b.city_id]:[]))]
  const cities=cityIds.length?await client.from('cities').select('id,name').in('id',cityIds).limit(3*pageSize).abortSignal(signal):{data:[],error:null}
  namesIncomplete=namesIncomplete||!!cities.error
  const cityNames=new Map(cities.data?.map(c=>[c.id,c.name]))
  for(const business of businesses.data??[]){
   const city=cityNames.get(business.city_id)
   names.set(business.kind+'/'+business.id,{name:business.name+(city?' · '+city:''),href:business.slug&&!isRetiredDirectoryEntry(business.kind,business.slug)?'/'+business.kind+'/'+business.slug:undefined})
  }
 }
 return {rows,more,names,namesIncomplete}
}

export default function BusinessMetricsAdmin(){
 const [month,setMonth]=useState(''),[page,setPage]=useState(0),[version,refresh]=useState(0)
 const [report,setReport]=useState<Awaited<ReturnType<typeof readPage>>|null>(null),[error,setError]=useState(false)
 useEffect(()=>{
  const controller=new AbortController()
  setReport(null);setError(false)
  void readPage(month,page,AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])).then(data=>{
   if(!controller.signal.aborted)setReport(data)
  },()=>{if(!controller.signal.aborted)setError(true)})
  return()=>controller.abort()
 },[month,page,version])
 const groups=new Map<string,Metric[]>()
 for(const row of report?.rows??[]){
  const key=row.business_key+'@'+row.month_start
  const rows=groups.get(key)??[]
  rows.push(row);groups.set(key,rows)
 }
 return <section className="admin-panel business-metrics-admin">
  <div className="admin-section-heading"><div><h2>İşletme etkileşimleri</h2><p>Aylık toplamlar, işletmenin tüm yayın alanlarında kaydedilen olayları kapsar. Yerleşimin dönem ve sayfa ölçümlerine Sponsorlu yerleşimler bölümünden ulaşabilirsiniz.</p></div>
   <button className="admin-button" type="button" onClick={()=>refresh(n=>n+1)}>Ölçümleri yenile</button></div>
  <label>Ölçüm ayı<input style={{maxWidth:'16rem'}} type="month" value={month} onChange={e=>{setPage(0);setMonth(e.target.value)}}/></label>
  {month&&<button className="admin-button" type="button" onClick={()=>{setPage(0);setMonth('')}}>Tüm aylar</button>}
  {error&&<p className="admin-error" role="alert">İstatistikler alınamadı. Yetkiyi ve bağlantıyı kontrol edip yenileyin.</p>}
  {!error&&!report&&<p role="status">İşletme ölçümleri yükleniyor…</p>}
  {report&&<>
   {!report.rows.length&&<p>Bu dönem için kayıtlı ölçüm yok. Ölçüm servisinin yapılandırması ve ziyaretçi gizlilik tercihleri sayımı etkiler.</p>}
   {report.namesIncomplete&&<p role="status">Bazı işletme veya şehir adları yüklenemedi. Ölçümler kayıt kimliğiyle gösteriliyor.</p>}
   {Array.from(groups,([key,rows])=>{
    const id=rows[0].business_key,entry=report.names.get(id),provider=id.startsWith('google/')
    return <article className="business-metric-record" key={key}><h3>{entry?.name??(provider?'Google Maps işletmesi':'CMS işletmesi')}</h3><p>{rows[0].month_start.slice(0,7)} · Tüm yayın alanları</p>
     {!entry&&<p><bdi>{id}</bdi></p>}
     <dl className="sponsor-counts">{rows.map(row=><div key={row.event_type}><dt>{metricNames[row.event_type]??row.event_type}</dt><dd>{row.total.toLocaleString('tr-TR')}</dd></div>)}</dl>
     {entry?.href&&<div className="sponsor-links"><a href={entry.href} target="_blank" rel="noopener noreferrer">CMS işletme sayfası ↗</a></div>}
     {provider&&<AdminBusinessInfo businessKey={id}/>}
    </article>
   })}
   {(page>0||report.more)&&<nav className="sponsor-actions" aria-label="Ölçüm sayfaları"><button className="admin-button" disabled={!page} onClick={()=>setPage(p=>p-1)}>Önceki</button><span>Sayfa {page+1}</span><button className="admin-button" disabled={!report.more} onClick={()=>setPage(p=>p+1)}>Sonraki</button></nav>}
   <p>Olay sayıları tekil ziyaretçileri, fiziksel ziyaretleri veya satış gelirini ölçmez.</p>
  </>}
 </section>
}
