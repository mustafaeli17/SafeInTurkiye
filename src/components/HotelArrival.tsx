import {useEffect, useId, useRef, useState} from 'react'
import {CarFront, ExternalLink, Languages, PlaneLanding, TrainFront, X} from 'lucide-react'
import type {NearbyPlaceRecord} from '../services/nearbyPlaces'
import {arrivalAirports, arrivalAirportSource, comparableHotel, loadHotelArrival, type ArrivalAirport, type HotelArrivalResult} from '../lib/hotelArrival'
import {hotelArrivalCopy} from '../lib/hotelArrivalCopy'
import {taxiBudgetCopy, taxiDetailsCopy, taxiEstimateCopy} from '../lib/taxiCopy'
import {transitCopy} from '../lib/transitCopy'
import {transferCount} from '../lib/transit'
import {formatTransitDuration} from '../lib/transitDuration'
import {placeDirectionsUrl} from '../lib/placeDirections'
import './HotelArrival.css'

type Props = {hotel:NearbyPlaceRecord;lang:string}
type ComparisonProps = Props & {result:HotelArrivalResult;airport:ArrivalAirport;travellers:number}

export function HotelArrivalComparison({hotel,lang,result,airport,travellers}:ComparisonProps) {
  const t = hotelArrivalCopy[lang], transport = transitCopy[lang]
  const {taxi,transit} = result
  const money = (amount:number,currency:string) => new Intl.NumberFormat(lang,{style:'currency',currency}).format(amount)
  const distance = new Intl.NumberFormat(lang,{style:'unit',unit:'kilometer',maximumFractionDigits:1})
  const {lat,lng} = arrivalAirports[airport].point
  const mapLink = (mode:'driving'|'transit') => {
    const url = new URL(placeDirectionsUrl(hotel))
    url.searchParams.set('origin',[lat,lng].join(','))
    url.searchParams.set('travelmode',mode)
    return <a className="arrival-map-link" href={url.href} target="_blank" rel="noopener noreferrer">{t.openMap}<ExternalLink size={13} aria-hidden="true"/></a>
  }
  return <div className="arrival-comparison">
    <section className="arrival-option">
      <h3><CarFront size={21} aria-hidden="true"/>{t.taxi}</h3>
      {taxi ? <>
        <p className="arrival-timing">{formatTransitDuration(taxi.duration,lang)} · {distance.format(taxi.distanceKm)}</p>
        {taxi.fare ? <>
          <p>{taxi.fare.verified ? taxiEstimateCopy[lang][0] : taxiBudgetCopy[lang]}</p>
          <dl className="arrival-prices">
            <div><dt>{t.vehicle}</dt><dd>{money(taxi.fare.amount,'TRY')}</dd></div>
            {travellers>1 && <div><dt>{t.share}</dt><dd>{money(taxi.fare.amount/travellers,'TRY')}</dd></div>}
          </dl>
          {travellers>1 && <p>{t.capacity}</p>}
          <p>{taxiEstimateCopy[lang][1]}</p>
          <details><summary>{t.source}</summary>
            <p>{taxiDetailsCopy[lang][2]}</p>
            <time dateTime={taxi.fare.reviewed}>{new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(taxi.fare.reviewed+'T00:00:00Z'))}</time>
            {taxi.fare.sources.map(url=><a key={url} className="arrival-source" href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname}</a>)}
          </details>
        </> : <p>{t.noTaxiFare}</p>}
        <small dir="ltr">© OpenStreetMap · OSRM</small>
      </> : <p>{t.roadError}</p>}
      {mapLink('driving')}
    </section>
    <section className="arrival-option">
      <h3><TrainFront size={21} aria-hidden="true"/>{transport.transit}</h3>
      {transit ? <>
        <p className="arrival-timing">{formatTransitDuration(transit.duration,lang)} · {transferCount(transit.transfers,lang)}</p>
        {!!transit.lines.length && <p className="arrival-lines"><bdi>{transit.lines.join(' → ')}</bdi></p>}
        {transit.fare ? <>
          <dl className="arrival-prices">
            <div><dt>{t.rider}</dt><dd>{money(transit.fare.amount,transit.fare.currency)}</dd></div>
            {travellers>1 && <div><dt>{t.group}</dt><dd>{money(transit.fare.amount*travellers,transit.fare.currency)}</dd></div>}
          </dl>
          {travellers>1 && <p>{t.transitGroup}</p>}
        </> : <p>{transport.noFare}</p>}
        <small translate="no" dir="ltr">Google Maps</small>
      </> : <p>{t.transitError}</p>}
      {mapLink('transit')}
    </section>
  </div>
}

