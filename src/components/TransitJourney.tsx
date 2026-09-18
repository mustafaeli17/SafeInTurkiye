import { useEffect, useRef, useState } from 'react'
import { LocateFixed, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import GoogleDirectionsMap from './GoogleDirectionsMap'

type TransitStep = {
  navigationInstruction?: { instructions?: string }
  transitDetails?: {
    headsign?: string
    stopCount?: number
    transitLine?: { name?: string; nameShort?: string }
    stopDetails?: {
      departureStop?: { name?: string }
      arrivalStop?: { name?: string }
      departureTime?: string
      arrivalTime?: string
    }
  }
}

type TransitRoute = {
  duration?: string
  travelAdvisory?: { transitFare?: { currencyCode?: string; units?: string | number; nanos?: number } }
  legs?: Array<{ steps?: TransitStep[] }>
}

export default function TransitJourney({ lang }: { lang: string }) {
  const tr = lang.toLowerCase() === 'tr'
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departure, setDeparture] = useState('')
  const [preference, setPreference] = useState('FEWER_TRANSFERS')
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)
  const [message, setMessage] = useState('')
  const [routes, setRoutes] = useState<TransitRoute[]>([])
  const request = useRef<AbortController | null>(null)

  useEffect(() => () => request.current?.abort(), [])

  const search = async (event: React.FormEvent) => {
    event.preventDefault()
    setRoutes([])
    setMessage('')
    setBusy(true)
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const timeout = setTimeout(() => controller.abort(), 20000)
    try {
      const session = await supabase?.auth.getSession()
      const response = await fetch('/api/transit', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(session?.data.session ? { Authorization: `Bearer ${session.data.session.access_token}` } : {}),
        },
        body: JSON.stringify({
          origin,
          destination,
          departure: departure ? new Date(departure).toISOString() : new Date().toISOString(),
          preference,
          language: lang,
        }),
      })
      if (response.status === 503 || !(response.headers.get('content-type') ?? '').includes('application/json')) {
        throw new Error(tr ? 'Canlı rota servisi henüz bağlı değil.' : 'Live routing is not connected yet.')
      }
      if (response.status === 401) throw new Error(tr ? 'Canlı rota ayrıntıları için hesabına giriş yap. Google haritası aşağıda yine kullanılabilir.' : 'Sign in for detailed live route steps. The Google map below remains available.')
      if (!response.ok) throw new Error(tr ? 'Rota hizmeti yanıt vermedi. Biraz sonra tekrar dene.' : 'The routing service is unavailable. Please retry later.')
      const data = await response.json() as { routes?: TransitRoute[] }
      setRoutes(data.routes ?? [])
      if (!data.routes?.length) setMessage(tr ? 'Bu yerler ve saat için rota bulunamadı. Şehir adlarını da yazarak tekrar dene.' : 'No route was found. Include the city names and try again.')
    } catch (error) {
      setMessage(error instanceof Error && error.name !== 'AbortError' ? error.message : (tr ? 'Arama zaman aşımına uğradı.' : 'Search timed out.'))
    } finally {
      clearTimeout(timeout)
      setBusy(false)
    }
  }

  const useLocation = () => {
    if (!navigator.geolocation) {
      setMessage(tr ? 'Bu tarayıcı konum paylaşımını desteklemiyor.' : 'This browser does not support location sharing.')
      return
    }
    setLocating(true)
    setMessage('')
    navigator.geolocation.getCurrentPosition(
      position => {
        setOrigin(`${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`)
        setLocating(false)
        setRoutes([])
      },
      error => {
        setLocating(false)
        setMessage(error.code === 1
          ? (tr ? 'Konum izni verilmedi. Başlangıcı elle yazabilirsin.' : 'Location permission was declined. Enter the origin manually.')
          : (tr ? 'Konum alınamadı. Başlangıcı elle yazabilirsin.' : 'Location could not be found. Enter the origin manually.'))
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    )
  }

  const input = 'w-full p-3 border border-sky-100 rounded-xl bg-slate-50 text-sm'
  const time = (value?: string) => value ? new Date(value).toLocaleString(lang, { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '—'
  const fare = (route: TransitRoute) => {
    const value = route.travelAdvisory?.transitFare
    if (!value) return tr ? 'Sağlayıcı ücret bildirmedi' : 'Not supplied'
    return `${value.currencyCode ?? 'TRY'} ${(Number(value.units ?? 0) + Number(value.nanos ?? 0) / 1e9).toFixed(2)}`
  }

  return (
    <section className="space-y-4">
      <div className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{tr ? 'Toplu taşıma rotanı oluştur' : 'Plan your public transport journey'}</h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{tr ? 'Konumunu kullan veya herhangi bir adres, durak ya da mekân adı yaz. Sabit rota kullanılmaz.' : 'Use your location or enter any address, stop or place. No fixed route is used.'}</p>
        </div>
        <form onSubmit={search} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            {tr ? 'Nereden?' : 'From'}
            <span className="mt-1 flex gap-2">
              <input required minLength={3} maxLength={250} value={origin} onChange={event => { setOrigin(event.target.value); setRoutes([]) }} className={input} placeholder="Kızılay, Ankara" />
              <button type="button" onClick={useLocation} disabled={locating} title={tr ? 'Konumumu kullan' : 'Use my location'} className="shrink-0 rounded-xl border border-sky-200 bg-sky-50 px-3 text-[#007EAD] disabled:opacity-50">
                <LocateFixed className="h-5 w-5" /><span className="sr-only">{tr ? 'Konumumu kullan' : 'Use my location'}</span>
              </button>
            </span>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {tr ? 'Nereye?' : 'To'}
            <span className="relative mt-1 block">
              <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input required minLength={3} maxLength={250} value={destination} onChange={event => { setDestination(event.target.value); setRoutes([]) }} className={`${input} pl-9`} placeholder="Anıtkabir, Ankara" />
            </span>
          </label>
          <label className="text-sm font-semibold text-slate-700">{tr ? 'Kalkış zamanı (boşsa şimdi)' : 'Departure (blank means now)'}<input type="datetime-local" value={departure} onChange={event => { setDeparture(event.target.value); setRoutes([]) }} className={`${input} mt-1`} /></label>
          <label className="text-sm font-semibold text-slate-700">{tr ? 'Tercih' : 'Preference'}<select value={preference} onChange={event => { setPreference(event.target.value); setRoutes([]) }} className={`${input} mt-1`}><option value="FEWER_TRANSFERS">{tr ? 'Daha az aktarma' : 'Fewer transfers'}</option><option value="LESS_WALKING">{tr ? 'Daha az yürüme' : 'Less walking'}</option></select></label>
          <button disabled={busy} className="rounded-xl bg-[#00A3E0] p-3 font-bold text-white disabled:opacity-50 sm:col-span-2">{busy ? (tr ? 'Rotalar aranıyor…' : 'Searching routes…') : (tr ? 'Rotaları karşılaştır' : 'Compare routes')}</button>
        </form>
        {message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
        {routes.map((route, index) => (
          <article key={index} className="space-y-3 rounded-xl border border-sky-100 p-4">
            <h2 className="font-bold">{tr ? 'Seçenek' : 'Option'} {index + 1} · {Math.ceil(parseFloat(route.duration ?? '0') / 60)} {tr ? 'dakika' : 'min'}</h2>
            <p className="text-sm">{tr ? 'Tahmini toplam ücret' : 'Estimated total fare'}: {fare(route)}</p>
            {route.legs?.flatMap(leg => leg.steps ?? []).map((step, stepIndex) => (
              <div key={stepIndex} className="rounded-lg bg-slate-50 p-3 text-sm">
                {step.transitDetails ? <><strong>{step.transitDetails.transitLine?.nameShort || step.transitDetails.transitLine?.name} · {step.transitDetails.headsign}</strong><p>{step.transitDetails.stopDetails?.departureStop?.name} → {step.transitDetails.stopDetails?.arrivalStop?.name}</p><p>{time(step.transitDetails.stopDetails?.departureTime)} → {time(step.transitDetails.stopDetails?.arrivalTime)} · {step.transitDetails.stopCount} {tr ? 'durak' : 'stops'}</p></> : <p>{step.navigationInstruction?.instructions || (tr ? 'Yürüyüş bağlantısı' : 'Walking connection')}</p>}
              </div>
            ))}
            <p className="text-xs text-slate-500">Google Maps · {tr ? 'Saatler Türkiye saatidir. Tahminler değişebilir; canlı araç konumu değildir.' : 'Times are in Türkiye time. Estimates can change; these are not live vehicle positions.'}</p>
          </article>
        ))}
      </div>
      <GoogleDirectionsMap
        origin={origin}
        destination={destination}
        mode="transit"
        title={tr ? 'Google Maps toplu taşıma rotası' : 'Google Maps transit route'}
        fallback={<div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-sky-100 bg-slate-50 p-6 text-center text-sm text-slate-600">{tr ? 'Google haritası, alan adı kısıtlı tarayıcı anahtarı eklenince burada görünecek.' : 'The Google map will appear here after a domain-restricted browser key is configured.'}</div>}
      />
    </section>
  )
}
