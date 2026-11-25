import {useEffect,useRef,useState} from 'react'
import {requireSupabase} from '../lib/supabase'
import {catalogWebsite} from '../lib/catalogLinks'
import {normalizeSearch} from '../lib/catalog'
import {contextNames,metricNames,placementContextPath,placementDateInput,placementDateLabel,placementStatus,placementTimestamp,sponsorContexts,statusNames} from '../lib/sponsorship'
import type {Placement,SponsorContext} from '../lib/sponsorship'
import {loadSponsorInventory,readPlacementCounts,saveSponsorPlacement} from '../repositories/sponsorRepository'
import type {EventCount} from '../repositories/sponsorRepository'
import {useDiscardChanges} from './useDiscardChanges'
import './SponsorshipAdmin.css'

type Inventory=Awaited<ReturnType<typeof loadSponsorInventory>>
type Draft={business:string;context:SponsorContext;start:string;end:string;priority:string;active:boolean}
const emptyDraft:Draft={business:'',context:'city',start:'',end:'',priority:'0',active:false}
const businessKey=(kind:string,id:string)=>kind+'/'+id

function PlacementCounts({row}:{row:Placement}){
 const [counts,setCounts]=useState<EventCount[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false)
 async function load(){
  setBusy(true);setError(false);setCounts(null)
  try{setCounts(await readPlacementCounts(requireSupabase(),row,AbortSignal.timeout(10000)))}
  catch{setError(true)}
  finally{setBusy(false)}
 }
 return <div className="sponsor-metrics">
  <button type="button" className="admin-button" disabled={busy} onClick={()=>void load()}>{busy?'Ölçümler yükleniyor…':counts?'Ölçümleri yenile':'Dönem ölçümlerini getir'}</button>
  {error&&<p role="alert">Ölçümler alınamadı. Tekrar deneyin.</p>}
  {counts&&<><p>Bu tarihlerde bu sayfa türünde kaydedilen işletme etkileşimleri. Aynı işletmenin çakışan yerleşimleri aynı olayları içerebilir.</p>
   <dl className="sponsor-counts">{counts.map(item=><div key={item.type}><dt>{metricNames[item.type]}</dt><dd>{item.total.toLocaleString('tr-TR')}</dd></div>)}</dl>
   {counts.every(item=>item.total===0)&&<p>Seçili kapsamda olay kaydı yok. Ölçüm servisi ve ziyaretçi gizlilik tercihleri sayımı etkiler.</p>}
  </>}
 </div>
}

