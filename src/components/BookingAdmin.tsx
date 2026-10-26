import {useCallback,useEffect,useRef,useState} from 'react';
import {Bell,Check,Clock,Mail,Phone,RefreshCw,Search,X} from 'lucide-react';
import ReservationNotificationHealth from './ReservationNotificationHealth';
import ReservationAudit from './ReservationAudit';
import {adminStatus,isTestReservation,reservationUpdated,reservationWaiting,reservationDate,reservationDetails,reservationMatches,safeAdminUrl} from '../lib/adminReservations';
import AccessibleDialog from './AccessibleDialog';
import type {ReservationRow} from '../lib/adminReservations';
import {changeReservationStatus,loadAdminReservations} from '../repositories/adminBookingRepository';
export default function BookingAdmin({onChanged}:{onChanged?:()=>void}={}){
 const [rows,setRows]=useState<ReservationRow[]>([]),[total,setTotal]=useState<number|null>(null),[status,setStatus]=useState(''),[search,setSearch]=useState(()=>{const ref=new URLSearchParams(window.location.hash.split('?')[1]).get('request')??'';return /^SIT-[A-Z0-9-]{1,40}$/.test(ref)?ref:'';});
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saving,setSaving]=useState<string|null>(null),[newCount,setNewCount]=useState(0);
 const [confirming,setConfirming]=useState<{row:ReservationRow;next:string}|null>(null);
 const [showTests,setShowTests]=useState(false);
 const controller=useRef<AbortController|null>(null),generation=useRef(0),seen=useRef(new Set<string>()),initialized=useRef(false),mutating=useRef(false);
 const load=useCallback(async(quiet=false,more=false)=>{
  if(mutating.current)return;
  controller.current?.abort();const abort=new AbortController();controller.current=abort;const request=++generation.current;
  if(!quiet)setBusy(true);setError('');
  try{
   const result=await loadAdminReservations(status,more?rows.length:0,AbortSignal.any([abort.signal,AbortSignal.timeout(12000)]),quiet?Math.max(50,rows.length):50);
   if(request!==generation.current)return;
   const incoming=result.rows.filter(row=>row.status==='PENDING'&&!seen.current.has(row.id));
   if(initialized.current&&quiet&&incoming.length)setNewCount(n=>n+incoming.length);
   if(incoming.length)onChanged?.();
   result.rows.forEach(row=>seen.current.add(row.id));initialized.current=true;
   setRows(old=>more?[...old,...result.rows.filter(row=>!old.some(item=>item.id===row.id))]:result.rows);setTotal(result.total);
  }catch{if(!abort.signal.aborted)setError('Talepler yüklenemedi. Önceki liste korunuyor; bağlantıyı kontrol edip yenileyin.');}
  finally{if(request===generation.current)setBusy(false);}
 },[status,rows.length]);
 useEffect(()=>{void load();return()=>{generation.current++;controller.current?.abort();};},[status]);
 useEffect(()=>{
  const refresh=()=>{if(document.visibilityState==='visible'&&!mutating.current)void load(true);};
  const timer=setInterval(refresh,30000);window.addEventListener('focus',refresh);
  return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[load]);
 useEffect(()=>()=>{generation.current++;controller.current?.abort();},[]);
 async function update(row:ReservationRow,next:string){
  if(mutating.current)return;
  mutating.current=true;generation.current++;controller.current?.abort();setBusy(false);setSaving(row.id);setError('');setMessage('');
  try{const saved=await changeReservationStatus(row,next);setRows(old=>old.map(item=>item.id===row.id?{...item,...saved}:item).filter(item=>!status||item.status===status));if(status&&next!==status)setTotal(value=>value===null?null:Math.max(0,value-1));setMessage('Durum kaydedildi. Müşteri talep ekranından sonucu görebilir.');onChanged?.();}
  catch{setError('Kaydedilemedi veya kayıt başka bir oturumda değişti. Listeyi yenileyin; değişiklik başarılı sayılmadı.');}
  finally{mutating.current=false;setSaving(null);setConfirming(null);}
 }
 const filtered=rows.filter(row=>(showTests||!isTestReservation(row))&&reservationMatches(row,search,''));
 return <section className="admin-bookings">
  <div className="admin-section-heading"><div><p className="admin-eyebrow">OPERASYON</p><h2>Restoran rezervasyonları</h2><p>Restoranı arayın, ardından onay veya ret durumunu kaydedin.</p></div><button className="admin-button" disabled={busy||Boolean(saving)} onClick={()=>{setNewCount(0);void load();}}><RefreshCw size={16}/>{busy?'Yükleniyor…':'Yenile'}</button></div>
  {newCount>0&&<div role="status" className="admin-new-notice"><Bell size={18}/>{newCount} yeni talep geldi.<button onClick={()=>setNewCount(0)}>Gördüm</button></div>}
  <div className="admin-filter-bar"><label><Search size={17}/><span className="sr-only">Talep ara</span><input placeholder="Referans, restoran, müşteri veya telefon" value={search} onChange={e=>setSearch(e.target.value)}/></label><label><span className="sr-only">Talep durumu</span><select value={status} onChange={e=>{if(!saving){setRows([]);setStatus(e.target.value);}}} disabled={Boolean(saving)}><option value="">Tüm durumlar</option>{Object.entries(adminStatus).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div>
  <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={showTests} onChange={e=>setShowTests(e.target.checked)}/>TEST ONLY kayıtlarını göster ({rows.filter(isTestReservation).length} yüklü)</label>
  <p className="admin-caption">{total===null?'Toplam sayı alınamadı':`${total} toplam kayıt (testler dahil)`} · {rows.filter(row=>!isTestReservation(row)).length} gerçek talep yüklendi · Açık sekmede 30 sn arayla yenilenir.</p>
  {error&&<p role="alert" className="admin-error">{error}</p>}{message&&<p role="status" className="admin-success">{message}</p>}
  {!busy&&!filtered.length&&<div className="admin-empty"><Clock size={28}/><h3>{search?'Aramayla eşleşen talep yok':'Bu görünümde talep yok'}</h3><p>Farklı bir durum veya arama seçebilirsiniz.</p></div>}
  <div className="admin-request-grid">{filtered.map(row=>{const detail=reservationDetails(row),source=safeAdminUrl(detail.source),actions=row.status==='PENDING'?['CONFIRMED','REJECTED']:row.status==='CONFIRMED'?['CANCELLED']:[];
   return <article key={row.id} className="admin-request-card"><div className="admin-request-top"><span className={'admin-badge admin-status-'+row.status}>{adminStatus[row.status]??'Bilinmeyen durum'}</span><bdi>{row.reference_code}</bdi></div><h3>{row.listing_name}</h3><p className="admin-request-date">{reservationDate(row.visit_date)} · {detail.time||'Saat belirtilmemiş'} · {row.guest_count} kişi</p><p className="admin-request-date">Son güncelleme: {reservationUpdated(row.updated_at)}{reservationWaiting(row)?` · Bekliyor: ${reservationWaiting(row)}`:''}{isTestReservation(row)?' · TEST ONLY':''}</p><div className="admin-guest"><strong>{row.guest_name}</strong>{detail.phone&&/^[+0-9 ()-]{5,40}$/.test(detail.phone)&&<a href={'tel:'+detail.phone.replace(/[^+0-9]/g,'')}><span>Müşteri telefonu: </span><Phone size={15}/>{detail.phone}</a>}<a href={'mailto:'+row.guest_email}><Mail size={15}/>{row.guest_email}</a></div>{detail.note&&<details><summary>Müşteri notu</summary><p className="whitespace-pre-wrap break-words">{detail.note}</p></details>}{source&&<a className="admin-source" href={source} target="_blank" rel="noopener noreferrer">Restoran kaydını aç ↗</a>}<ReservationAudit bookingId={row.id}/><div className="admin-request-actions">{actions.map(next=><button key={next} disabled={Boolean(saving)} className={next==='CONFIRMED'?'admin-button admin-primary':'admin-button'} onClick={()=>setConfirming({row,next})}>{saving===row.id?'…':next==='CONFIRMED'?<Check size={16}/>:<X size={16}/>} {next==='CONFIRMED'?'Onayla':next==='REJECTED'?'Reddet':'İptal et'}</button>)}</div></article>;
  })}</div>
  {total!==null&&rows.length<total&&<button disabled={busy||Boolean(saving)} className="admin-button" onClick={()=>void load(false,true)}>Daha fazla talep</button>}
  <ReservationNotificationHealth/>
  {confirming&&<AccessibleDialog label="Rezervasyon durumunu kaydet" onClose={()=>{if(!saving)setConfirming(null);}}><div className="p-6 space-y-4"><h3 className="font-bold text-lg">{adminStatus[confirming.next]}</h3><p className="text-sm text-slate-600">{confirming.row.reference_code} · {confirming.next==='CONFIRMED'?'Restoranla görüşüp rezervasyonu kesinleştirdiniz mi?':'Bu durum müşteriye gösterilecek.'}</p><div className="flex gap-3"><button autoFocus disabled={Boolean(saving)} className="admin-button" onClick={()=>setConfirming(null)}>Vazgeç</button><button disabled={Boolean(saving)} className="admin-button admin-primary" onClick={()=>void update(confirming.row,confirming.next)}>{saving?'Kaydediliyor…':'Durumu kaydet'}</button></div></div></AccessibleDialog>}
 </section>;
}