function ArrivalPanel({hotel,lang}:Props) {
  const t = hotelArrivalCopy[lang], heading = useId(), dialogTitle = useId()
  const [airport,setAirport] = useState<ArrivalAirport>('IST')
  const [travellers,setTravellers] = useState(1)
  const [result,setResult] = useState<HotelArrivalResult|null>(null)
  const [busy,setBusy] = useState(false)
  const active = useRef<AbortController|null>(null)
  const driverCard = useRef<HTMLDialogElement>(null)
  useEffect(()=>()=>active.current?.abort(),[])
  function changeAirport(next:ArrivalAirport) {
    active.current?.abort()
    setResult(null)
    setBusy(false)
    setAirport(next)
  }
  async function compare(event:React.FormEvent) {
    event.preventDefault()
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setResult(null)
    try {
      const found = await loadHotelArrival(airport,hotel.coordinates,lang,controller.signal)
      if (!controller.signal.aborted) setResult(found)
    } catch {
      if (!controller.signal.aborted) setResult({taxi:null,transit:null})
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  return <section className="hotel-arrival" aria-labelledby={heading} dir={lang==='ar'?'rtl':undefined}>
    <header className="arrival-header">
      <h2 id={heading}><PlaneLanding size={24} aria-hidden="true"/>{t.title}</h2>
      <button type="button" className="arrival-driver" aria-haspopup="dialog" onClick={()=>driverCard.current?.showModal()}><Languages size={17} aria-hidden="true"/>{t.driver}</button>
    </header>
    <p className="arrival-intro">{t.disclosure}</p>
    <form onSubmit={compare} className="arrival-controls">
      <label>{t.airport}<select value={airport} onChange={e=>changeAirport(e.target.value as ArrivalAirport)}>
        {(Object.keys(arrivalAirports) as ArrivalAirport[]).map(code=><option key={code} value={code}>{code} · {arrivalAirports[code].name}</option>)}
      </select></label>
      <label>{t.travellers}<select value={travellers} onChange={e=>setTravellers(Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n} value={n}>{n.toLocaleString(lang)}</option>)}</select></label>
      <button type="submit" className="arrival-submit" disabled={busy}>{busy?t.loading:t.compare}</button>
    </form>
    <div aria-live="polite" aria-busy={busy}>
      {result && <HotelArrivalComparison hotel={hotel} lang={lang} airport={airport} result={result} travellers={travellers}/>}
    </div>
    {result && <a className="arrival-airport-source" href={arrivalAirportSource} target="_blank" rel="noopener noreferrer">{t.airport} · Havaist<ExternalLink size={12} aria-hidden="true"/></a>}
    <dialog ref={driverCard} aria-labelledby={dialogTitle} className="arrival-dialog">
      <header><h2 id={dialogTitle}>{t.driver}</h2><button type="button" aria-label={t.close} onClick={()=>driverCard.current?.close()}><X size={24} aria-hidden="true"/></button></header>
      <p>{t.driverHint}</p>
      <div className="arrival-driver-address" lang="tr" dir="ltr">
        <p>Lütfen beni bu otele götürür müsünüz?</p>
        <strong dir="auto">{hotel.name}</strong>
        <address dir="auto">{hotel.address}</address>
      </div>
      {hotel.id.startsWith('google:') && <small dir="ltr" translate="no">Google Maps</small>}
    </dialog>
  </section>
}

export default function HotelArrival({hotel,lang}:Props) {
  if (!comparableHotel(hotel)) return null
  const locale = Object.hasOwn(hotelArrivalCopy,lang) ? lang : 'en'
  return <ArrivalPanel key={[hotel.id,hotel.coordinates.lat,hotel.coordinates.lng,locale].join('|')} hotel={hotel} lang={locale}/>
}