export default function SponsorshipAdmin({onDirtyChange}:{onDirtyChange?:(dirty:boolean)=>void}={}){
 const [inventory,setInventory]=useState<Inventory|null>(null),[generation,reload]=useState(0),[loading,setLoading]=useState(true)
 const [saving,setSaving]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('')
 const [original,setOriginal]=useState<Placement|null>(null),[draft,setDraft]=useState<Draft|null>(null),[dirty,setDirty]=useState(false)
 const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[now,setNow]=useState(Date.now)
 const writeLock=useRef(false),draftId=useRef(''),formHeading=useRef<HTMLHeadingElement>(null)
 const discard=useDiscardChanges(dirty)
 useEffect(()=>{
  const controller=new AbortController()
  setLoading(true);setError('')
  void (async()=>{
   try{
    const result=await loadSponsorInventory(requireSupabase(),AbortSignal.any([controller.signal,AbortSignal.timeout(15000)]))
    if(!controller.signal.aborted)setInventory(result)
   }catch{if(!controller.signal.aborted){setInventory(null);setError('Yerleşimler yüklenemedi. Bağlantıyı ve personel erişimini kontrol edip yenileyin.')}}
   finally{if(!controller.signal.aborted)setLoading(false)}
  })()
  return()=>controller.abort()
 },[generation])
 useEffect(()=>{
  onDirtyChange?.(dirty)
  const beforeUnload=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue=''}}
  window.addEventListener('beforeunload',beforeUnload)
  return()=>{window.removeEventListener('beforeunload',beforeUnload);onDirtyChange?.(false)}
 },[dirty,onDirtyChange])
 useEffect(()=>{
  const timer=setInterval(()=>setNow(Date.now()),30000)
  return()=>clearInterval(timer)
 },[])
 const cities=new Map(inventory?.cities.map(city=>[city.id,city]))
 const businesses=new Map(inventory?.businesses.map(b=>[businessKey(b.kind,b.id),b]))
 const eligible=inventory?.businesses.filter(b=>sponsorContexts(b,cities.get(b.city_id??'')).length)??[]
 const chosen=businesses.get(draft?.business??'')
 const contexts=sponsorContexts(chosen,cities.get(chosen?.city_id??''))
 function openForm(row:Placement|null){
  draftId.current=row?.id??crypto.randomUUID()
  setOriginal(row);setDirty(false);setNotice('');setError('')
  setDraft(row?{business:businessKey(row.business_kind,row.business_id),context:row.context,start:placementDateInput(row.starts_at),end:placementDateInput(row.ends_at),priority:String(row.priority),active:row.active}:{...emptyDraft})
  requestAnimationFrame(()=>formHeading.current?.focus())
 }
 function updateDraft(change:Partial<Draft>){setDraft(previous=>previous?{...previous,...change}:null);setDirty(true)}
 function closeForm(){setOriginal(null);setDraft(null);setDirty(false)}
 async function write(row:Placement|null,values:Partial<Omit<Placement,'id'>>){
  const saved=await saveSponsorPlacement(requireSupabase(),row?.id??draftId.current,row,values)
  setInventory(previous=>previous?{...previous,placements:[...previous.placements.filter(p=>p.id!==saved.id),saved]}:previous)
 }
 async function commit(row:Placement|null,values:Partial<Omit<Placement,'id'>>,close:boolean){
  if(writeLock.current)return
  writeLock.current=true;setSaving(true);setError('');setNotice('')
  try{
   await write(row,values)
   if(close)closeForm()
   setNow(Date.now);setNotice('Yerleşim kaydedildi.')
  }catch{setError('İşlem doğrulanamadı. Kayıt başka bir oturumda değişmiş olabilir. Yenile ile güncel kaydı kontrol edin.')}
  finally{writeLock.current=false;setSaving(false)}
 }
 function save(event:React.FormEvent){
  event.preventDefault()
  if(!draft||!chosen||!contexts.includes(draft.context)){setError('Bu işletme için geçerli bir yayın alanı seçin.');return}
  const start=original&&placementDateInput(original.starts_at)===draft.start?original.starts_at:placementTimestamp(draft.start)
  const end=original&&placementDateInput(original.ends_at)===draft.end?original.ends_at:placementTimestamp(draft.end)
  const priority=Number(draft.priority)
  if(!start||!end||Date.parse(end)<=Date.parse(start)||!draft.priority.trim()||!Number.isInteger(priority)||priority<0||priority>1000){setError('Bitiş başlangıçtan sonra olmalı. Önceliği 0–1000 arasında bir tam sayı olarak girin.');return}
  void commit(original,{business_kind:chosen.kind,business_id:chosen.id,context:draft.context,starts_at:start,ends_at:end,priority,active:draft.active},true)
 }
 const records=(inventory?.placements??[]).map(row=>{
  const business=businesses.get(businessKey(row.business_kind,row.business_id)),city=cities.get(business?.city_id??'')
  const eligibleHere=sponsorContexts(business,city).includes(row.context)
  return {row,business,city,eligibleHere,state:placementStatus(row,eligibleHere,now)}
 }).filter(({row,business,city,state})=>(!status||state===status)&&normalizeSearch([business?.name,city?.name,contextNames[row.context],row.business_id].join(' ')).includes(normalizeSearch(search)))
  .sort((a,b)=>Date.parse(b.row.starts_at)-Date.parse(a.row.starts_at)||a.row.id.localeCompare(b.row.id))
 const busy=loading||saving
 return <section className="admin-panel sponsor-admin">
  <header className="admin-section-heading"><div><h2>Sponsorlu yerleşimler</h2><p>Şehir rehberinde veya işletmenin kategori listesinde gösterilen ücretli CMS yerleşimleri.</p></div>
   <div className="sponsor-actions"><button type="button" className="admin-button" disabled={busy} onClick={()=>{setNotice('');reload(n=>n+1)}}>Yenile</button>
    <button type="button" className="admin-button admin-primary" disabled={busy||!eligible.length} onClick={()=>discard.protect(()=>openForm(null))}>Yeni yerleşim</button></div></header>
  {loading&&<p role="status">Yerleşimler yükleniyor…</p>}{error&&<p role="alert" className="admin-error">{error}</p>}{notice&&<p role="status" className="admin-success">{notice}</p>}
  {inventory&&!eligible.length&&<p>Yerleşim açılabilecek yayımlanmış bir CMS işletmesi bulunmuyor. İşletmenin şehir bağlantısını ve yayın durumunu içerik yönetiminde kontrol edin.</p>}
  {draft&&<form className="sponsor-form" onSubmit={save}><h3 ref={formHeading} tabIndex={-1}>{original?'Yerleşimi düzenle':'Yeni yerleşim'}</h3>
   <fieldset disabled={busy}><label>CMS işletmesi<select required value={draft.business} onChange={e=>{
    const next=businesses.get(e.target.value),allowed=sponsorContexts(next,cities.get(next?.city_id??''))
    updateDraft({business:e.target.value,context:allowed.includes(draft.context)?draft.context:allowed[0]??'city'})
   }}><option value="">İşletme seçin</option>{original&&!eligible.some(b=>businessKey(b.kind,b.id)===draft.business)&&draft.business&&<option value={draft.business}>Önceki işletme · yayına uygun değil</option>}
    {eligible.map(b=><option key={businessKey(b.kind,b.id)} value={businessKey(b.kind,b.id)}>{b.name} · {cities.get(b.city_id??'')?.name} · {contextNames[b.kind]}</option>)}</select></label>
    <label>Yayın alanı<select required value={contexts.includes(draft.context)?draft.context:''} onChange={e=>updateDraft({context:e.target.value as SponsorContext})}><option value="">Alan seçin</option>{contexts.map(c=><option key={c} value={c}>{contextNames[c]}</option>)}</select></label>
    <label>Başlangıç (TSİ, UTC+03)<input type="datetime-local" step="any" required value={draft.start} onChange={e=>updateDraft({start:e.target.value})}/></label>
    <label>Bitiş (TSİ, UTC+03)<input type="datetime-local" step="any" required value={draft.end} onChange={e=>updateDraft({end:e.target.value})}/></label>
    <label>Öncelik (0–1000)<input type="number" required min={0} max={1000} step={1} value={draft.priority} onChange={e=>updateDraft({priority:e.target.value})}/></label>
    <label className="sponsor-toggle"><input type="checkbox" checked={draft.active} onChange={e=>updateDraft({active:e.target.checked})}/> Tarih aralığında etkin</label>
   </fieldset><p>Şehir rehberi önceliğe göre en çok 12 işletme gösterir. Kategori listesinde konum ve arama filtreleri uygulanır.</p>
   <div className="sponsor-actions"><button className="admin-button admin-primary" disabled={busy||!inventory}>Kaydet</button><button type="button" className="admin-button" disabled={saving} onClick={()=>discard.protect(closeForm)}>Vazgeç</button></div>
  </form>}
  {inventory&&<><div className="sponsor-filters"><label>Yerleşim ara<input type="search" placeholder="İşletme veya şehir" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   <label>Yayın durumu<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Tümü</option>{Object.entries(statusNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
   {!records.length&&<p>{inventory.placements.length?'Filtrelerle eşleşen yerleşim yok.':'Henüz sponsorlu yerleşim yok.'}</p>}
   {records.map(({row,business,city,state,eligibleHere})=>{
    const path=eligibleHere?placementContextPath(row.context,city):null
    const source=catalogWebsite(business?.editorial_metadata?.sourceUrl??'')??catalogWebsite(business?.website??'')
    return <article key={row.id} className="sponsor-record"><div className="sponsor-record-heading"><h3>{business?.name??'Yayında olmayan işletme'}</h3><span className={'sponsor-status sponsor-'+state}>{statusNames[state]}</span></div>
     <p>{city?.name??'Yayımlanmış şehir bağlantısı yok'} · {contextNames[row.context]} · Öncelik {row.priority}</p>
     <p><time dateTime={row.starts_at}>{placementDateLabel(row.starts_at)}</time> – <time dateTime={row.ends_at}>{placementDateLabel(row.ends_at)}</time> (TSİ, UTC+03)</p>
     {!eligibleHere&&<p>Bu işletme ve yayın alanı şu anda ziyaretçiye gösterilemiyor.</p>}
     <div className="sponsor-links">{path&&<a href={path} target="_blank" rel="noopener noreferrer">Yayın alanını aç ↗</a>}{business&&sponsorContexts(business,city).length>0&&<a href={'/'+business.kind+'/'+business.slug} target="_blank" rel="noopener noreferrer">CMS işletme sayfası ↗</a>}
      {source&&<a href={source} target="_blank" rel="noopener noreferrer">İşletme kaynağı ↗</a>}</div>
     <div className="sponsor-actions"><button type="button" className="admin-button" disabled={busy} onClick={()=>discard.protect(()=>openForm(row))}>{state==='expired'?'Tarihleri düzenle':'Düzenle'}</button>
      {state!=='expired'&&<button type="button" className="admin-button" disabled={busy||!!draft||!row.active&&!eligibleHere} onClick={()=>void commit(row,{active:!row.active},false)}>{row.active?'Duraklat':'Etkinleştir'}</button>}</div>
     <PlacementCounts key={[row.business_id,row.business_kind,row.context,row.starts_at,row.ends_at].join('/')} row={row}/>
    </article>
   })}</>}
  {discard.dialog}
 </section>
}
