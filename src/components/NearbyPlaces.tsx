import { useEffect, useRef, useState } from 'react'
import {locationErrorText} from '../lib/locationError'
import { Clock3, ExternalLink, LocateFixed, MapPin, Phone, Search } from 'lucide-react'
import { NearbyError } from '../services/nearbyPlaces'
import { fetchGoogleNearby } from '../services/googleNearby'
import GooglePlacePhoto from './GooglePlacePhoto'
import RestaurantRequest from './RestaurantRequest'
import TransitAddressInput, { type TransitPlace } from './TransitAddressInput'
import {trackBusinessEvent} from '../lib/businessEvents'
import {foundationEnabled} from '../lib/foundationConfig'
import { searchDestinations, directionsText } from '../lib/searchDestinations'
import type { NearbyCategory, NearbyCenter, NearbyKind, NearbyResult } from '../services/nearbyPlaces'

interface NearbyPlacesProps {
  kind: NearbyKind
  lang?: string
  center: NearbyCenter
  cityName: string
  fixedCategory?: NearbyCategory
  initialCategory?: NearbyCategory
}

const categoryLabels: Record<NearbyCategory, [string, string]> = {
  bureau_de_change: ['Döviz bürosu', 'Exchange bureau'], pharmacy: ['Eczane', 'Pharmacy'],
  hospital: ['Hastane', 'Hospital'], police: ['Polis', 'Police'], atm: ['ATM', 'ATM'],
  taxi: ['Taksi durağı', 'Taxi rank'], restaurant: ['Restoran', 'Restaurant'], cafe: ['Kafe', 'Café'],
  hotel: ['Otel', 'Hotel'], attraction: ['Gezilecek yer', 'Attraction'], museum: ['Müze', 'Museum'], shopping: ['Alışveriş', 'Shopping'],
  activity: ['Gezilecek yerler ve etkinlikler', 'Things to do'], park: ['Park', 'Park'], historical: ['Tarihi yer', 'Historical place'], entertainment: ['Eğlence', 'Entertainment'], cinema: ['Sinema', 'Cinema'],
}

