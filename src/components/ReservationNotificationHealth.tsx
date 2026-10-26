import {useRef,useState} from 'react';
import {requireSupabase} from '../lib/supabase';
type Job={id:string;state:string;attempts:number;available_at:string;sent_at:string|null;created_at:string;last_attempt_at?:string|null;last_error_code?:string|null;delivery_state?:string;delivery_event_at?:string|null};
const deliveryLabels:Record<string,string>={UNKNOWN:'Teslim henüz doğrulanmadı',DELAYED:'Teslim gecikiyor',DELIVERED:'Alıcı sunucuya teslim edildi',FAILED:'Teslim başarısız',BOUNCED:'Alıcı sunucu reddetti',COMPLAINED:'Spam bildirimi alındı'};
export default function ReservationNotificationHealth(){
 const [rows,setRows]=useState<Job[]>([]),[counts,setCounts]=useState<Record<string,number|null>>({}),[ready,setReady]=useState<boolean|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const lock=useRef(false);
 const time=(value?:string|null)=>value?new Intl.DateTimeFormat('tr',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Istanbul'}).format(new Date(value)):'Bilgi yok';
 async function load(){
  const client=requireSupabase();
  let result=await client.from('reservation_notifications').select('id,state,attempts,available_at,sent_at,created_at,last_attempt_at,last_error_code,delivery_state,delivery_event_at').order('created_at',{ascending:false}).limit(20).abortSignal(AbortSignal.timeout(12000));
  if(result.error&&['42703','PGRST204'].includes(result.error.code))result=await client.from('reservation_notifications').select('id,state,attempts,available_at,sent_at,created_at,last_attempt_at,last_error_code').order('created_at',{ascending:false}).limit(20).abortSignal(AbortSignal.timeout(12000)) as typeof result;
  let data=result.data;
  if(result.error&&['42703','PGRST204'].includes(result.error.code)){
   const old=await client.from('reservation_notifications').select('id,state,attempts,available_at,sent_at,created_at').order('created_at',{ascending:false}).limit(20).abortSignal(AbortSignal.timeout(12000));
   if(old.error)throw old.error;data=old.data as typeof data;
  }else if(result.error)throw result.error;
  const totals=await Promise.all(['PENDING','PROCESSING','SENT','FAILED'].map(async state=>{
   const response=await client.from('reservation_notifications').select('id',{count:'exact',head:true}).eq('state',state).abortSignal(AbortSignal.timeout(12000));if(response.error)throw response.error;return [state,response.count] as const;
  }));
  setRows(data??[]);setCounts(Object.fromEntries(totals));
  try{const response=await fetch('/api/reservations',{signal:AbortSignal.timeout(10000),cache:'no-store'});const body=await response.json();setReady(response.ok&&body.enabled===true);}catch{setReady(null);}
 }
 async function run(retry=false){
  if(lock.current)return;lock.current=true;setBusy(true);setMessage('');
  try{
   if(retry){
    const {data}=await requireSupabase().auth.getSession();if(!data.session)throw Error();
    const response=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action:'notifications'}),signal:AbortSignal.timeout(30000)});
    const result=await response.json();if(!response.ok)throw Error();
    setMessage(result.configured?`Sağlayıcının kabul ettiği: ${result.sent} · Başarısız: ${result.failed}. Teslim sonucu varsa kayıt ayrıntısında gösterilir.`:'Sunucu e-posta gönderimine hazır değil.');
   }
   await load();
  }catch{setMessage('Bildirim durumu alınamadı. Önceki veriler korunuyor; yetkiyi ve bağlantıyı kontrol edin.');}finally{lock.current=false;setBusy(false);}
 }
 return <details className="admin-panel" onToggle={e=>{if(e.currentTarget.open&&!Object.keys(counts).length)void run();}}><summary className="min-h-11 cursor-pointer">Bildirim durumu</summary><p>Sunucu talep hazırlığı: {ready===null?'Henüz doğrulanmadı':ready?'Hazır':'Hazır değil'}. Paneldeki “kabul edildi” sağlayıcının yanıtıdır; gelen kutusuna teslim edildi anlamına gelmez.</p><div className="flex flex-wrap gap-3 text-sm my-3">{[['PENDING','Bekleyen'],['PROCESSING','İşleniyor'],['SENT','Sağlayıcı kabul etti'],['FAILED','Başarısız']].map(([key,label])=><span key={key}>{label}: <strong>{counts[key]??'—'}</strong></span>)}</div><p>İşleme düğmesi zamanı gelen en fazla üç bildirimi güvenli kuyruktan alır. Kilitli işler atlanır; başarısız işler tekrar denenir. 10 denemeden sonra elle inceleme gerekir.</p><div className="flex flex-wrap gap-2 my-3"><button className="admin-button" disabled={busy} onClick={()=>void run()}>Durumu yenile</button><button className="admin-button" disabled={busy} onClick={()=>void run(true)}>{busy?'Kontrol ediliyor…':'E-posta kuyruğunu işle'}</button></div><p role="status">{message}</p>{rows.map(row=><details key={row.id} className="border-t py-2 text-xs break-words"><summary className="min-h-11 cursor-pointer">{row.state} · {row.attempts} deneme · {time(row.created_at)}</summary><p>Son deneme: {time(row.last_attempt_at)} · Son hata: {row.last_error_code??'Bilgi yok'} · Sonraki deneme: {row.state==='SENT'?'—':row.attempts>=10?'Elle inceleme gerekli':time(row.available_at)} · Sağlayıcı kabulü: {time(row.sent_at)}</p><p>{row.delivery_state?(deliveryLabels[row.delivery_state]??'Bilinmeyen teslim durumu'):'Teslim takibi bağlı değil'}{row.delivery_event_at?' · '+time(row.delivery_event_at):''}. Teslim bilgisi okunma veya gelen kutusu garantisi değildir.</p></details>)}</details>;
}
