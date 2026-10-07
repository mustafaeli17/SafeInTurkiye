import { useEffect, useRef, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import GoogleDirectionsMap from './GoogleDirectionsMap'
import { transitDeparture, transitFare, transitRoutes, type TransitRoute } from '../lib/transit'
import { transitCopy } from '../lib/transitCopy'

export default function TransitJourney({ lang }: { lang: string }) {
  const locale = lang.toLowerCase() in transitCopy ? lang.toLowerCase() : 'en'
  const t = transitCopy[locale]
  const [origin, setOrigin] = useState(''), [destination, setDestination] = useState('')
  const [coordinates, setCoordinates] = useState<{lat:number;lng:number} | null>(null)
  const [departure, setDeparture] = useState(''), [preference, setPreference] = useState('RECOMMENDED')
  const [busy, setBusy] = useState(false), [locating, setLocating] = useState(false)
  const [message, setMessage] = useState<keyof typeof t | ''>('')
  const [routes, setRoutes] = useState<TransitRoute[]>([]), [selected, setSelected] = useState(0)
  const request = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const reset = () => { generation.current++; request.current?.abort(); setBusy(false); setRoutes([]); setMessage(''); setSelected(0) }
  useEffect(() => { reset(); return () => { generation.current++; request.current?.abort() } }, [locale])

  const search = async (event: React.FormEvent) => {
    event.preventDefault(); reset()
    const time = transitDeparture(departure)
    if (!origin.trim() || !destination.trim() || !time) { setMessage('invalid'); return }
    setBusy(true)
    const id = generation.current, controller = new AbortController()
    request.current = controller
    const timeout = setTimeout(() => controller.abort(), 20000)
    try {
      const response = await fetch('/api/transit', { method:'POST', signal:controller.signal, headers:{'Content-Type':'application/json'}, body:JSON.stringify({origin:coordinates ?? origin.trim(),destination:destination.trim(),departure:time,preference,language:locale}) })
      if (id !== generation.current) return
      if (!response.ok) { setMessage(response.status === 429 ? 'busy' : response.status === 400 ? 'invalid' : 'error'); return }
      const data = await response.json()
      if (id !== generation.current) return
      const found = transitRoutes(data.routes)
      if (!Array.isArray(data.routes) || (data.routes.length && !found.length)) { setMessage('error'); return }
      setRoutes(found); if (!found.length) setMessage('empty')
    } catch (error) { if (id === generation.current) setMessage(error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'error') }
    finally { clearTimeout(timeout); if (id === generation.current) setBusy(false) }
  }
  const useLocation = () => {
    reset(); if (!navigator.geolocation) { setMessage('noLocation'); return }
    const id = generation.current
    setLocating(true)
    navigator.geolocation.getCurrentPosition(position => { setLocating(false); if(id!==generation.current)return; setCoordinates({lat:position.coords.latitude,lng:position.coords.longitude}); setOrigin(t.location) }, error => { setLocating(false); if(id===generation.current)setMessage(error.code===1?'denied':'noLocation') }, {enableHighAccuracy:false,timeout:12000,maximumAge:60000})
  }
  const input = 'mt-1 w-full min-w-0 rounded-xl border border-sky-100 bg-slate-50 p-3 text-sm text-slate-900'
  const route = routes[selected]
  const steps = route?.legs.flatMap(leg => leg.steps) ?? []
  const time = (value?:string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(locale,{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}) : ''
  return <section aria-label={t.title} dir={locale==='ar'?'rtl':undefined} className="mb-6 space-y-4 rounded-2xl border border-sky-100 bg-white p-4 sm:p-6">
    <h2 className="text-xl font-extrabold text-slate-900">{t.title}</h2><p className="text-sm text-slate-600">{t.intro}</p>
    <form onSubmit={search} className="grid min-w-0 gap-3 sm:grid-cols-2">
      <label className="min-w-0 text-sm font-semibold">{t.from}<span className="flex gap-2"><input required minLength={3} maxLength={250} value={origin} onChange={e=>{reset();setCoordinates(null);setOrigin(e.target.value)}} className={input} placeholder="Taksim, İstanbul"/><button type="button" onClick={useLocation} disabled={locating||busy} aria-label={t.locate} title={t.locate} className="mt-1 min-h-11 min-w-11 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-700 disabled:opacity-50"><LocateFixed size={20}/></button></span></label>
      <label className="min-w-0 text-sm font-semibold">{t.to}<input required minLength={3} maxLength={250} value={destination} onChange={e=>{reset();setDestination(e.target.value)}} className={input} placeholder="Sultanahmet, İstanbul"/></label>
      <label className="min-w-0 text-sm font-semibold">{t.departure}<input type="datetime-local" value={departure} onChange={e=>{reset();setDeparture(e.target.value)}} className={input}/></label>
      <label className="min-w-0 text-sm font-semibold">{t.preference}<select value={preference} onChange={e=>{reset();setPreference(e.target.value)}} className={input}><option value="RECOMMENDED">{t.recommended}</option><option value="LESS_WALKING">{t.walking}</option><option value="FEWER_TRANSFERS">{t.transfers}</option></select></label>
      <button disabled={busy||locating} className="min-h-11 rounded-xl bg-[#087FFF] p-3 font-bold text-white disabled:opacity-50 sm:col-span-2">{busy?t.loading:t.search}</button>
    </form>
    <div role="status" aria-live="polite">{(message||busy)&&<p className="rounded-xl bg-sky-50 p-3 text-sm text-slate-700">{busy?t.loading:message?t[message]:''}</p>}</div>
    {routes.length>0&&<div className="flex flex-wrap gap-2">{routes.map((r,i)=><button key={i} type="button" aria-pressed={selected===i} onClick={()=>setSelected(i)} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold ${selected===i?'border-blue-500 bg-blue-50 text-blue-800':'border-sky-100 text-slate-700'}`}>{t.option} {i+1} · {Math.ceil(parseFloat(r.duration)/60)} {t.minutes}</button>)}</div>}
    {route&&<>
      <div className="flex flex-wrap gap-4 text-sm text-slate-700"><span>{Math.max(0,steps.filter(s=>s.transitDetails).length-1)} {t.change}</span>{typeof route.distanceMeters==='number'&&<span>{t.distance}: {new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(route.distanceMeters/1000)} km</span>}<span>{t.fare}: {transitFare(route,locale)??t.noFare}</span></div>
      <GoogleDirectionsMap origin={origin} destination={destination} mode="transit" title={t.map} routePolyline={route.polyline?.encodedPolyline??''} fallback={<p className="rounded-xl bg-slate-50 p-4 text-sm">{t.noMap}</p>}/>
      <h3 className="font-bold">{t.details}</h3><ol className="space-y-2">{steps.map((step,i)=>{const d=step.transitDetails;return <li key={i} className="break-words rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{d?<><strong>{d.transitLine?.nameShort||d.transitLine?.name||t.transit}{d.headsign?` · ${d.headsign}`:''}</strong><p>{d.stopDetails?.departureStop?.name} → {d.stopDetails?.arrivalStop?.name}</p><p>{time(d.stopDetails?.departureTime)} → {time(d.stopDetails?.arrivalTime)}{typeof d.stopCount==='number'?` · ${d.stopCount} ${t.stops}`:''}</p></>:<><strong>{t.walk}</strong>{step.navigationInstruction?.instructions&&<p>{step.navigationInstruction.instructions}</p>}{step.staticDuration&&<span>{Math.ceil(parseFloat(step.staticDuration)/60)} {t.minutes}</span>}</>}</li>})}</ol>
      <p className="text-xs leading-relaxed text-slate-500">Google Maps · {t.notice}</p>
    </>}
  </section>
}
