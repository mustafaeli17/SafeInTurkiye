import { useState } from 'react'
import { createBooking } from '../repositories/bookingRepository'
import { requireSupabase } from '../lib/supabase'

// Requests are pending until staff contact the restaurant. No payment or automatic confirmation.
export default function RestaurantRequest({name,source,lang}:{name:string;source:string;lang:string}) {
  const tr=lang==='tr'
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [reference,setReference]=useState('')
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if(busy||reference)return
    const data=new FormData(event.currentTarget)
    const today=new Date();today.setHours(0,0,0,0)
    if(new Date(`${data.get('date')}T00:00:00`)<today){setMessage(tr?'Gelecek bir tarih seçin.':'Please choose today or a future date.');return}
    setBusy(true);setMessage('')
    try {
      const {data:auth,error}=await requireSupabase().auth.getUser()
      if(error||!auth.user){setMessage(tr?'Talep göndermek için önce hesabınıza giriş yapın.':'Please sign in to your account before sending a request.');return}
      const result=await createBooking({listingType:'restaurant',listingName:name,guestName:String(data.get('name')).trim(),guestEmail:String(data.get('email')).trim(),visitDate:String(data.get('date')),guestCount:Number(data.get('guests')),notes:JSON.stringify({time:data.get('time'),phone:data.get('phone'),source,notes:data.get('notes')})})
      setReference(result.reference_code)
    } catch {setMessage(tr?'Talep kaydedilemedi. Lütfen tekrar deneyin; rezervasyon henüz oluşturulmadı.':'The request could not be saved. Please try again; no reservation has been made.')}
    finally{setBusy(false)}
  }
  if(reference)return <p role="status" className="mt-4 rounded-xl bg-sky-50 p-4">{tr?'Talebiniz alındı. Ekibimiz restoranla görüşecek. Bu, kesinleşmiş rezervasyon değildir. Referans: ':'Request received. Our team will contact the restaurant. This is not a confirmed reservation. Reference: '}{reference}</p>
  const fields=[['name',tr?'Ad soyad':'Full name','text'],['email',tr?'E-posta':'Email','email'],['phone',tr?'Telefon (ülke koduyla)':'Phone (with country code)','tel'],['date',tr?'Tarih':'Date','date'],['time',tr?'Restoranın yerel saati':'Restaurant local time','time'],['guests',tr?'Kişi sayısı':'Guests','number']]
  return <form onSubmit={submit} className="mt-5 rounded-xl border border-sky-100 p-4 space-y-3">
    <h4 className="font-bold">{tr?'Rezervasyon talebi':'Reservation request'}</h4>
    <p className="text-sm">{tr?'SafeInTürkiye restoranı arayarak müsaitliği kontrol eder. Onay gelmeden rezervasyon kesinleşmez. İletişim bilgileriniz talebi yürütmek için kullanılır.':'SafeInTürkiye will call the restaurant to check availability. Wait for confirmation before considering your table reserved. Your contact details are used to handle this request.'}</p>
    <div className="grid sm:grid-cols-2 gap-3">{fields.map(([key,label,type])=><label key={key} className="text-sm">{label}<input className="block w-full border rounded-lg p-2" name={key} type={type} required maxLength={key==='name'?100:254} min={key==='guests'?1:undefined} max={key==='guests'?20:undefined} defaultValue={key==='guests'?2:undefined}/></label>)}</div>
    <label className="block text-sm">{tr?'Not (isteğe bağlı)':'Note (optional)'}<textarea name="notes" maxLength={1000} className="block w-full border rounded-lg p-2"/></label>
    <button disabled={busy} className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{busy?'…':tr?'Talep gönder':'Send request'}</button>
    <p role="status">{message}</p>
  </form>
}
