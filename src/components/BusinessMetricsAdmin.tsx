import {useEffect,useRef,useState} from 'react'
import {requireSupabase} from '../lib/supabase'
import {loadBusinessMetrics,type MetricsCursor} from '../repositories/adminBusinessMetrics'
import {metricNames} from '../lib/sponsorship'
import AdminBusinessInfo from './AdminBusinessInfo'
import './SponsorshipAdmin.css'

export default function BusinessMetricsAdmin(){
 const [month,setMonth]=useState(''),[pages,setPages]=useState<MetricsCursor[]>([]),[version,refresh]=useState(0)
 const [report,setReport]=useState<Awaited<ReturnType<typeof loadBusinessMetrics>>|null>(null),[error,setError]=useState(false)
 const heading=useRef<HTMLHeadingElement>(null)
 function goToPage(cursors:MetricsCursor[]){
  setPages(cursors)
  heading.current?.focus()
 }
 useEffect(()=>{
  const controller=new AbortController()
  setReport(null);setError(false)
  void (async()=>loadBusinessMetrics(requireSupabase(),month,pages.at(-1)??null,AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])))().then(data=>{
   if(!controller.signal.aborted)setReport(data)
  },()=>{if(!controller.signal.aborted)setError(true)})
  return()=>controller.abort()
 },[month,pages,version])
 return <section className="admin-panel business-metrics-admin">
  <div className="admin-section-heading"><div><h2 ref={heading} tabIndex={-1}>İşletme etkileşimleri</h2><p>Aylık toplamlar, işletmenin tüm yayın alanlarında kaydedilen olayları kapsar. Yerleşimin dönem ve sayfa ölçümlerine Sponsorlu yerleşimler bölümünden ulaşabilirsiniz.</p></div>
   <button className="admin-button" type="button" onClick={()=>{setPages([]);refresh(n=>n+1)}}>Ölçümleri yenile</button></div>
  <label>Ölçüm ayı (UTC)<input style={{maxWidth:'16rem'}} type="month" value={month} onChange={e=>{setPages([]);setMonth(e.target.value)}}/></label>
  {month&&<button className="admin-button" type="button" onClick={()=>{setPages([]);setMonth('')}}>Tüm aylar</button>}
  {error&&<p className="admin-error" role="alert">İstatistikler alınamadı. Yetkiyi ve bağlantıyı kontrol edip yenileyin.</p>}
  {!error&&!report&&<p role="status">İşletme ölçümleri yükleniyor…</p>}
  {report&&<>
   {!report.groups.length&&<p>Bu dönem için kayıtlı ölçüm yok. Ölçüm servisinin yapılandırması ve ziyaretçi gizlilik tercihleri sayımı etkiler.</p>}
   {report.namesIncomplete&&<p role="status">Bazı işletme veya şehir adları yüklenemedi. Ölçümler kayıt kimliğiyle gösteriliyor.</p>}
   {report.groups.map(rows=>{
    const id=rows[0].business_key,entry=report.names.get(id),provider=id.startsWith('google/')
    return <article className="business-metric-record" key={id+rows[0].month_start}><h3>{entry?.name??(provider?'Google Maps işletmesi':'CMS işletmesi')}</h3><p>{rows[0].month_start.slice(0,7)} · Tüm yayın alanları</p>
     {!entry&&<p><bdi>{id}</bdi></p>}
     <dl className="sponsor-counts">{rows.map(row=><div key={row.event_type}><dt>{metricNames[row.event_type]??row.event_type}</dt><dd>{row.total.toLocaleString('tr-TR')}</dd></div>)}</dl>
     {entry?.href&&<div className="sponsor-links"><a href={entry.href} target="_blank" rel="noopener noreferrer">CMS işletme sayfası ↗</a></div>}
     {provider&&<AdminBusinessInfo businessKey={id}/>}
    </article>
   })}
   {(pages.length>0||report.next)&&<nav className="sponsor-actions" aria-label="Ölçüm sayfaları"><button className="admin-button" disabled={!pages.length} onClick={()=>goToPage(pages.slice(0,-1))}>Önceki</button><span>Sayfa {pages.length+1}</span><button className="admin-button" disabled={!report.next} onClick={()=>{if(report.next)goToPage([...pages,report.next])}}>Sonraki</button></nav>}
   <p>Olay sayıları tekil ziyaretçileri, fiziksel ziyaretleri veya satış gelirini ölçmez.</p>
  </>}
 </section>
}
