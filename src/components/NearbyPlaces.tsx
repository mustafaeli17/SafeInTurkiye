import { useEffect, useRef, useState } from 'react'
import { Clock3, ExternalLink, LocateFixed, MapPin, Phone, Search } from 'lucide-react'
import { fetchNearbyPlaces, NearbyError } from '../services/nearbyPlaces'
import type { NearbyCategory, NearbyCenter, NearbyKind, NearbyResult } from '../services/nearbyPlaces'

interface NearbyPlacesProps {
  kind: NearbyKind
  lang?: string
  center: NearbyCenter
  cityName: string
}

const categoryLabels: Record<NearbyCategory, [string, string]> = {
  bureau_de_change: ['Döviz bürosu', 'Exchange bureau'], pharmacy: ['Eczane', 'Pharmacy'],
  hospital: ['Hastane', 'Hospital'], police: ['Polis', 'Police'], atm: ['ATM', 'ATM'],
  taxi: ['Taksi durağı', 'Taxi rank'], restaurant: ['Restoran', 'Restaurant'], cafe: ['Kafe', 'Café'],
}

export default function NearbyPlaces({ kind, lang = 'en', center, cityName }: NearbyPlacesProps) {
  const locale = lang.toLowerCase()
  const tr = locale.startsWith('tr')
  const translated: Record<string, Record<string, string>> = {
    de: { 'Nearby exchange bureaux': 'Wechselstuben in der Nähe', 'Nearby places': 'Orte in der Nähe', 'Use my location': 'Meinen Standort verwenden', centre: 'Zentrum', 'Published places within 2.5 km; distances are straight-line estimates.': 'Veröffentlichte Orte im Umkreis von 2,5 km; Entfernungen sind Luftlinie.', 'Use your location or search around the city centre.': 'Standort verwenden oder im Stadtzentrum suchen.' },
    fr: { 'Nearby exchange bureaux': 'Bureaux de change à proximité', 'Nearby places': 'Lieux à proximité', 'Use my location': 'Utiliser ma position', centre: 'centre', 'Published places within 2.5 km; distances are straight-line estimates.': 'Lieux publiés dans un rayon de 2,5 km ; distances à vol d’oiseau.', 'Use your location or search around the city centre.': 'Utilisez votre position ou recherchez dans le centre.' },
    ar: { 'Nearby exchange bureaux': 'مكاتب الصرافة القريبة', 'Nearby places': 'أماكن قريبة', 'Use my location': 'استخدم موقعي', centre: 'المركز', 'Published places within 2.5 km; distances are straight-line estimates.': 'أماكن منشورة ضمن 2.5 كم؛ المسافات تقريبية.', 'Use your location or search around the city centre.': 'استخدم موقعك أو ابحث حول مركز المدينة.' },
    ru: { 'Nearby exchange bureaux': 'Обменные пункты рядом', 'Nearby places': 'Места рядом', 'Use my location': 'Использовать моё местоположение', centre: 'центр', 'Published places within 2.5 km; distances are straight-line estimates.': 'Опубликованные места в радиусе 2,5 км; расстояния по прямой.', 'Use your location or search around the city centre.': 'Используйте местоположение или ищите в центре города.' },
  }
  const text = (turkish: string, english: string) => tr ? turkish : translated[locale]?.[english] ?? english
  const categoryLabel = (category: NearbyCategory) => tr ? categoryLabels[category][0] : translated[locale]?.[categoryLabels[category][1]] ?? categoryLabels[category][1]
  const [result, setResult] = useState<NearbyResult | null>(null)
  const [state, setState] = useState<'idle' | 'locating' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState<'location' | 'city'>('city')
  const [filter, setFilter] = useState<'all' | NearbyCategory>('all')
  const [limit, setLimit] = useState(12)
  const controller = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const locationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    generation.current += 1
    controller.current?.abort()
    setResult(null)
    setState('idle')
    setError(null)
    setFilter('all')
    setLimit(12)
    return () => { generation.current += 1; controller.current?.abort(); if (locationTimer.current) clearTimeout(locationTimer.current) }
  }, [kind, center.lat, center.lng, cityName])

  const errorMessage = (reason: unknown) => {
    if (reason instanceof NearbyError && reason.code === 'busy') return text('Yer arama hizmeti yoğun. Lütfen 30 saniye sonra tekrar deneyin.', 'The place service is busy. Please try again in 30 seconds.')
    if (reason instanceof NearbyError && reason.code === 'timeout') return text('Arama hizmeti zamanında yanıt vermedi. Tekrar deneyebilirsiniz.', 'The place service did not respond in time. You can try again.')
    return text('Yer bilgileri şu anda alınamadı. Lütfen yeniden deneyin.', 'Place details could not be loaded. Please try again.')
  }

  const search = async (point: NearbyCenter, source: 'location' | 'city', requestId: number) => {
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setState('loading')
    setError(null)
    setResult(null)
    setOrigin(source)
    setLimit(12)
    try {
      const data = await fetchNearbyPlaces(point, kind, request.signal)
      if (requestId !== generation.current || request.signal.aborted) return
      setResult(data)
      setState('ready')
    } catch (reason) {
      if (requestId !== generation.current || request.signal.aborted) return
      setError(errorMessage(reason))
      setState('error')
    }
  }

  const searchCity = () => { void search(center, 'city', ++generation.current) }
  const searchLocation = () => {
    const requestId = ++generation.current
    controller.current?.abort()
    setError(null)
    setResult(null)
    if (!navigator.geolocation) {
      setState('error')
      setError(text('Bu tarayıcı konum paylaşamıyor. Şehir merkezinde arama yapabilirsiniz.', 'This browser cannot share your location. You can search the city centre.'))
      return
    }
    setState('locating')
    if (locationTimer.current) clearTimeout(locationTimer.current)
    locationTimer.current = setTimeout(() => {
      if (requestId !== generation.current) return
      generation.current += 1
      setState('error')
      setError(text('Konum bekleme süresi doldu. Şehir merkezinde arayabilir veya konum izninizi kontrol edip yeniden deneyebilirsiniz.', 'Location timed out. Search the city centre or check location permission and retry.'))
    }, 15000)
    navigator.geolocation.getCurrentPosition(
      position => {
        if (requestId !== generation.current) return
        if (locationTimer.current) clearTimeout(locationTimer.current)
        void search({ lat: position.coords.latitude, lng: position.coords.longitude }, 'location', requestId)
      },
      reason => {
        if (requestId !== generation.current) return
        if (locationTimer.current) clearTimeout(locationTimer.current)
        setState('error')
        setError(reason.code === 1
          ? text('Konum izni verilmedi. Aşağıdaki şehir merkezi aramasını kullanabilirsiniz.', 'Location permission was declined. You can use the city-centre search below.')
          : text('Konum alınamadı. Şehir merkezinde arayabilir veya tekrar deneyebilirsiniz.', 'Your location could not be found. Search the city centre or try again.'))
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 12000 },
    )
  }

  const busy = state === 'locating' || state === 'loading'
  const places = (result?.places ?? []).filter(place => filter === 'all' || place.category === filter)
  const formatDistance = (meters: number) => meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toLocaleString(tr ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 })} km`

  return (
    <section className="space-y-4" aria-label={kind === 'exchange' ? text('Yakındaki döviz büroları', 'Nearby exchange bureaux') : text('Yakınımdaki yerler', 'Nearby places')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{kind === 'exchange' ? text('Yakındaki döviz büroları', 'Nearby exchange bureaux') : text('Yakınımdaki yerler', 'Nearby places')}</h2>
          <p className="text-xs text-slate-600 mt-1">{text('2,5 km içindeki kayıtlar; mesafeler kuş uçuşudur.', 'Published places within 2.5 km; distances are straight-line estimates.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={searchLocation} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00A3E0] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0284C7] disabled:opacity-60 disabled:cursor-wait"><LocateFixed className="h-4 w-4" />{text('Konumumu kullan', 'Use my location')}</button>
          <button type="button" onClick={searchCity} disabled={state === 'loading'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sky-50 disabled:opacity-60"><Search className="h-4 w-4" />{cityName} {text('merkezinde ara', 'centre')}</button>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">{text('Konumunuzu seçerseniz arama için yaklaşık koordinatlarınız harita veri sağlayıcısına gönderilir; bu sitede kalıcı olarak saklanmaz.', 'If you use your location, approximate coordinates are sent to the map data service to run the search; this site does not permanently store them.')}</p>

      {kind === 'essential' && <div className="flex flex-wrap gap-2" aria-label={text('Yer türü', 'Place category')}>
        {(['all', 'pharmacy', 'hospital', 'police', 'atm', 'taxi', 'restaurant', 'cafe'] as const).map(category => <button type="button" key={category} aria-pressed={filter === category} onClick={() => { setFilter(category); setLimit(12) }} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === category ? 'border-[#00A3E0] bg-[#00A3E0] text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-sky-50'}`}>{category === 'all' ? text('Tümü', 'All') : categoryLabel(category)}</button>)}
      </div>}

      <div aria-live="polite" role="status" className="text-xs text-slate-600">
        {state === 'locating' && text('Konum izniniz bekleniyor…', 'Waiting for your location…')}
        {state === 'loading' && text('Yakındaki yerler aranıyor…', 'Searching nearby places…')}
        {error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">{error}</p>}
        {state === 'idle' && <p className="rounded-2xl border border-sky-100 bg-white p-5">{text('Konumunuzu kullanın veya şehir merkezinde arama yapın.', 'Use your location or search around the city centre.')}</p>}
        {state === 'ready' && <p>{origin === 'location' ? text('Konumunuzun çevresi', 'Around your location') : `${cityName} ${text('merkezinin çevresi', 'city centre')}`} · {places.length} {text('kayıt', 'places')}{result && ` · ${text('Alındı', 'Retrieved')} ${new Date(result.fetchedAt).toLocaleTimeString(tr ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}`}</p>}
      </div>

      {state === 'ready' && places.length === 0 && <div className="rounded-2xl border border-sky-100 bg-white p-5 text-sm text-slate-600">{text('Bu alanda ve kategoride kayıt bulunamadı. Bu, yakınlarda işletme olmadığı anlamına gelmez; harita kayıtları eksik olabilir.', 'No records were found in this area and category. This does not mean there are no places nearby; map coverage may be incomplete.')}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {places.slice(0, limit).map(place => <article key={place.id} className="min-w-0 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><span className="text-[10px] font-bold uppercase tracking-wide text-[#007EAD]">{categoryLabel(place.category)}</span><h3 className="mt-1 break-words text-sm font-bold text-slate-900">{place.name || categoryLabel(place.category)}</h3></div>
            <span className="shrink-0 rounded-lg bg-sky-50 px-2 py-1 text-xs font-bold text-[#007EAD]">{formatDistance(place.distanceMeters)}</span>
          </div>
          <dl className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-600">
            <div className="flex gap-2"><dt className="shrink-0"><MapPin className="mt-0.5 h-4 w-4" /><span className="sr-only">{text('Adres', 'Address')}</span></dt><dd className="break-words">{place.address || text('Kaynakta adres bulunmuyor.', 'Address not listed in the source.')}</dd></div>
            <div className="flex gap-2"><dt className="shrink-0"><Phone className="mt-0.5 h-4 w-4" /><span className="sr-only">{text('Telefon', 'Phone')}</span></dt><dd>{place.telephoneUrl ? <a href={place.telephoneUrl} className="font-semibold text-[#007EAD] underline underline-offset-2">{place.phone}</a> : text('Telefon bilgisi yok.', 'Phone not listed.')}</dd></div>
            <div className="flex gap-2"><dt className="shrink-0"><Clock3 className="mt-0.5 h-4 w-4" /><span className="sr-only">{text('Çalışma saatleri', 'Opening hours')}</span></dt><dd className="min-w-0 break-words"><span className="block font-medium text-slate-700">{text('Kaynaktaki çalışma saatleri', 'Published opening hours')}</span>{place.openingHours || text('Çalışma saatleri paylaşılmamış.', 'Opening hours not listed.')}</dd></div>
          </dl>
          <p className="mt-3 text-[11px] text-slate-500">{text('Kaynaklı kullanıcı puanı mevcut değil.', 'No sourced visitor rating available.')}</p>
          {kind === 'exchange' && <p className="mt-2 text-[11px] text-slate-600">{text('Büronun alış/satış fiyatı paylaşılmamış. Net fiyat ve komisyonu telefonla sorun.', 'This bureau has not supplied buy/sell rates. Call to confirm the final rate and commission.')}</p>}
          <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs font-semibold text-[#007EAD]">
            <a href={place.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">{text('Harita kaydı ve kaynak', 'Map record & source')}<ExternalLink className="h-3 w-3" /></a>
            {place.website && <a href={place.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">{text('Web sitesi', 'Website')}<ExternalLink className="h-3 w-3" /></a>}
          </div>
        </article>)}
      </div>
      {places.length > limit && <button type="button" onClick={() => setLimit(value => value + 12)} className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs font-bold text-[#007EAD]">{text('Daha fazla göster', 'Show more')}</button>}
      {result && <p className="text-[11px] leading-relaxed text-slate-500">{text('Saatler kaynakta yazıldığı şekildedir; anlık açık/kapalı durumu ve nöbetçi eczane bilgisi doğrulanmış değildir. Gitmeden önce arayın. Topluluk kayıtları eksik veya eski olabilir.', 'Hours are shown as published; current open/closed status and on-duty pharmacies are not verified. Call before visiting. Community records can be incomplete or outdated.')} {' '}<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap {text('katkıda bulunanlar', 'contributors')}</a> · <a href="https://overpass.private.coffee" target="_blank" rel="noopener noreferrer" className="underline">Overpass / Private.coffee</a></p>}
    </section>
  )
}
