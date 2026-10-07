import {useState} from 'react'
import {requireSupabase} from '../lib/supabase'
type Metric={business_key:string;month_start:string;event_type:string;total:number}
const labels:Record<string,string>={impression:'Görüntülenme',detail_open:'Detay açılması',phone_click:'Telefon tıklaması',website_click:'Site tıklaması',directions_click:'Yol tarifi',reservation_started:'Başlatılan talep',reservation_submitted:'Gönderilen talep'}
export default function BusinessMetricsAdmin(){
 const [rows,setRows]=useState<Metric[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 async function load(){
  setBusy(true);setMessage('')
  try{
   const {data,error}=await requireSupabase().from('business_metrics').select('*').order('month_start',{ascending:false}).limit(500).abortSignal(AbortSignal.timeout(12000))
   if(error)throw error
   setRows(data??[]);if(!data?.length)setMessage('Henüz ölçüm yok. Bu sonuç sıfır ziyaretçi anlamına gelmez; ölçüm servisi ayrıca etkinleştirilmelidir.')
  }catch{setMessage('İstatistikler alınamadı. Yetkiyi ve bağlantıyı kontrol edin.')}
  finally{setBusy(false)}
 }
 return <section className="rounded-2xl border border-sky-100 bg-white p-5 space-y-3"><h2 className="text-xl font-bold">İşletme etkileşimleri</h2><p className="text-sm">Aylık olay sayılarıdır; tekil kişi veya fiziksel işletme ziyareti sayısı değildir. Kimlik, e-posta ve konum kaydedilmez.</p><button disabled={busy} onClick={()=>void load()} className="min-h-11 border rounded-lg px-4">İstatistikleri getir</button><p role="status">{message}</p>{rows.map(row=><p className="break-words text-sm" key={`${row.business_key}/${row.month_start}/${row.event_type}`}>{row.business_key} · {row.month_start.slice(0,7)} · {labels[row.event_type]??row.event_type}: {row.total}</p>)}</section>
}
