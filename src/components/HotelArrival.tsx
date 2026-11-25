import {useEffect, useId, useRef, useState} from 'react'
import {CarFront, ExternalLink, PlaneLanding, TrainFront} from 'lucide-react'
import HotelAddressCard from './HotelAddressCard'
import PlaceTravelLinks from './PlaceTravelLinks'
import type {NearbyCenter} from '../services/nearbyPlaces'
import {arrivalAirports, airportOptionsForHotel, loadHotelArrival, type ArrivalAirport, type HotelArrivalResult} from '../lib/hotelArrival'
import {hotelArrivalCopy} from '../lib/hotelArrivalCopy'
import {taxiBudgetCopy, taxiDetailsCopy, taxiEstimateCopy} from '../lib/taxiCopy'
import {transitCopy} from '../lib/transitCopy'
import {transferCount} from '../lib/transit'
import {formatTransitDuration} from '../lib/transitDuration'
import {coordinatesDirectionsUrl} from '../lib/placeDirections'
import './HotelArrival.css'

type Hotel = {id:string; category:string; name:string|null; address?:string|null; cityName?:string; coordinates?:NearbyCenter|null}
type Props = {hotel:Hotel; lang:string; googlePlaceId?:string|null; fallbackCity?:string}
type LocatedProps = Props & {hotel:Hotel & {coordinates:NearbyCenter}}
type ComparisonProps = LocatedProps & {result:HotelArrivalResult;airport:ArrivalAirport;travellers:number}

export function HotelArrivalComparison({hotel,lang,result,airport,travellers,googlePlaceId}:ComparisonProps) {
  const t = hotelArrivalCopy[lang], transport = transitCopy[lang]
  const {taxi,transit} = result
  const money = (amount:number,currency:string) => new Intl.NumberFormat(lang,{style:'currency',currency}).format(amount)
  const distance = new Intl.NumberFormat(lang,{style:'unit',unit:'kilometer',maximumFractionDigits:1})
  const {lat,lng} = arrivalAirports[airport].point
  const mapLink = (mode:'driving'|'transit') => {
    const url = new URL(coordinatesDirectionsUrl(hotel.coordinates,googlePlaceId))
    url.searchParams.set('origin',[lat,lng].join(','))
    url.searchParams.set('travelmode',mode)
    return <a className="arrival-map-link" href={url.href} target="_blank" rel="noopener noreferrer">{t.openMap}<ExternalLink size={13} aria-hidden="true"/></a>
  }
  return <div className="arrival-comparison">
    <section className="arrival-option">
      <h3><CarFront size={21} aria-hidden="true"/>{t.taxi}</h3>
      {taxi ? <>
        {taxi.fare ? <>
          <p className="arrival-basis">{taxi.fare.verified ? taxiEstimateCopy[lang][0] : t.budget}</p>
          <dl className="arrival-prices">
            <div><dt>{t.vehicle}</dt><dd>{money(taxi.fare.amount,'TRY')}</dd></div>
            {travellers>1 && <div><dt>{t.share}</dt><dd>{money(taxi.fare.amount/travellers,'TRY')}</dd></div>}
          </dl>
          <p className="arrival-timing">{formatTransitDuration(taxi.duration,lang)} · {distance.format(taxi.distanceKm)}</p>
          <details><summary>{t.source}</summary>
            {!taxi.fare.verified && <p>{taxiBudgetCopy[lang]}</p>}
            <p>{taxiEstimateCopy[lang][1]}</p>
            {travellers>1 && <p>{t.capacity}</p>}
            <p>{taxiDetailsCopy[lang][2]}</p>
            <time dateTime={taxi.fare.reviewed}>{new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(taxi.fare.reviewed+'T00:00:00Z'))}</time>
            {taxi.fare.sources.map(url=><a key={url} className="arrival-source" href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname}</a>)}
          </details>
        </> : <><p>{t.noTaxiFare}</p><p className="arrival-timing">{formatTransitDuration(taxi.duration,lang)} · {distance.format(taxi.distanceKm)}</p></>}
        <small dir="ltr">© OpenStreetMap · OSRM</small>
      </> : <p>{t.roadError}</p>}
      {mapLink('driving')}
    </section>
    <section className="arrival-option">
      <h3><TrainFront size={21} aria-hidden="true"/>{transport.transit}</h3>
      {transit ? <>
        {transit.fare ? <>
          <dl className="arrival-prices">
            <div><dt>{t.rider}</dt><dd>{money(transit.fare.amount,transit.fare.currency)}</dd></div>
            {travellers>1 && <div><dt>{t.group}</dt><dd>{money(transit.fare.amount*travellers,transit.fare.currency)}</dd></div>}
          </dl>
          {travellers>1 && <p>{t.transitGroup}</p>}
        </> : <p>{transport.noFare}</p>}
        <p className="arrival-timing">{formatTransitDuration(transit.duration,lang)} · {transferCount(transit.transfers,lang)}</p>
        {!!transit.lines.length && <p className="arrival-lines"><bdi>{transit.lines.join(' → ')}</bdi></p>}
        <small translate="no" dir="ltr">Google Maps</small>
      </> : <p>{result.transitStatus==='unavailable' ? t.lookupError : t.transitError}</p>}
      {mapLink('transit')}
    </section>
  </div>
}

