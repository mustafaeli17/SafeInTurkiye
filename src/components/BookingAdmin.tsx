import {useCallback,useEffect,useRef,useState} from 'react';
import {Bell,Clock,Mail,Phone,RefreshCw,Search} from 'lucide-react';
import ReservationNotificationHealth from './ReservationNotificationHealth';
import ReservationAudit from './ReservationAudit';
import AdminBusinessInfo from './AdminBusinessInfo';
import ReservationCallResult,{type CallOutcome} from './ReservationCallResult';
import {adminStatus,isTestReservation,reservationUpdated,reservationWaiting,reservationDate,reservationDetails,reservationMatches,type ReservationRow} from '../lib/adminReservations';
import {safeTelephone} from '../services/nearbyPlaces';
import {changeReservationStatus,loadAdminReservations,scheduleCallback} from '../repositories/adminBookingRepository';
import './BookingAdmin.css';

type BookingPage=Awaited<ReturnType<typeof loadAdminReservations>>;
const empty:BookingPage={rows:[],total:null,callbacksAvailable:false};
const referencePattern=/^SIT-\d{4}-\d{1,12}$/i;
function linkedReference(){
 const ref=typeof window==='undefined'?'':new URLSearchParams(window.location.hash.split('?')[1]).get('request')??'';
 return referencePattern.test(ref)?ref.toUpperCase():'';
}