export default function NearbyPlaces({ kind, lang = 'en', center: initialCenter, cityName: initialCityName, fixedCategory, initialCategory }: NearbyPlacesProps) {
  const eventRoot=useRef<HTMLElement>(null)
  const seenEvents=useRef(new Set<string>())
  const eventContext=kind==='exchange'?'exchange':fixedCategory==='restaurant'?'restaurants':fixedCategory==='hotel'?'hotels':fixedCategory==='activity'?'activities':'nearby'
  const businessKey=(id:string)=>id.startsWith('google:')?`google/${id.slice(7)}`:undefined
  const cities: Record<string, NearbyCenter> = searchDestinations;
  const [selectedCity, setSelectedCity] = useState(initialCityName.startsWith('Cappadocia') ? 'Cappadocia' : initialCityName);
  const [address, setAddress] = useState('')
  const [addressPlace, setAddressPlace] = useState<TransitPlace | null>(null)
  const cityName = addressPlace?.label ?? selectedCity;
  const center = addressPlace ?? cities[selectedCity] ?? initialCenter;
  const locale = lang.toLowerCase()
  const tr = locale.startsWith('tr')
  const addressText = ({en:['Address or area','Enter an area and city; select a suggestion','Search'],tr:['Adres veya bölge','Bölge ve şehir yazın; önerilerden seçin','Ara'],de:['Adresse oder Gebiet','Gebiet und Stadt eingeben; Vorschlag auswählen','Suchen'],fr:['Adresse ou quartier','Saisissez le quartier et la ville ; choisissez une suggestion','Rechercher'],ar:['العنوان أو المنطقة','أدخل المنطقة والمدينة واختر اقتراحًا','بحث'],ru:['Адрес или район','Введите район и город; выберите подсказку','Поиск'],zh:['地址或区域','输入区域和城市，然后选择建议','搜索']} as Record<string,string[]>)[locale] ?? ['Address or area','Enter an area and city; select a suggestion','Search']
  const translated: Record<string, Record<string, string>> = {
    de: { 'Nearby exchange bureaux': 'Wechselstuben in der Nähe', 'Nearby places': 'Orte in der Nähe', 'Use my location': 'Meinen Standort verwenden', centre: 'Zentrum durchsuchen', 'Published places within 2.5 km; distances are straight-line estimates.': 'Veröffentlichte Orte im Umkreis von 2,5 km; Entfernungen sind Luftlinie.', 'Use your location or search around the city centre.': 'Standort verwenden oder im Stadtzentrum suchen.', All: 'Alle', Pharmacy: 'Apotheke', Hospital: 'Krankenhaus', Police: 'Polizei', 'Taxi rank': 'Taxistand', Address: 'Adresse', Phone: 'Telefon', 'Opening hours': 'Öffnungszeiten', 'Website': 'Webseite', 'Show more': 'Mehr anzeigen', 'Searching nearby places…': 'Orte in der Nähe werden gesucht…', 'Waiting for your location…': 'Standort wird ermittelt…', places: 'Orte', Retrieved: 'Abgerufen' },
    fr: { 'Nearby exchange bureaux': 'Bureaux de change à proximité', 'Nearby places': 'Lieux à proximité', 'Use my location': 'Utiliser ma position', centre: 'rechercher au centre', 'Published places within 2.5 km; distances are straight-line estimates.': 'Lieux publiés dans un rayon de 2,5 km ; distances à vol d’oiseau.', 'Use your location or search around the city centre.': 'Utilisez votre position ou recherchez dans le centre.', All: 'Tous', Pharmacy: 'Pharmacie', Hospital: 'Hôpital', Police: 'Police', 'Taxi rank': 'Station de taxi', Address: 'Adresse', Phone: 'Téléphone', 'Opening hours': 'Horaires', Website: 'Site web', 'Show more': 'Afficher plus', 'Searching nearby places…': 'Recherche des lieux proches…', 'Waiting for your location…': 'Localisation en cours…', places: 'lieux', Retrieved: 'Relevé' },
    ar: { 'Nearby exchange bureaux': 'مكاتب الصرافة القريبة', 'Nearby places': 'أماكن قريبة', 'Use my location': 'استخدم موقعي', centre: 'ابحث في المركز', 'Published places within 2.5 km; distances are straight-line estimates.': 'أماكن منشورة ضمن 2.5 كم؛ المسافات تقريبية.', 'Use your location or search around the city centre.': 'استخدم موقعك أو ابحث حول مركز المدينة.', All: 'الكل', Pharmacy: 'صيدلية', Hospital: 'مستشفى', Police: 'شرطة', 'Taxi rank': 'موقف تاكسي', Address: 'العنوان', Phone: 'الهاتف', 'Opening hours': 'ساعات العمل', Website: 'الموقع', 'Show more': 'عرض المزيد', 'Searching nearby places…': 'جارٍ البحث عن أماكن قريبة…', 'Waiting for your location…': 'جارٍ تحديد موقعك…', places: 'أماكن', Retrieved: 'وقت الاستعلام' },
    ru: { 'Nearby exchange bureaux': 'Обменные пункты рядом', 'Nearby places': 'Места рядом', 'Use my location': 'Использовать моё местоположение', centre: 'искать в центре', 'Published places within 2.5 km; distances are straight-line estimates.': 'Опубликованные места в радиусе 2,5 км; расстояния по прямой.', 'Use your location or search around the city centre.': 'Используйте местоположение или ищите в центре города.', All: 'Все', Pharmacy: 'Аптека', Hospital: 'Больница', Police: 'Полиция', 'Taxi rank': 'Стоянка такси', Address: 'Адрес', Phone: 'Телефон', 'Opening hours': 'Часы работы', Website: 'Сайт', 'Show more': 'Показать ещё', 'Searching nearby places…': 'Поиск мест рядом…', 'Waiting for your location…': 'Определяем местоположение…', places: 'мест', Retrieved: 'Получено' },
    zh: { 'Nearby exchange bureaux': '附近兑换点', 'Nearby places': '附近地点', 'Use my location': '使用当前位置', centre: '搜索市中心', 'Published places within 2.5 km; distances are straight-line estimates.': '显示2.5公里内的公开地点；距离为直线估算。', 'Use your location or search around the city centre.': '使用当前位置或搜索市中心附近。', All: '全部', Pharmacy: '药房', Hospital: '医院', Police: '警察', ATM: 'ATM', 'Taxi rank': '出租车站', Restaurant: '餐厅', Café: '咖啡馆', 'Exchange bureau': '兑换点', Address: '地址', Phone: '电话', 'Opening hours': '营业时间', Website: '网站', 'Show more': '显示更多', 'Searching nearby places…': '正在搜索附近地点…', 'Waiting for your location…': '正在等待位置信息…', places: '个地点', Retrieved: '获取时间', 'Address not listed in the source.': '来源未提供地址。', 'Phone not listed.': '来源未提供电话。', 'Opening hours not listed.': '来源未提供营业时间。', 'Published opening hours': '来源公布的营业时间', 'No sourced visitor rating available.': '暂无有来源的用户评分。', 'Map record & source': '地图记录与来源' },
  }
  const text = (turkish: string, english: string) => tr ? turkish : translated[locale]?.[english] ?? english
  const categoryLabel = (category: NearbyCategory) => tr ? categoryLabels[category][0] : translated[locale]?.[categoryLabels[category][1]] ?? categoryLabels[category][1]
  const [result, setResult] = useState<NearbyResult | null>(null)
  const [state, setState] = useState<'idle' | 'locating' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState<'location' | 'city'>('city')
  const [filter, setFilter] = useState<'all' | NearbyCategory>(initialCategory ?? fixedCategory ?? 'all')
  const [limit, setLimit] = useState(6)
  const [detailId, setDetailId] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const locationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    generation.current += 1
    controller.current?.abort()
    setDetailId(null)
    setResult(null)
    setState('idle')
    setError(null)
    setLimit(6)
    return () => { generation.current += 1; controller.current?.abort(); if (locationTimer.current) clearTimeout(locationTimer.current) }
  }, [kind, center.lat, center.lng, cityName, fixedCategory, locale])

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
    setLimit(6)
    try {
      const data = await fetchGoogleNearby(point, kind === 'exchange' ? 'bureau_de_change' : filter, locale, request.signal, fixedCategory && source === 'city' && !addressPlace ? 'city' : 'nearby')
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
  // Directory pages load on entry and when their visible city/category changes.
  // Near Me and exchange retain explicit consent-driven location searches.
  useEffect(() => {
    if (!fixedCategory && !addressPlace) return
    if (address.trim() && address !== addressPlace?.label) return
    const timer = setTimeout(searchCity, 350)
    return () => clearTimeout(timer)
    // searchCity is deliberately captured only for the inputs that change a request.
  }, [fixedCategory, center.lat, center.lng, cityName, filter, locale, addressPlace, address])
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
        setError(locationErrorText(reason.code,locale))
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 12000 },
    )
  }

  const busy = state === 'locating' || state === 'loading'
  const places = (result?.places ?? []).filter(place => filter === 'all' || place.category === filter)
  useEffect(()=>{
    if(!foundationEnabled||!eventRoot.current||!('IntersectionObserver' in window))return
    const observer=new IntersectionObserver(items=>{for(const item of items){const key=(item.target as HTMLElement).dataset.businessKey;if(item.isIntersecting&&key&&!seenEvents.current.has(key)){seenEvents.current.add(key);trackBusinessEvent(key,'impression',eventContext)}}},{threshold:0.5})
    eventRoot.current.querySelectorAll('[data-business-key]').forEach(node=>observer.observe(node))
    return()=>observer.disconnect()
  },[result,limit,detailId,eventContext])
  const openPlace=(id:string)=>{setDetailId(id);const key=businessKey(id);if(key&&id!==detailId)trackBusinessEvent(key,'detail_open',eventContext)}
  const formatDistance = (meters: number) => meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toLocaleString(tr ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 })} km`

  return (
    <section ref={eventRoot} onClickCapture={event=>{const link=(event.target as HTMLElement).closest('a');const key=link?.closest('[data-business-key]')?.getAttribute('data-business-key');if(!link||!key)return;const href=link.getAttribute('href')??'';const type=href.startsWith('tel:')?'phone_click':href.includes('/maps/dir/')?'directions_click':link.dataset.event==='website'?'website_click':null;if(type)trackBusinessEvent(key,type,eventContext)}} className="space-y-4" aria-label={kind === 'exchange' ? text('Yakındaki döviz büroları', 'Nearby exchange bureaux') : text('Yakınımdaki yerler', 'Nearby places')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{fixedCategory ? `${categoryLabel(fixedCategory)} · Google Maps` : kind === 'exchange' ? text('Yakındaki döviz büroları', 'Nearby exchange bureaux') : text('Yakınımdaki yerler', 'Nearby places')}</h2>
          <p className="text-xs text-slate-600 mt-1">{fixedCategory ? text('Şehir ve çevresinden öne çıkan sonuçlar (30 km); tüm işletmelerin listesi değildir. Konum araması 2,5 km içindedir.', 'Selected results across the city area (30 km), not an exhaustive directory. Location searches cover 2.5 km.') : text('2,5 km içindeki kayıtlar; mesafeler kuş uçuşudur.', 'Published places within 2.5 km; distances are straight-line estimates.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label={text('Aranacak şehir', 'Search city')} value={selectedCity} onChange={event => {setAddress('');setAddressPlace(null);setSelectedCity(event.target.value)}} className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs">{Object.keys(cities).map(city => <option key={city}>{city}</option>)}</select>
          <button type="button" onClick={searchLocation} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00A3E0] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0284C7] disabled:opacity-60 disabled:cursor-wait"><LocateFixed className="h-4 w-4" />{text('Konumumu kullan', 'Use my location')}</button>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <TransitAddressInput label={addressText[0]} placeholder={addressText[1]} value={address} selected={!!addressPlace && address === addressPlace.label} locale={locale} onChange={value=>{setAddress(value);generation.current+=1;controller.current?.abort();setResult(null);setState('idle')}} onSelect={place=>{setAddress(place.label);setAddressPlace(place)}} />
        <button type="button" disabled={busy || (!!address.trim() && address !== addressPlace?.label)} onClick={searchCity} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087FFF] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Search className="h-4 w-4" />{addressText[2]}</button>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">{text('Konumunuzu seçerseniz arama için yaklaşık koordinatlarınız harita veri sağlayıcısına gönderilir; bu sitede kalıcı olarak saklanmaz.', 'If you use your location, approximate coordinates are sent to the map data service to run the search; this site does not permanently store them.')}</p>

      {fixedCategory === 'activity' && <div className="flex flex-wrap gap-2" aria-label={text('Aktivite kategorisi', 'Activity category')}>
        {(['activity', 'museum', 'historical', 'cinema', 'entertainment', 'park'] as const).map(category => <button type="button" key={category} aria-pressed={filter === category} onClick={() => { generation.current += 1; controller.current?.abort(); setFilter(category); setResult(null); setError(null) }} className={`min-h-11 rounded-full border px-4 py-2 text-xs font-semibold ${filter === category ? 'border-[#087FFF] bg-[#087FFF] text-white' : 'border-sky-100 bg-white text-slate-700'}`}>{categoryLabel(category)}</button>)}
      </div>}
      {kind === 'essential' && !fixedCategory && <div className="flex flex-wrap gap-2" aria-label={text('Yer türü', 'Place category')}>
        {(['all', 'restaurant', 'hotel', 'cafe', 'attraction', 'museum', 'pharmacy', 'hospital', 'atm', 'bureau_de_change', 'shopping', 'police', 'taxi'] as const).map(category => <button type="button" key={category} aria-pressed={filter === category} onClick={() => { generation.current += 1; controller.current?.abort(); setFilter(category); setResult(null); setState('idle'); setError(null); setLimit(12) }} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === category ? 'border-[#00A3E0] bg-[#00A3E0] text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-sky-50'}`}>{category === 'all' ? text('Tümü', 'All') : categoryLabel(category)}</button>)}
      </div>}

      <div aria-live="polite" role="status" className="text-xs text-slate-600">
        {state === 'locating' && text('Konum izniniz bekleniyor…', 'Waiting for your location…')}
        {state === 'loading' && text('Yakındaki yerler aranıyor…', 'Searching nearby places…')}
        {error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">{error}</p>}
        {state === 'idle' && <p className="rounded-2xl border border-sky-100 bg-white p-5">{text('Konumunuzu kullanın veya şehir merkezinde arama yapın.', 'Use your location or search around the city centre.')}</p>}
        {state === 'ready' && <p>{origin === 'location' ? text('Konumunuzun çevresi', 'Around your location') : addressPlace ? addressPlace.label : `${cityName} ${fixedCategory ? text('ve çevresi', 'area') : text('merkezinin çevresi', 'city centre')}`} · {places.length} {text('kayıt', 'places')}{result && ` · ${text('Alındı', 'Retrieved')} ${new Date(result.fetchedAt).toLocaleTimeString(tr ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}`}</p>}
      </div>

      {state === 'ready' && places.length === 0 && <div className="rounded-2xl border border-sky-100 bg-white p-5 text-sm text-slate-600">{text('Bu alanda ve kategoride kayıt bulunamadı. Bu, yakınlarda işletme olmadığı anlamına gelmez; harita kayıtları eksik olabilir.', 'No records were found in this area and category. This does not mean there are no places nearby; map coverage may be incomplete.')}</div>}
      {detailId && <button type="button" className="min-h-11 text-blue-700 font-semibold" onClick={() => setDetailId(null)}>{text('← Listeye dön', '← Back to results')}</button>}
      <div className={detailId ? 'space-y-4' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
        {places.slice(0, limit).map(place => <article data-business-key={businessKey(place.id)} key={place.id} hidden={!!detailId && detailId !== place.id} className="min-w-0 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <GooglePlacePhoto key={place.photo?.url ?? place.id} place={place} onOpen={() => openPlace(place.id)} />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><span className="text-[10px] font-bold uppercase tracking-wide text-[#007EAD]">{place.typeLabel ?? categoryLabel(place.category)}</span><h3 className="mt-1 break-words font-bold text-slate-900"><button className="text-left min-h-11 hover:text-blue-700" onClick={() => openPlace(place.id)}>{place.name || categoryLabel(place.category)}</button></h3></div>
            <span className="shrink-0 rounded-lg bg-sky-50 px-2 py-1 text-xs font-bold text-[#007EAD]">{formatDistance(place.distanceMeters)}</span>
          </div>
          <dl className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-600">
            {place.address && <div className="flex gap-2"><dt className="shrink-0"><MapPin className="mt-0.5 h-4 w-4" /><span className="sr-only">{text('Adres', 'Address')}</span></dt><dd className="break-words">{place.address}</dd></div>}
            {place.telephoneUrl && <div className="flex gap-2"><dt className="shrink-0"><Phone className="mt-0.5 h-4 w-4" /><span className="sr-only">{text('Telefon', 'Phone')}</span></dt><dd><a href={place.telephoneUrl} className="font-semibold text-[#007EAD] underline underline-offset-2">{place.phone}</a></dd></div>}
            {place.openingHours && <div className="flex gap-2"><dt className="shrink-0"><Clock3 className="mt-0.5 h-4 w-4" /><span className="sr-only">{text('Çalışma saatleri', 'Opening hours')}</span></dt><dd className="min-w-0 break-words"><details><summary className="cursor-pointer">{text('Çalışma saatleri', 'Opening hours')}</summary>{place.openingHours}</details></dd></div>}
          </dl>
          {typeof place.openNow === 'boolean' && <p className="mt-2 text-xs">{place.openNow ? text('Şu an açık', 'Open now') : text('Şu an kapalı', 'Closed now')}</p>}
          {place.rating !== undefined && <p className="mt-2 text-xs">Google Maps · ★ {place.rating}{place.reviewCount !== undefined ? ` (${place.reviewCount})` : ''}</p>}
          {place.attributions?.map((a, i) => <p key={i} className="text-xs">{a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.name}</a> : a.name}</p>)}
          <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs font-semibold text-[#007EAD]">
            <a href={place.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">{text('Harita kaydı ve kaynak', 'Map record & source')}<ExternalLink className="h-3 w-3" /></a>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1">{directionsText[locale] ?? directionsText.en}<ExternalLink aria-hidden="true" className="h-3 w-3" /></a>
            {place.website && <a data-event="website" href={place.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">{text('Web sitesi', 'Website')}<ExternalLink className="h-3 w-3" /></a>}
          </div>
          {detailId === place.id && place.category === 'restaurant' && <RestaurantRequest businessKey={businessKey(place.id)} name={place.name ?? ''} source={place.sourceUrl} lang={locale} />}
        </article>)}
      </div>
      {state==='ready' && kind==='exchange' && <p className="text-xs text-slate-500">{text('Büro alış/satış kurları mevcut değil; işlemden önce net kur ve komisyonu işletmeden teyit edin.', 'Bureau buy/sell rates are not available; confirm the net rate and commission with the business before exchanging.')}</p>}
      {places.length > limit && <button type="button" onClick={() => setLimit(value => value + 12)} className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs font-bold text-[#007EAD]">{text('Daha fazla göster', 'Show more')}</button>}
      {result && <div className="text-xs text-slate-600"><p className="text-sm font-medium" translate="no">Google Maps</p><p>{text('Bilgiler değişebilir; gitmeden önce işletmeyi arayın. Nöbetçi eczane bilgisi değildir.', 'Information may change; call before visiting. This is not an on-duty pharmacy service.')}</p><a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a> · <a className="underline" href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener noreferrer">Google Maps Terms</a></div>}
    </section>
  )
}