function ArrivalPanel({hotel,lang,airports,googlePlaceId,fallbackCity}:LocatedProps & {airports:ArrivalAirport[]}) {
  const t = hotelArrivalCopy[lang], heading = useId()
  const [airport,setAirport] = useState<ArrivalAirport>(airports[0])
  const [travellers,setTravellers] = useState(1)
  const [result,setResult] = useState<HotelArrivalResult|null>(null)
  const [busy,setBusy] = useState(false)
  const active = useRef<AbortController|null>(null)
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
      const found = await loadHotelArrival(airport,hotel.coordinates,lang,controller.signal,hotel)
      if (!controller.signal.aborted) setResult(found)
    } catch {
      if (!controller.signal.aborted) setResult({taxi:null,transit:null,transitStatus:'unavailable'})
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  return <section className="hotel-arrival" aria-labelledby={heading} dir={lang==='ar'?'rtl':undefined}>
    <header className="arrival-header">
      <h2 id={heading}><PlaneLanding size={24} aria-hidden="true"/>{t.title}</h2>
      <HotelAddressCard name={hotel.name} address={hotel.address} google={hotel.id.startsWith('google:')} lang={lang}/>
    </header>
    <p className="arrival-intro">{t.disclosure}</p>
    <form onSubmit={compare} className="arrival-controls">
      {airports.length>1 ? <label>{t.airport}<select value={airport} onChange={e=>changeAirport(e.target.value as ArrivalAirport)}>
        {airports.map(code=><option key={code} value={code}>{code} · {arrivalAirports[code].name}</option>)}
      </select></label> : <div className="arrival-single"><span>{t.airport}</span><strong><bdi>{airport} · {arrivalAirports[airport].name}</bdi></strong></div>}
      <label>{t.travellers}<select value={travellers} onChange={e=>setTravellers(Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n} value={n}>{n.toLocaleString(lang)}</option>)}</select></label>
      <button type="submit" className="arrival-submit" disabled={busy}>{busy?t.loading:t.compare}</button>
    </form>
    <div aria-live="polite" aria-busy={busy}>
      {result && <HotelArrivalComparison hotel={hotel} googlePlaceId={googlePlaceId} lang={lang} airport={airport} result={result} travellers={travellers}/>}
    </div>
    <details className="arrival-other"><summary>{t.otherOrigin}</summary>
      <PlaceTravelLinks name={hotel.name} coordinates={hotel.coordinates} city={hotel.cityName} fallbackCity={fallbackCity} googlePlaceId={googlePlaceId} lang={lang}/>
    </details>
    {result && <div className="arrival-sources">
      <a className="arrival-airport-source" href={arrivalAirports[airport].sourceUrl} target="_blank" rel="noopener noreferrer">{airport} · {arrivalAirports[airport].sourceName}<ExternalLink size={12} aria-hidden="true"/></a>
      {arrivalAirports[airport].pointSourceUrl !== arrivalAirports[airport].sourceUrl &&
        <a className="arrival-airport-source" href={arrivalAirports[airport].pointSourceUrl} target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors<ExternalLink size={12} aria-hidden="true"/></a>}
    </div>}
  </section>
}

export default function HotelArrival({hotel,lang,googlePlaceId,fallbackCity}:Props) {
  if (hotel.category!=='hotel') return null
  const airports=airportOptionsForHotel(hotel)
  if (!airports.length || !hotel.coordinates) return <>
    <HotelAddressCard name={hotel.name} address={hotel.address} google={hotel.id.startsWith('google:')} lang={lang}/>
    <PlaceTravelLinks name={hotel.name} coordinates={hotel.coordinates} city={hotel.cityName} fallbackCity={fallbackCity} googlePlaceId={googlePlaceId} lang={lang}/>
  </>
  const locale = Object.hasOwn(hotelArrivalCopy,lang) ? lang : 'en'
  return <ArrivalPanel key={[hotel.id,hotel.coordinates.lat,hotel.coordinates.lng,airports.join(','),locale].join('|')} hotel={{...hotel,coordinates:hotel.coordinates}} airports={airports} googlePlaceId={googlePlaceId} fallbackCity={fallbackCity} lang={locale}/>
}
