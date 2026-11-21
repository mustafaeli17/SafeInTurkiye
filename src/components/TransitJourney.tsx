import {SearchGuide} from './SearchGuide';
import { useEffect, useRef, useState } from 'react'
import { LocateFixed, Clock3, ArrowRightLeft, ExternalLink } from 'lucide-react'
import {formatTransitDuration} from '../lib/transitDuration'
import TransitAddressInput, {type TransitPlace} from './TransitAddressInput'
import {resolveTransitEndpoint} from '../lib/transitEndpoint'
import {peekTransitHandoff,clearTransitHandoff} from '../lib/transitHandoff'
import GoogleDirectionsMap from './GoogleDirectionsMap'
import { requestTransitLocation, transitDeparture, transitFare, transitRequestTime, transitRoutes,transitSummary,transitStages,transitTime,transferCount,transitDurationCopy, type TransitRoute } from '../lib/transit'
import {transitComparisonCopy} from '../lib/transitComparisonCopy'
import { transitCopy, transitVehicle } from '../lib/transitCopy'

export default function TransitJourney({ lang, city, examples, onShowLines, linesLabel }: { lang: string; city:string; examples:[string,string]; onShowLines?:()=>void; linesLabel?:string }) {
  const locale = lang.toLowerCase() in transitCopy ? lang.toLowerCase() : 'en'
  const t = transitCopy[locale]
  const compare=transitComparisonCopy[locale]??transitComparisonCopy.en
  const [handoff] = useState(peekTransitHandoff)
  useEffect(() => clearTransitHandoff(), [])
  const originSelection = useRef<Promise<TransitPlace|null>|null>(null)
  const destinationSelection = useRef<Promise<TransitPlace|null>|null>(null)
  const [origin, setOrigin] = useState(handoff?.origin.label ?? ''), [destination, setDestination] = useState(handoff?.destination.label ?? '')
  const [coordinates, setCoordinates] = useState<{lat:number;lng:number} | null>(handoff?.origin ?? null)
  const [destinationCoordinates,setDestinationCoordinates]=useState<{lat:number;lng:number}|null>(handoff?.destination ?? null)
  const [scheduled,setScheduled]=useState(false)
  const timing:Record<string,[string,string]>={es:['Ahora','Elegir otra hora'],en:['Now','Choose another time'],tr:['Şimdi','Başka saat seç'],de:['Jetzt','Andere Uhrzeit wählen'],fr:['Maintenant','Choisir une autre heure'],ar:['الآن','اختر وقتًا آخر'],ru:['Сейчас','Выбрать другое время'],zh:['现在','选择其他时间']}
  const [departure, setDeparture] = useState(''), [preference, setPreference] = useState('RECOMMENDED')
  const [busy, setBusy] = useState(false), [locating, setLocating] = useState(false)
  const [message, setMessage] = useState<keyof typeof t | ''>('')
  const [routes, setRoutes] = useState<TransitRoute[]>([]), [selected, setSelected] = useState(0)
  const request = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const recent = useRef<{key:string;time:number;routes:TransitRoute[]} | null>(null)
  const reset = () => { generation.current++; request.current?.abort(); setBusy(false); setRoutes([]); setMessage(''); setSelected(0) }
  useEffect(() => { reset(); return () => { generation.current++; request.current?.abort() } }, [locale])

  const search = async (event: React.FormEvent) => {
    event.preventDefault(); reset()
    const time = transitDeparture(scheduled?departure:'')
    if (!origin.trim() || !destination.trim() || !time) { setMessage('invalid'); return }
    const id = generation.current
    const fromPending = originSelection.current, toPending = destinationSelection.current
    setBusy(true)
    const [fromPoint,toPoint] = await Promise.all([
      resolveTransitEndpoint(fromPending,coordinates,origin),resolveTransitEndpoint(toPending,destinationCoordinates,destination)
    ])
    if (id !== generation.current) return
    if (!fromPoint || !toPoint) { setBusy(false); setMessage('invalid'); return }
    const key=JSON.stringify([fromPoint,toPoint,scheduled?departure:'',preference,locale])
    if(recent.current?.key===key && transitRequestTime()-recent.current.time<30000){setRoutes(recent.current.routes);setBusy(false);return}
    const controller = new AbortController()
    request.current = controller
    const timeout = setTimeout(() => controller.abort(), 20000)
    try {
      const response = await fetch('/api/transit', { method:'POST', signal:controller.signal, headers:{'Content-Type':'application/json'}, body:JSON.stringify({origin:fromPoint,destination:toPoint,departure:time,preference,language:locale}) })
      if (id !== generation.current) return
      if (!response.ok) { setMessage(response.status === 429 ? 'busy' : response.status === 400 ? 'invalid' : 'error'); return }
      const data = await response.json()
      if (id !== generation.current) return
      const found = transitRoutes(data.routes)
      if (!Array.isArray(data.routes) || (data.routes.length && !found.length)) { setMessage('error'); return }
      setRoutes(found); if (!found.length) setMessage('empty'); else recent.current={key,time:transitRequestTime(),routes:found}
    } catch (error) { if (id === generation.current) setMessage(error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'error') }
    finally { clearTimeout(timeout); if (id === generation.current) setBusy(false) }
  }
  const useLocation = () => {
    originSelection.current=null
    reset()
    const id = generation.current
    setLocating(true)
    requestTransitLocation(navigator.geolocation).then(point=>{if(id===generation.current){setCoordinates(point);setOrigin(t.location)}}).catch(error=>{if(id===generation.current)setMessage(error instanceof Error&&error.message==='denied'?'denied':'noLocation')}).finally(()=>setLocating(false))
  }
  const input = 'mt-1 w-full min-w-0 rounded-xl border border-sky-100 bg-slate-50 p-3 text-sm text-slate-900'
  const route = routes[selected]
  const steps = route?transitStages(route):[]
  const summary=route?transitSummary(route):null
  const time = (value?:string) => transitTime(value,locale)
  const durationCopy=transitDurationCopy[locale]??transitDurationCopy.en
  return <section aria-label={t.title} dir={locale==='ar'?'rtl':undefined} className="transit-journey mb-6 space-y-4 rounded-2xl border border-sky-100 bg-white p-4 sm:p-6">
    <h2 className="text-xl font-extrabold text-slate-900">{t.title}</h2><p className="text-sm text-slate-600">{t.intro}</p>
    <form onSubmit={search} className="transit-route-form grid min-w-0 gap-3 sm:grid-cols-2">
      <div className="flex min-w-0 items-end gap-2"><TransitAddressInput label={t.from} locale={locale} value={origin} selected={!!coordinates} onSelectionPending={pending=>{reset();originSelection.current=pending}} onChange={value=>{originSelection.current=null;reset();setCoordinates(null);setOrigin(value)}} onSelect={place=>{setCoordinates(place);setOrigin(place.label)}} city={city} placeholder={examples[0]}/><button type="button" onClick={useLocation} disabled={locating||busy} aria-label={t.locate} title={t.locate} className="min-h-11 min-w-11 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-700 disabled:opacity-50"><LocateFixed size={20}/></button></div>
      <TransitAddressInput label={t.to} locale={locale} value={destination} selected={!!destinationCoordinates} onSelectionPending={pending=>{reset();destinationSelection.current=pending}} onChange={value=>{destinationSelection.current=null;reset();setDestinationCoordinates(null);setDestination(value)}} onSelect={place=>{setDestinationCoordinates(place);setDestination(place.label)}} city={city} placeholder={examples[1]}/>
      <div className="min-w-0"><div className="flex flex-wrap gap-2"><button type="button" aria-pressed={!scheduled} onClick={()=>{reset();setScheduled(false);setDeparture('')}} className={`min-h-11 rounded-xl border px-3 text-sm ${!scheduled?'bg-sky-100 text-sky-800':'bg-white'}`}>{timing[locale][0]}</button><button type="button" aria-pressed={scheduled} onClick={()=>{reset();setScheduled(true)}} className="min-h-11 rounded-xl border px-3 text-sm">{timing[locale][1]}</button></div>{scheduled&&<label className="text-sm font-semibold">{t.departure.split(/[（(]/)[0].trim()}<input required type="datetime-local" value={departure} onChange={e=>{reset();setDeparture(e.target.value)}} className={input}/></label>}</div>
      <label className="min-w-0 text-sm font-semibold">{t.preference}<select value={preference} onChange={e=>{reset();setPreference(e.target.value)}} className={input}><option value="RECOMMENDED">{t.recommended}</option><option value="LESS_WALKING">{t.walking}</option><option value="FEWER_TRANSFERS">{t.transfers}</option></select></label>
      <button disabled={busy||locating} className="min-h-11 rounded-xl bg-[#087FFF] p-3 font-bold text-white disabled:opacity-50 sm:col-span-2">{busy?t.loading:t.search}</button>
    </form>
    <div role="status" aria-live="polite">{(message||busy)&&<p className="rounded-xl bg-sky-50 p-3 text-sm text-slate-700">{busy?t.loading:message?t[message]:''}</p>}</div>
    {onShowLines && ['empty','error','timeout','busy'].includes(message) &&
      <button type="button" onClick={onShowLines} className="min-h-11 text-sm font-bold text-blue-700 underline">{linesLabel}</button>}
    <div className="transit-results-layout">
    {routes.length>0&&<div className="transit-route-options grid gap-2">{routes.map((r,i)=>{const s=transitSummary(r);const fare=transitFare(r,locale);return <button key={i} type="button" aria-pressed={selected===i} onClick={()=>setSelected(i)} className="transit-option">
      <span className="transit-option-top"><span>{t.option} {i+1}</span><strong><Clock3 size={18} aria-hidden="true"/>{formatTransitDuration(r.duration,locale)}</strong></span>
      {s.lines.length>0&&<span className="transit-line-badges">{s.lines.map((line,j)=><span key={j}>{line}</span>)}</span>}
      <span className="transit-option-facts"><span><ArrowRightLeft size={15} aria-hidden="true"/>{transferCount(s.transfers,locale)}</span></span>
      {fare&&<span className="transit-option-fare">{t.fare}: <strong>{fare}</strong></span>}
    </button>})}</div>}
    {route&&<div className="transit-result-map"><GoogleDirectionsMap origin={origin} destination={destination} mode="transit" title={t.map} routePolyline={route.polyline?.encodedPolyline??''} fallback={<div className="transit-map-fallback"><p>{t.noMap}</p><a href={'https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',origin:coordinates?`${coordinates.lat},${coordinates.lng}`:origin,destination:destinationCoordinates?`${destinationCoordinates.lat},${destinationCoordinates.lng}`:destination,travelmode:'transit'})} target="_blank" rel="noreferrer">Google Maps <ExternalLink size={16} aria-hidden="true"/></a></div>}/></div>}
    </div>
    {route&&<details key={selected} className="transit-selected-details"><summary>{t.option} {selected+1} · {t.details}</summary><div className="transit-details-body"><p className="text-sm text-slate-600">{durationCopy[1]}</p>
      <div className="flex flex-wrap gap-4 text-sm text-slate-700"><span>{transferCount(summary?.transfers??0,locale)}</span>{typeof route.distanceMeters==='number'&&<span>{t.distance}: {new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(route.distanceMeters/1000)} km</span>}<span>{t.fare}: {transitFare(route,locale)??t.noFare}</span></div>
      <p className="text-xs text-slate-600">{summary?.boarding?`${compare[0]}: ${time(summary.boarding)} · `:''}{summary?.alighting?`${compare[1]}: ${time(summary.alighting)} · `:''}{compare[4]}</p>

      <p className="flex gap-4 text-xs"><span className="text-green-700">● {t.from}</span><span className="text-rose-700">● {t.to}</span></p>

      <ol className="space-y-2">{steps.map((step,i)=>{
        const d=step.transitDetails
        return <li key={i} className="break-words rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{d?<>
          <p className="text-xs font-semibold text-sky-700">{transitVehicle(d.transitLine?.vehicle?.type,locale)}</p>
          <strong>{d.transitLine?.nameShort||d.transitLine?.name||t.transit}{d.headsign?` · ${d.headsign}`:''}</strong>
          <p>{d.stopDetails?.departureStop?.name} → {d.stopDetails?.arrivalStop?.name}</p>
          <p>{time(d.stopDetails?.departureTime)} → {time(d.stopDetails?.arrivalTime)}{typeof d.stopCount==='number'?` · ${d.stopCount} ${t.stops}`:''}</p>
        </>:<><strong>{t.walk}</strong>{step.staticDuration&&<span> · {formatTransitDuration(step.staticDuration,locale)}</span>}{typeof step.distanceMeters==='number'&&<span> · {new Intl.NumberFormat(locale).format(step.distanceMeters)} m</span>}{!!step.instructions?.length&&<details><summary className="min-h-11 cursor-pointer py-2">{compare[3]}</summary><ol>{step.instructions.map((instruction,j)=><li key={j}>{instruction}</li>)}</ol></details>}</>}</li>
      })}</ol>
      <p className="text-xs leading-relaxed text-slate-500">Google Maps · {t.notice}</p>
    </div></details>}
    <SearchGuide path="/transport" lang={lang}/>
  </section>
}
