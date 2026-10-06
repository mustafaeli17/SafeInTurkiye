import { useState } from 'react'
import { requireSupabase } from '../lib/supabase'
type RequestRow={id:string;reference_code:string;listing_name:string;guest_name:string;guest_email:string;visit_date:string;guest_count:number;notes:string|null;status:string}
export default function BookingAdmin(){
  const [rows,setRows]=useState<RequestRow[]>([])
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  async function load(){
    setBusy(true);setMessage('')
    try{
      const {data,error}=await requireSupabase().from('bookings').select('id,reference_code,listing_name,guest_name,guest_email,visit_date,guest_count,notes,status').eq('listing_type','restaurant').order('created_at',{ascending:false}).limit(100)
      if(error)throw error
      setRows(data??[]);if(!data?.length)setMessage('Restoran talebi bulunmuyor.')
    }catch{setMessage('Talepler alınamadı. Bağlantı ve yönetici yetkisini kontrol edin.')}
    finally{setBusy(false)}
  }
  async function update(row:RequestRow,status:string){
    if(!window.confirm(`${row.reference_code}: ${status}. İşletmeyle görüşüp kullanıcıya sonucu ilettiniz mi? Bu işlem otomatik e-posta göndermez.`))return
    setBusy(true);setMessage('')
    try{
      const {data,error}=await requireSupabase().from('bookings').update({status}).eq('id',row.id).eq('status',row.status).select('id,status').single()
      if(error||!data)throw error
      setRows(old=>old.map(item=>item.id===row.id?{...item,status:data.status}:item))
      setMessage('Durum kaydedildi. Kullanıcıya sonucu ayrıca iletin; otomatik bildirim gönderilmedi.')
    }catch{setMessage('Durum kaydedilemedi veya başka bir yönetici kaydı değiştirdi. Listeyi yenileyin.')}
    finally{setBusy(false)}
  }
  return <section className="rounded-2xl border border-sky-100 bg-white p-5 space-y-3">
    <h2 className="text-xl font-bold">Restoran rezervasyon talepleri</h2>
    <p className="text-sm">Son 100 talep. Önce restoranı arayın, sonucu kullanıcıya iletin, ardından durumu güncelleyin. Otomatik rezervasyon veya e-posta gönderilmez.</p>
    <button disabled={busy} onClick={()=>void load()} className="min-h-11 rounded-xl border px-4">{busy?'Yükleniyor…':'Talepleri getir / yenile'}</button><p role="status">{message}</p>
    {rows.map(row=><article key={row.id} className="rounded-xl border p-3 space-y-2 break-words"><h3 className="font-bold">{row.listing_name} · {row.reference_code}</h3><p>{row.visit_date} · {row.guest_count} kişi · {row.status}</p><p>{row.guest_name} · {row.guest_email}</p>{row.notes&&<p className="whitespace-pre-wrap text-sm">{row.notes}</p>}<div className="flex flex-wrap gap-2">{(['CONFIRMED','REJECTED','CANCELLED'] as const).map((status,index)=><button disabled={busy||row.status===status} key={status} onClick={()=>void update(row,status)} className="min-h-11 border rounded-lg px-3 disabled:opacity-50">{['Onaylandı','Reddedildi','İptal edildi'][index]}</button>)}</div></article>)}
  </section>
}
