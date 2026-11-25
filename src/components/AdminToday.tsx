import {useEffect,useRef,useState} from 'react';
import {ArrowRight,CalendarDays,CheckCircle2,Clock,Mail,Phone,RotateCw} from 'lucide-react';
import {reservationDate,reservationUpdated} from '../lib/adminReservations';
import {turkiyeCalendarDate} from '../lib/turkiyeCalendarDate';
import {loadTodayCalls,loadTodayDelivery,type TodayQueue,type TodayDelivery} from '../repositories/adminTodayRepository';

type Props={onTotal:(value:number|null)=>void;onOpen:(reference?:string)=>void;onNotifications:()=>void};
type State<T>={value:T|null;unavailable:boolean};
export default function AdminToday({onOpen,onNotifications,onTotal}:Props){
  const [queue,setQueue]=useState<State<TodayQueue>>({value:null,unavailable:false});
  const [delivery,setDelivery]=useState<State<TodayDelivery>>({value:null,unavailable:false});
  const [revision,setRevision]=useState(0),[busy,setBusy]=useState(true);
  const [asOf,setAsOf]=useState<number|null>(null);
  const [now,setNow]=useState(()=>Date.now());
  const active=useRef(false);
  useEffect(()=>{
    const controller=new AbortController();
    const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(12000)]);
    active.current=true;setBusy(true);
    setNow(Date.now());
    const update=async()=>{
      const [q,d]=await Promise.allSettled([loadTodayCalls(signal),loadTodayDelivery(signal)]);
      if(controller.signal.aborted)return;
      setQueue(old=>q.status==='fulfilled'?{value:q.value,unavailable:false}:{value:old.value,unavailable:true});
      onTotal(q.status==='fulfilled'?q.value.count:null);
      setDelivery(old=>d.status==='fulfilled'?{value:d.value,unavailable:false}:{value:old.value,unavailable:true});
      if(q.status==='fulfilled'&&d.status==='fulfilled')setAsOf(Date.now());
      setBusy(false);active.current=false;
    };
    void update();
    return ()=>controller.abort();
  },[revision,onTotal]);
  useEffect(()=>{
    const refresh=()=>{if(document.visibilityState==='visible'&&!active.current)setRevision(n=>n+1);};
    const id=window.setInterval(refresh,60000);
    document.addEventListener('visibilitychange',refresh);
    return ()=>{clearInterval(id);document.removeEventListener('visibilitychange',refresh);};
  },[]);
  const today=turkiyeCalendarDate(now);
  return <section className="admin-today" aria-labelledby="admin-today-heading">
    <div className="admin-section-heading"><div><p className="admin-today-date"><CalendarDays size={16}/>{new Intl.DateTimeFormat('tr-TR',{dateStyle:'full',timeZone:'Europe/Istanbul'}).format(now)}</p><h2 id="admin-today-heading">Bugün</h2></div>
      <button type="button" className="admin-button" disabled={busy} onClick={()=>setRevision(n=>n+1)}><RotateCw size={16}/>{busy?'Yükleniyor…':'Yenile'}</button></div>
    <section className="admin-panel admin-call-queue"><div className="admin-queue-title"><h3><Phone size={19}/>Aranacak restoranlar</h3>
      {queue.value&&!queue.unavailable&&<span className="admin-queue-count">{queue.value.count}</span>}</div>
      {queue.unavailable&&<p role="alert">Arama listesi güncellenemedi. {queue.value?'Son alınan liste gösteriliyor.':''}</p>}
      {busy&&!queue.value&&<p role="status">Talepler yükleniyor…</p>}
      {queue.value&&!queue.unavailable&&!queue.value.count&&<p className="admin-all-clear"><CheckCircle2 size={18}/>Şu anda aranacak restoran yok.</p>}
      <ul className="admin-call-list">{queue.value?.rows.map(row=><li key={row.id}>
        <button type="button" className="admin-call-task" onClick={()=>onOpen(row.reference_code)}>
          <span><strong>{row.listing_name}</strong><small>{row.visit_date===today?'Bugün':reservationDate(row.visit_date)}{row.visit_time?' · '+row.visit_time.slice(0,5):''} · {row.guest_count} kişi</small>
          {row.callback_at&&<small><Clock size={13}/>Geri arama · {reservationUpdated(row.callback_at)}</small>}</span><span className="admin-task-open">Talebi aç <ArrowRight size={16}/></span>
        </button></li>)}</ul>
      <button type="button" className="admin-button" onClick={()=>onOpen()}>Tüm talepler <ArrowRight size={15}/></button>
    </section>
    <section className="admin-panel admin-delivery-queue"><div className="admin-queue-title"><h3><Mail size={19}/>Bildirim takibi</h3></div>
      {delivery.unavailable?<p role="alert">E-posta teslim durumu doğrulanamadı.</p>:delivery.value
        ?<p>{delivery.value.count?`Son 7 günde oluşturulan ${delivery.value.count} bildirimde gönderim veya teslim sorunu var.`:'Son 7 günde oluşturulan bildirimlerde kayıtlı gönderim veya teslim hatası yok.'}</p>:<p role="status">Bildirimler kontrol ediliyor…</p>}
      {!delivery.unavailable&&!!delivery.value?.rows.length&&<ul className="admin-call-list">{delivery.value.rows.map(row=>row.bookings&&<li key={row.id}><button className="admin-call-task" onClick={()=>onOpen(row.bookings!.reference_code)}><span><strong>{row.bookings.listing_name}</strong><small>{row.bookings.reference_code}</small></span><ArrowRight size={16}/></button></li>)}</ul>}
      <button className="admin-button" onClick={onNotifications}>Bildirim ayrıntıları <ArrowRight size={15}/></button>
    </section>
    {asOf&&!delivery.unavailable&&!queue.unavailable&&<p className="admin-caption">Son kontrol {new Intl.DateTimeFormat('tr',{timeStyle:'short',timeZone:'Europe/Istanbul'}).format(asOf)} · Türkiye saati</p>}
  </section>;
}
