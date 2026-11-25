import {useRef,useState} from 'react';
import {requireSupabase} from '../lib/supabase';

type Job={
 id:string; state:string; attempts:number; available_at:string; sent_at:string|null; created_at:string;
 last_attempt_at?:string|null; last_error_code?:string|null; delivery_state?:string; delivery_event_at?:string|null;
 bookings:{reference_code:string;listing_name:string}|null;
};
const states=[['PENDING','Bekleyen'],['PROCESSING','İşleniyor'],['SENT','Sağlayıcı kabul etti'],['FAILED','Başarısız']] as const;
const deliveryLabels:Record<string,string>={UNKNOWN:'Teslim henüz doğrulanmadı',DELAYED:'Teslim gecikiyor',DELIVERED:'Alıcı sunucuya teslim edildi',FAILED:'Teslim başarısız',BOUNCED:'Alıcı sunucu reddetti',COMPLAINED:'Spam bildirimi alındı'};
const timeFormat=new Intl.DateTimeFormat('tr',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Istanbul'});
const time=(value?:string|null)=>value&&Number.isFinite(Date.parse(value))?timeFormat.format(Date.parse(value)):'Bilgi yok';

async function loadRecentJobs(){
 const base='id,state,attempts,available_at,sent_at,created_at';
 const attempts=base+',last_attempt_at,last_error_code';
 for(const fields of [attempts+',delivery_state,delivery_event_at',attempts,base]){
  const result=await requireSupabase().from('reservation_notifications')
   .select(fields+',bookings(reference_code,listing_name)').order('created_at',{ascending:false}).order('id').limit(20).abortSignal(AbortSignal.timeout(12000));
  if(!result.error&&result.data)return result.data as unknown as Job[];
  if(!['42703','PGRST204'].includes(result.error?.code??''))break;
 }
 throw Error('NOTIFICATION_LIST_UNAVAILABLE');
}
async function reservationIntakeReady(){
 try{
  const response=await fetch('/api/reservations',{signal:AbortSignal.timeout(10000),cache:'no-store'});
  if(!response.ok)return null;
  const enabled=(await response.json()).enabled;
  return typeof enabled==='boolean'?enabled:null;
 }catch{return null;}
}
async function processDueMail():Promise<string>{
 const {data}=await requireSupabase().auth.getSession();
 if(!data.session)return 'Oturumunuz sona erdi. Kuyruğu işlemek için yeniden giriş yapın.';
 const response=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},
  body:JSON.stringify({action:'notifications'}),signal:AbortSignal.timeout(30000)});
 if(response.status===401||response.status===403)return 'E-posta kuyruğunu işlemek için yetkili hesabınızla yeniden giriş yapın.';
 if(response.status===429)return 'Çok sık işlem istendi. Biraz bekleyip durumu yenileyin.';
 if(!response.ok)throw Error('QUEUE_RESULT_UNKNOWN');
 const result=await response.json();
 if(result.configured===false)return 'Sunucu e-posta gönderimine hazır değil.';
 if(result.configured!==true||!Number.isInteger(result.sent)||!Number.isInteger(result.failed))throw Error('QUEUE_RESULT_UNKNOWN');
 return `Sağlayıcının kabul ettiği: ${result.sent} · Başarısız: ${result.failed}.`;
}
export default function ReservationNotificationHealth({initiallyOpen=false}:{initiallyOpen?:boolean}={}){
 const [rows,setRows]=useState<Job[]>([]),[counts,setCounts]=useState<Record<string,number>>({});
 const [ready,setReady]=useState<boolean|null>(null),[message,setMessage]=useState(''),[readError,setReadError]=useState(false),[busy,setBusy]=useState(false);
 const lock=useRef(false);
 async function run(process=false){
  if(lock.current)return;
  lock.current=true;setBusy(true);setMessage('');setReadError(false);
  try{
   if(process){
    try{setMessage(await processDueMail());}
    catch{setMessage('Kuyruk işleminin sonucu doğrulanamadı. Yeniden işlem başlatmadan önce bildirim kayıtlarını kontrol edin.');}
   }
   const client=requireSupabase();
   const [recent,totals,intake]=await Promise.all([
    loadRecentJobs(),
    Promise.all(states.map(async ([state])=>{
     const response=await client.from('reservation_notifications').select('id',{count:'exact',head:true}).eq('state',state).abortSignal(AbortSignal.timeout(12000));
     if(response.error||response.count===null)throw Error('COUNTS_UNAVAILABLE');
     return [state,response.count] as const;
    })),
    reservationIntakeReady()
   ]);
   setRows(recent);setCounts(Object.fromEntries(totals));setReady(intake);
  }catch{setReadError(true);}finally{lock.current=false;setBusy(false);}
 }
 return <details open={initiallyOpen||undefined} className="admin-panel" onToggle={e=>{if(e.currentTarget.open&&!Object.keys(counts).length)void run();}}>
  <summary className="min-h-11 cursor-pointer">Bildirim durumu</summary>
  <p>Rezervasyon talebi kabulü · {ready===null?'Henüz doğrulanmadı':ready?'Hazır':'Hazır değil'}</p>
  <div className="flex flex-wrap gap-3 text-sm my-3">{states.map(([key,label])=><span key={key}>{label}: <strong>{counts[key]??'—'}</strong></span>)}</div>
  <p>Zamanı gelen en fazla üç e-posta işlenir. 10 başarısız denemeden sonra ekip incelemesi gerekir.</p>
  <div className="flex flex-wrap gap-2 my-3"><button className="admin-button" disabled={busy} onClick={()=>void run()}>Durumu yenile</button>
   <button className="admin-button" disabled={busy} onClick={()=>void run(true)}>E-posta kuyruğunu işle</button></div>
  {busy&&<p role="status">Kontrol ediliyor…</p>}{message&&<p role="status">{message}</p>}
  {readError&&<p role="alert">Bildirim kayıtları güncellenemedi. {Object.keys(counts).length?'Son alınan bilgiler gösteriliyor.':'Bağlantıyı kontrol edip durumu yenileyin.'}</p>}
  {!!rows.length&&<p className="admin-caption">Son {rows.length} bildirim · Türkiye saati</p>}
  {rows.map(row=><details key={row.id} className="border-t py-2 text-xs break-words">
   <summary className="min-h-11 cursor-pointer">{row.bookings?.listing_name&&<strong>{row.bookings.listing_name} · </strong>}
    {states.find(([key])=>key===row.state)?.[1]??'Bilinmeyen durum'} · {row.attempts} deneme · {time(row.created_at)}</summary>
   {row.bookings?.reference_code&&<a className="admin-button" href={'#admin?section=reservations&request='+encodeURIComponent(row.bookings.reference_code)}>Talebi aç · {row.bookings.reference_code}</a>}
   <p>Son deneme: {time(row.last_attempt_at)} · Son hata: {row.last_error_code??'Bilgi yok'} · Sonraki deneme: {row.state==='SENT'?'—':row.attempts>=10?'Elle inceleme gerekli':time(row.available_at)} · Sağlayıcı kabulü: {time(row.sent_at)}</p>
   <p>{row.delivery_state?(deliveryLabels[row.delivery_state]??'Bilinmeyen teslim durumu'):'Teslim takibi bağlı değil'}{row.delivery_event_at?' · '+time(row.delivery_event_at):''}. Teslim bilgisi okunma veya gelen kutusu garantisi değildir.</p>
  </details>)}
 </details>;
}
