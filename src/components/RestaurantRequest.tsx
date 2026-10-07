import { useState } from 'react'
import { createBooking } from '../repositories/bookingRepository'
import { requireSupabase } from '../lib/supabase'
import { restaurantRequestCopy } from '../lib/restaurantRequestCopy'

// Requests are pending until staff contact the restaurant. No payment or automatic confirmation.
export default function RestaurantRequest({name,source,lang}:{name:string;source:string;lang:string}) {
  const t=restaurantRequestCopy[lang]??restaurantRequestCopy.en
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState<number|null>(null)
  const [reference,setReference]=useState('')
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if(busy||reference)return
    const data=new FormData(event.currentTarget)
    const today=new Date();today.setHours(0,0,0,0)
    if(new Date(`${data.get('date')}T00:00:00`)<today){setMessage(10);return}
    setBusy(true);setMessage(null)
    try {
      const {data:auth,error}=await requireSupabase().auth.getUser()
      if(error||!auth.user){setMessage(11);return}
      const result=await createBooking({listingType:'restaurant',listingName:name,guestName:String(data.get('name')).trim(),guestEmail:String(data.get('email')).trim(),visitDate:String(data.get('date')),guestCount:Number(data.get('guests')),notes:JSON.stringify({time:data.get('time'),phone:data.get('phone'),source,notes:data.get('notes')})})
      setReference(result.reference_code)
    } catch {setMessage(12)}
    finally{setBusy(false)}
  }
  if(reference)return <p dir={lang==='ar'?'rtl':'ltr'} role="status" className="mt-4 rounded-xl bg-sky-50 p-4">{t[13]}<bdi>{reference}</bdi></p>
  const fields=[['name',t[2],'text'],['email',t[3],'email'],['phone',t[4],'tel'],['date',t[5],'date'],['time',t[6],'time'],['guests',t[7],'number']]
  return <form lang={lang} dir={lang==='ar'?'rtl':'ltr'} onSubmit={submit} className="mt-5 rounded-xl border border-sky-100 p-4 space-y-3">
    <h4 className="font-bold">{t[0]}</h4>
    <p className="text-sm">{t[1]}</p>
    <div className="grid sm:grid-cols-2 gap-3">{fields.map(([key,label,type])=><label key={key} className="text-sm">{label}<input className="block w-full border rounded-lg p-2" name={key} type={type} required maxLength={key==='name'?100:254} min={key==='guests'?1:undefined} max={key==='guests'?20:undefined} defaultValue={key==='guests'?2:undefined}/></label>)}</div>
    <label className="block text-sm">{t[8]}<textarea name="notes" maxLength={1000} className="block w-full border rounded-lg p-2"/></label>
    <button disabled={busy} className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{busy?'…':t[9]}</button>
    <p role="status">{message!==null?t[message]:''}</p>
  </form>
}
