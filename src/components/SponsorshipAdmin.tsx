import {useState} from 'react'
import {requireSupabase} from '../lib/supabase'

type Business={id:string;kind:string;slug:string;name:string}
type Placement={id:string;business_id:string;business_kind:string;context:string;starts_at:string;ends_at:string;priority:number;active:boolean}
export default function SponsorshipAdmin(){
 const [businesses,setBusinesses]=useState<Business[]>([])
 const [placements,setPlacements]=useState<Placement[]>([])
 const [message,setMessage]=useState('')
 const [busy,setBusy]=useState(false)
 async function load(){
  setBusy(true);setMessage('')
  try{
   const client=requireSupabase()
   const [business,placement]=await Promise.all([client.from('published_editorial_businesses').select('id,kind,slug,name').order('name'),client.from('sponsored_placements').select('*').order('priority',{ascending:false})])
   if(business.error||placement.error)throw new Error('load')
   setBusinesses(business.data??[]);setPlacements(placement.data??[])
  }catch{setMessage('Reklam kayıtları yüklenemedi. Yetkiyi ve bağlantıyı kontrol edin.')}
  finally{setBusy(false)}
 }
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return
  const form=event.currentTarget,data=new FormData(form)
  const business=businesses.find(item=>`${item.kind}/${item.id}`===data.get('business'))
  const start=new Date(String(data.get('start'))),end=new Date(String(data.get('end')))
  if(!business||!Number.isFinite(start.getTime())||end<=start){setMessage('İşletmeyi ve tarih aralığını kontrol edin.');return}
  setBusy(true)
  try{
   const {error}=await requireSupabase().from('sponsored_placements').insert({business_kind:business.kind,business_id:business.id,context:data.get('context'),starts_at:start.toISOString(),ends_at:end.toISOString(),priority:Number(data.get('priority')),active:data.get('active')==='on'})
   if(error)throw error
   form.reset();await load();setMessage('Yerleşim kaydedildi. Yayın durumu ve tarih aralığı birlikte uygulanır.')
  }catch{setMessage('Yerleşim kaydedilemedi; başarılı sayılmadı.')}
  finally{setBusy(false)}
 }
 async function toggle(row:Placement){
  setBusy(true)
  try{
   const {data,error}=await requireSupabase().from('sponsored_placements').update({active:!row.active}).eq('id',row.id).eq('active',row.active).select('id').single()
   if(error||!data)throw error
   await load()
  }catch{setMessage('Değişiklik kaydedilemedi. Listeyi yenileyin.')}
  finally{setBusy(false)}
 }
 return <section className="rounded-2xl border border-sky-100 bg-white p-5 space-y-3">
  <h2 className="text-xl font-bold">Sponsorlu yerleşimler</h2>
  <p className="text-sm">Yalnız yayımlanmış editoryal işletmeler. Google puanları değiştirilmez. Yerleşimler ziyaretçiye sponsorlu olarak gösterilir. Tarihler bu cihazın yerel saatinde girilir.</p>
  <button disabled={busy} onClick={()=>void load()} className="min-h-11 border rounded-lg px-4">Kayıtları getir / yenile</button>
  <form onSubmit={save} className="flex flex-wrap gap-3">
   <label>İşletme<select name="business" required className="block border p-2 max-w-full"><option value="">Seçin</option>{businesses.map(row=><option key={`${row.kind}/${row.id}`} value={`${row.kind}/${row.id}`}>{row.name} ({row.kind})</option>)}</select></label>
   <label>Yerleşim<select name="context" className="block border p-2">{['city','hotels','restaurants','activities'].map(value=><option key={value}>{value}</option>)}</select></label>
   <label>Başlangıç<input name="start" type="datetime-local" required className="block border p-2"/></label>
   <label>Bitiş<input name="end" type="datetime-local" required className="block border p-2"/></label>
   <label>Öncelik<input name="priority" type="number" min="0" max="1000" defaultValue="0" className="block border p-2 w-24"/></label>
   <label><input type="checkbox" name="active"/> Aktif</label>
   <button disabled={busy} className="min-h-11 border rounded-lg px-4">Kaydet</button>
  </form>
  <p role="status">{message}</p>
  {placements.map(row=><article key={row.id} className="border-t py-2 break-words"><p>{businesses.find(b=>b.id===row.business_id&&b.kind===row.business_kind)?.name??'Yayında olmayan işletme'} · {row.context} · {row.priority}</p><p>{new Date(row.starts_at).toLocaleString()} — {new Date(row.ends_at).toLocaleString()}</p><button disabled={busy} onClick={()=>void toggle(row)} className="min-h-11 border rounded-lg px-3">{row.active?'Pasifleştir':'Etkinleştir'}</button></article>)}
 </section>
}
