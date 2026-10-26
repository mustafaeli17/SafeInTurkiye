import {useState} from 'react';
import {requireSupabase} from '../lib/supabase';
import {adminStatus,reservationUpdated} from '../lib/adminReservations';
type Entry={id:string;old_status:string;new_status:string;actor_id:string|null;changed_at:string};
export default function ReservationAudit({bookingId}:{bookingId:string}){
 const [rows,setRows]=useState<Entry[]|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function load(){if(busy)return;setBusy(true);setMessage('');try{const result=await requireSupabase().from('reservation_status_audit').select('id,old_status,new_status,actor_id,changed_at').eq('booking_id',bookingId).order('changed_at',{ascending:false}).limit(20).abortSignal(AbortSignal.timeout(10000));if(result.error)throw result.error;setRows(result.data??[]);}catch{setMessage('İşlem geçmişi bu ortamda alınamadı. Şema ve yetki kontrolü gerekir; geçmiş varmış gibi gösterilmedi.');}finally{setBusy(false);}}
 return <details onToggle={e=>{if(e.currentTarget.open&&rows===null&&!busy)void load();}}><summary className="min-h-11 cursor-pointer">Durum işlem geçmişi</summary>{busy&&<p role="status">Yükleniyor…</p>}{message&&<p role="alert">{message}</p>}{rows?.length===0&&<p>Kaydedilmiş durum değişikliği yok. Önceki işlemler geriye dönük üretilmez.</p>}{rows?.map(row=><p key={row.id} className="break-words">{adminStatus[row.old_status]} → {adminStatus[row.new_status]} · {reservationUpdated(row.changed_at)} · Yetkili: <bdi>{row.actor_id??'Sistem işlemi'}</bdi></p>)}</details>;
}