export default function BookingAdmin({onChanged,initialStatus='PENDING'}:{onChanged?:()=>void;initialStatus?:string}={}){
 const [incomingReference]=useState(linkedReference);
 const [status,setStatus]=useState(incomingReference?'':initialStatus);
 const [search,setSearch]=useState(incomingReference),[reference,setReference]=useState(incomingReference);
 const [showTests,setShowTests]=useState(false),[page,setPage]=useState<BookingPage>(empty);
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(true),[saving,setSaving]=useState(false),[newCount,setNewCount]=useState(0);
 const [selected,setSelected]=useState<ReservationRow|null>(null),[saveError,setSaveError]=useState('');
 const current=useRef(page),controller=useRef<AbortController|null>(null),mutating=useRef(false);
 const seen=useRef(new Set<string>()),changed=useRef(onChanged);
 useEffect(()=>{changed.current=onChanged;},[onChanged]);
 useEffect(()=>{
  const entered=search.trim().toUpperCase();
  const timer=setTimeout(()=>setReference(referencePattern.test(entered)?entered:''),250);
  return ()=>clearTimeout(timer);
 },[search]);
 const activeStatus=reference?'':status;
 const load=useCallback(async(quiet=false,more=false)=>{
  if(mutating.current)return;
  controller.current?.abort();
  const abort=new AbortController();controller.current=abort;
  if(!quiet)setBusy(true);
  setError('');
  const previous=current.current;
  try{
   const result=await loadAdminReservations(activeStatus,more?previous.rows.length:0,AbortSignal.any([abort.signal,AbortSignal.timeout(12000)]),quiet?Math.max(50,previous.rows.length):50,reference||undefined,showTests);
   if(abort.signal.aborted)return;
   const newRequests=result.rows.filter(row=>row.status==='PENDING'&&!isTestReservation(row)&&!seen.current.has(row.id));
   if(quiet&&newRequests.length){setNewCount(n=>n+newRequests.length);changed.current?.();}
   result.rows.forEach(row=>seen.current.add(row.id));
   const next=more?{...result,rows:[...previous.rows,...result.rows.filter(row=>!previous.rows.some(item=>item.id===row.id))]}:result;
   current.current=next;setPage(next);
  }catch{if(!abort.signal.aborted)setError('Talepler yüklenemedi. Bağlantıyı kontrol edip listeyi yenileyin.');}
  finally{if(!abort.signal.aborted)setBusy(false);}
 },[activeStatus,reference,showTests]);
 useEffect(()=>{
  current.current=empty;setPage(empty);setNewCount(0);void load();
  return ()=>controller.current?.abort();
 },[load]);
 useEffect(()=>{
  const refresh=()=>{if(document.visibilityState==='visible')void load(true);};
  const timer=setInterval(refresh,30000);window.addEventListener('focus',refresh);
  return ()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[load]);
 async function save(next:CallOutcome,callbackAt?:string){
  if(!selected||mutating.current)return;
  const row=selected;
  mutating.current=true;controller.current?.abort();setBusy(false);setSaving(true);setSaveError('');setMessage('');
  try{
   let saved:Partial<ReservationRow>;
   if(next==='CALLBACK'&&callbackAt){
    const call=await scheduleCallback(row,callbackAt);
    saved={callback_at:call.callback_at,callback_id:call.id,callback_deferred:true};
    setMessage('Tekrar arama planlandı · '+reservationUpdated(call.callback_at)+' (Türkiye saati).');
   }else{
    if(next==='CALLBACK')throw Error('INVALID_CALLBACK_TIME');
    saved={...await changeReservationStatus(row,next),callback_id:null,callback_at:null,callback_deferred:false};
    setMessage(row.reference_code+' · '+adminStatus[next]+'. Müşteri sonucu talep ekranında görebilir.');
   }
   const previous=current.current;
   const rows=previous.rows.map(item=>item.id===row.id?{...item,...saved}:item).filter(item=>!activeStatus||item.status===activeStatus);
   const updated={...previous,rows,total:previous.total===null?null:previous.total-(previous.rows.length-rows.length)};
   current.current=updated;setPage(updated);setSelected(null);changed.current?.();
   mutating.current=false;void load(true);
  }catch{setSaveError('Kayıt doğrulanamadı. Görüşme penceresini kapatıp listeyi yenileyin ve son durumu kontrol edin.');}
  finally{mutating.current=false;setSaving(false);}
 }
 function changeView(next:string){
  setStatus(next);setSearch('');setReference('');setMessage('');
  if(incomingReference){
   const params=new URLSearchParams(window.location.hash.split('?')[1]);params.delete('request');
   window.history.replaceState(window.history.state,'','#admin?'+params.toString());
  }
 }
 const filtered=page.rows.filter(row=>reservationMatches(row,search,''));
 return <section className="admin-bookings">
  <div className="admin-section-heading"><div><h2>{reference?'Rezervasyon talebi':status==='PENDING'?'Aranacaklar':'Rezervasyonlar'}</h2>
   {status==='PENDING'&&!reference&&<p>Arama zamanı gelen talepler, önce en yakın masa saatiyle.</p>}</div>
   <button className="admin-button booking-refresh" disabled={busy||saving} onClick={()=>{setNewCount(0);void load();}}><RefreshCw size={16}/>{busy?'Yükleniyor…':'Yenile'}</button></div>
  <div className="booking-views" aria-label="Rezervasyon görünümü">
   <button disabled={saving} aria-pressed={activeStatus==='PENDING'} onClick={()=>changeView('PENDING')}>Aranacaklar</button>
   <button disabled={saving} aria-pressed={activeStatus!=='PENDING'&&!reference} onClick={()=>changeView('')}>Tüm talepler</button>
  </div>
  <details className="booking-filters"><summary><Search size={15}/> Ara ve filtrele</summary>
   <div className="admin-filter-bar"><label><Search size={16}/><span className="sr-only">Talep ara</span><input placeholder="Referans, restoran, müşteri veya telefon" value={search} disabled={saving} onChange={e=>setSearch(e.target.value)}/></label>
    <label><span className="sr-only">Talep durumu</span><select value={activeStatus} disabled={saving} onChange={e=>changeView(e.target.value)}><option value="">Tüm durumlar</option>{Object.entries(adminStatus).map(([key,label])=><option key={key} value={key}>{key==='PENDING'?'Beklemede':label}</option>)}</select></label></div>
   <label className="booking-test-filter"><input type="checkbox" disabled={saving} checked={showTests} onChange={e=>setShowTests(e.target.checked)}/> Test kayıtlarını göster</label>
   <p className="admin-caption">Tam referans tüm taleplerde aranır. Diğer aramalar yüklenen kayıtları filtreler.</p>
  </details>
  {newCount>0&&<div role="status" className="admin-new-notice"><Bell size={18}/>{newCount} yeni talep.<button onClick={()=>setNewCount(0)}>Gördüm</button></div>}
  {error&&<p role="alert" className="admin-error">{error}</p>}{message&&<p role="status" className="admin-success">{message}</p>}
  {!error&&!busy&&!filtered.length&&<div className="admin-empty"><Clock size={28}/><h3>{search?'Aramayla eşleşen talep yok':status==='PENDING'?'Aranacak talep yok':'Bu görünümde talep yok'}</h3></div>}
  {Boolean(filtered.length)&&<p className="admin-caption">{filtered.length} talep gösteriliyor{page.total!==null?' · '+page.total+' kayıt':''}</p>}
  <div className="admin-request-grid">{filtered.map(row=>{
   const detail=reservationDetails(row),guestPhone=safeTelephone(detail.phone),waiting=reservationWaiting(row);
   return <article key={row.id} className="admin-request-card">
    <div className="admin-request-top"><span className={'admin-badge admin-status-'+row.status}>{row.status==='PENDING'&&row.callback_at?'Tekrar aranacak':adminStatus[row.status]??'Bilinmeyen durum'}</span><bdi>{row.reference_code}</bdi></div>
    <h3>{row.listing_name}</h3>
    <p className="booking-table-time">{reservationDate(row.visit_date)} · <strong>{detail.time||'Saat belirtilmemiş'}</strong> · {row.guest_count} kişi</p>
    {row.callback_at&&<p className="booking-call-time"><Clock size={15}/>{row.callback_deferred?'Sonraki arama':'Arama zamanı geldi'} · {reservationUpdated(row.callback_at)} (TR)</p>}
    {waiting&&<p className="admin-request-date">{waiting} bekliyor</p>}{isTestReservation(row)&&<p className="admin-request-date">TEST ONLY</p>}
    {row.status==='PENDING'&&<AdminBusinessInfo key={[row.id,detail.businessKey,detail.source,reference===row.reference_code].join('|')} businessKey={detail.businessKey} source={detail.source} name={row.listing_name} autoLoad={reference===row.reference_code}/>}
    {(row.status==='PENDING'||row.status==='CONFIRMED')&&<button className="admin-button booking-save" disabled={saving} onClick={()=>{setSaveError('');setSelected(row);}}>{row.status==='PENDING'?'Sonucu kaydet':'Rezervasyonu iptal et'}</button>}
    <details className="booking-guest-details"><summary>Müşteri ve talep ayrıntıları</summary><div className="admin-guest"><strong>{row.guest_name}</strong>
     {guestPhone&&<a href={guestPhone.telephoneUrl}><Phone size={15}/>Müşteri telefonu <bdi>{guestPhone.phone}</bdi></a>}
     <a href={'mailto:'+row.guest_email}><Mail size={15}/>{row.guest_email}</a></div>
     {detail.note&&<p className="whitespace-pre-wrap break-words"><strong>Müşteri notu</strong><br/>{detail.note}</p>}
     {row.status!=='PENDING'&&<AdminBusinessInfo businessKey={detail.businessKey} source={detail.source} name={row.listing_name}/>}
     <p className="admin-request-date">Son güncelleme · {reservationUpdated(row.updated_at)}</p><ReservationAudit bookingId={row.id}/>
    </details>
   </article>;
  })}</div>
  {page.total!==null&&page.rows.length<page.total&&<button disabled={busy||saving} className="admin-button" onClick={()=>void load(false,true)}>Daha fazla talep</button>}
  <ReservationNotificationHealth/>
  {selected&&<ReservationCallResult row={selected} callbacksAvailable={page.callbacksAvailable} saving={saving} error={saveError} onClose={()=>setSelected(null)} onSave={(next,time)=>void save(next,time)}/>}
 </section>;
}
