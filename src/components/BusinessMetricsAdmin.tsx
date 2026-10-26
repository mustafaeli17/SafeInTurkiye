import {useState} from 'react'
import {requireSupabase} from '../lib/supabase'
type Metric={business_key:string;month_start:string;event_type:string;total:number}
const labels:Record<string,string>={impression:'Görüntülenme',detail_open:'Detay açılması',phone_click:'Telefon tıklaması',website_click:'Site tıklaması',directions_click:'Yol tarifi',reservation_started:'Başlatılan talep',reservation_submitted:'Gönderilen talep'}
export default function BusinessMetricsAdmin(){
 const [rows,setRows]=useState<Metric[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const [names,setNames]=useState<Record<string,string>>({})
 async function load(){
  setBusy(true);setMessage('')
  try{
   const {data,error}=await requireSupabase().from('business_metrics').select('*').order('month_start',{ascending:false}).limit(500).abortSignal(AbortSignal.timeout(12000))
   if(error)throw error
   setRows(data??[]);
   const [business,cities]=await Promise.all([requireSupabase().from('published_editorial_businesses').select('id,kind,name,city_id').limit(1000).abortSignal(AbortSignal.timeout(10000)),requireSupabase().from('cities').select('id,name').limit(500).abortSignal(AbortSignal.timeout(10000))]);
   if(!business.error){const cityNames=Object.fromEntries((cities.data??[]).map(c=>[c.id,c.name]));setNames(Object.fromEntries((business.data??[]).map(b=>[`${b.kind}/${b.id}`,`${b.name}${cityNames[b.city_id]?' · '+cityNames[b.city_id]:''}`])));}
   if(!data?.length)setMessage('Henüz ölçüm yok. Bu sonuç sıfır ziyaretçi anlamına gelmez; ölçüm servisi ayrıca etkinleştirilmelidir.')
  }catch{setMessage('İstatistikler alınamadı. Yetkiyi ve bağlantıyı kontrol edin.')}
  finally{setBusy(false)}
 }
 return <section className="rounded-2xl border border-sky-100 bg-white p-5 space-y-3"><h2 className="text-xl font-bold">İşletme etkileşimleri</h2><p className="text-sm">Aylık olay sayılarıdır; tekil kişi veya fiziksel işletme ziyareti sayısı değildir. Kimlik, e-posta ve konum kaydedilmez.</p><button disabled={busy} onClick={()=>void load()} className="min-h-11 border rounded-lg px-4">İstatistikleri getir</button><p role="status">{message}</p>{rows.map(row=><div className="break-words text-sm" key={`${row.business_key}/${row.month_start}/${row.event_type}`}>{names[row.business_key]??(row.business_key.startsWith('google/')?'Google Maps kaydı — işletme adı mevcut değil':'İşletme adı alınamadı')} · {row.month_start.slice(0,7)} · {labels[row.event_type]??row.event_type}: {row.total}<details><summary className="min-h-11 cursor-pointer">Teknik kayıt kimliği</summary><bdi>{row.business_key}</bdi></details></div>)}</section>
}
