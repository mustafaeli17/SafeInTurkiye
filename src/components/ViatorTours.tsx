import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { ArrowRight, CalendarDays, Castle, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Coins, Compass, ExternalLink, Grid2X2, Landmark, MapPin, Mountain, Sailboat, Search, SlidersHorizontal, Star, Trees, Utensils, Building2, Ticket } from 'lucide-react'
import { SearchGuide } from './SearchGuide'
import CityHighlightPhoto from './CityHighlightPhoto'
import TourJourneyMotion from './TourJourneyMotion'
import CategoryRail from './CategoryRail'
import {TourDayPlan} from './FirstVisitPlan/SaveToDayPlan'
import { tourSearchCopy } from '../services/tourSearch'
import { publicCities } from '../lib/publicRoutes'
import { cityDisplayName } from '../lib/cityLocale'
import { trackProduct } from '../lib/productMetrics'
import { discoverySwitchHref } from '../lib/discoveryNavigation'
import { toursLabel, tourFilterCopy, tourFilterActions } from '../lib/viatorCopy'
import { formatTourDuration, tourCategoryTerm, tourDirectoryCopy } from '../lib/tourDirectory'
import './ViatorTours.css'
const copy: Record<string, string[]> = {
  en: ['Tours & experiences · Viator','Destination','Find tours','Searching…','No tours found for this destination.','Tours are temporarily unavailable. Please try again later.','From','View on Viator','We may earn a commission from qualifying bookings. Final price and availability are confirmed on Viator.','Sandbox preview — test results, not live availability.','Next','Previous','Product information is provided in English for this language.'],
  tr: ['Turlar ve deneyimler · Viator','Destinasyon','Turları bul','Aranıyor…','Bu destinasyonda tur bulunamadı.','Turlara şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.','Başlangıç fiyatı','Viator’da incele','Uygun rezervasyonlardan komisyon kazanabiliriz. Son fiyat ve müsaitlik Viator’da doğrulanır.','Test önizlemesi — sonuçlar canlı müsaitlik bilgisi değildir.','Sonraki','Önceki','Bu dil için ürün bilgileri İngilizce sunulmaktadır.'],
  es: ['Excursiones y experiencias · Viator','Destino','Buscar excursiones','Buscando…','No se encontraron excursiones en este destino.','Las excursiones no están disponibles temporalmente. Inténtalo más tarde.','Desde','Ver en Viator','Podemos recibir una comisión por las reservas que cumplan los requisitos. El precio final y la disponibilidad se confirman en Viator.','Vista previa de prueba: no muestra disponibilidad real.','Siguiente','Anterior','La información del producto se ofrece en inglés para este idioma.'],
  de: ['Touren und Erlebnisse · Viator','Reiseziel','Touren suchen','Suche läuft…','Keine Touren für dieses Reiseziel gefunden.','Touren sind vorübergehend nicht verfügbar. Bitte später erneut versuchen.','Ab','Bei Viator ansehen','Bei berechtigten Buchungen erhalten wir möglicherweise eine Provision. Endpreis und Verfügbarkeit werden bei Viator bestätigt.','Testvorschau — keine aktuelle Verfügbarkeit.','Weiter','Zurück','Produktinformationen werden für diese Sprache auf Englisch angezeigt.'],
  fr: ['Excursions et expériences · Viator','Destination','Rechercher','Recherche…','Aucune excursion trouvée pour cette destination.','Les excursions sont temporairement indisponibles. Réessayez plus tard.','À partir de','Voir sur Viator','Nous pouvons percevoir une commission sur les réservations éligibles. Le prix final et la disponibilité sont confirmés sur Viator.','Aperçu de test — pas de disponibilité réelle.','Suivant','Précédent','Les informations sur les produits sont fournies en anglais pour cette langue.'],
  ar: ['الجولات والتجارب · Viator','الوجهة','ابحث عن الجولات','جارٍ البحث…','لم يتم العثور على جولات لهذه الوجهة.','الجولات غير متاحة مؤقتًا. يرجى المحاولة لاحقًا.','ابتداءً من','عرض على Viator','قد نحصل على عمولة مقابل الحجوزات المؤهلة. يتم تأكيد السعر النهائي والتوافر على Viator.','معاينة تجريبية — ليست معلومات توافر فعلية.','التالي','السابق','تُعرض معلومات المنتجات باللغة الإنجليزية لهذه اللغة.'],
  ru: ['Экскурсии и впечатления · Viator','Направление','Найти экскурсии','Поиск…','Экскурсий для этого направления не найдено.','Экскурсии временно недоступны. Попробуйте позже.','От','Посмотреть на Viator','Мы можем получить комиссию за подходящие бронирования. Итоговая цена и наличие подтверждаются на Viator.','Тестовый просмотр — не фактическое наличие.','Далее','Назад','Информация о продуктах для этого языка предоставляется на английском.'],
  zh: ['旅游与体验 · Viator','目的地','搜索行程','搜索中…','未找到该目的地的行程。','行程暂时无法加载，请稍后重试。','起价','在 Viator 查看','符合条件的预订可能为我们带来佣金。最终价格和可订情况以 Viator 为准。','测试预览——不代表实际可订情况。','下一页','上一页','此语言的产品信息以英语提供。'],
}
type TourProduct = {
  code: string
  title: string
  description?: string
  productUrl: string
  photo?: string
  fromPrice?: number
  currency?: string
  rating?: number
  reviewCount?: number
  durationMinutes?: { from: number; to: number }
  freeCancellation?: boolean
}
type Result = { products: TourProduct[]; totalCount: number; sandbox: boolean; language: string; destination?: string }
const emptyFilters = { minPrice: '', maxPrice: '', duration: 'any', rating: 'any', date: '', sort: 'recommended', currency: 'EUR', private: false, freeCancellation: false, skipLine: false }
type TourSearch = { city: string; term: string; query: string; filters: typeof emptyFilters }
type Props = { lang: string; placesLabel: string; initialCity?: string; initialQuery?: string; hasCity?: boolean }

const categoryIcons = [Grid2X2, Building2, Sailboat, Landmark, Castle, Trees, Mountain, Utensils, Ticket]
const featured = [{ city: 'istanbul', image: 0 }, { city: 'antalya', image: 2 }, { city: 'cappadocia', image: 1 }]
function cityName(slug: string, lang: string) {
  return cityDisplayName(publicCities.find(place => place.slug === slug)?.name ?? slug, lang)
}
const localDestinations: Record<string, string> = { mugla: 'Bodrum', aydin: 'Kuşadası', denizli: 'Pamukkale' }

export default function ViatorTours({ lang, placesLabel, initialCity = 'istanbul', initialQuery = '', hasCity = false }: Props) {
  const t = copy[lang] ?? copy.en
  const f = tourFilterCopy(lang)
  const actions = tourFilterActions[lang] ?? tourFilterActions.en
  const s = tourSearchCopy[lang] ?? tourSearchCopy.en
  const labels = tourDirectoryCopy(lang)
  const number = new Intl.NumberFormat(lang)
  const [term, setTerm] = useState(initialQuery)
  const [category, setCategory] = useState<number | null>(null)
  const [city, setCity] = useState(initialCity)
  const [result, setResult] = useState<Result | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [start, setStart] = useState(1)
  const [filters, setFilters] = useState(emptyFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [applied, setApplied] = useState<TourSearch | null>(null)
  const controller = useRef<AbortController | null>(null)
  const filterPanel = useRef<HTMLElement>(null)
  const filterToggle = useRef<HTMLButtonElement>(null)
  const resultsHeading = useRef<HTMLHeadingElement>(null)
  const pending = applied && (applied.city !== city || applied.term !== term.trim() || Object.keys(filters).some(key => filters[key as keyof typeof filters] !== applied.filters[key as keyof typeof filters]))
  const activeFilters = Object.entries(filters).filter(([key, value]) => value !== emptyFilters[key as keyof typeof emptyFilters]).length
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const dateLimit = new Date(`${today}T12:00:00Z`)
  dateLimit.setUTCFullYear(dateLimit.getUTCFullYear() + 1)
  const update = <K extends keyof typeof emptyFilters>(key: K, value: typeof emptyFilters[K]) => setFilters(previous => ({ ...previous, [key]: value }))

  const search = useCallback(async (criteria: TourSearch, offset = 1, focusResults = false) => {
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current
    if (offset === 1) trackProduct('tours_search', lang)
    setState('loading')
    try {
      const query = new URLSearchParams({ city: criteria.city, lang, start: String(offset) })
      if (criteria.query) query.set('q', criteria.query)
      Object.entries(criteria.filters).forEach(([key, value]) => { if (value !== '' && value !== false) query.set(key, String(value)) })
      const response = await fetch(`/api/viator?${query}`, { signal: AbortSignal.any([current.signal, AbortSignal.timeout(20000)]), cache: 'no-store' })
      if (!response.ok) {
        const failure = await response.json().catch(() => null)
        const known = ['NOT_CONFIGURED', 'ACCESS_PENDING', 'BUSY', 'PROVIDER_UNAVAILABLE', 'TIMEOUT', 'INVALID_INPUT']
        console.warn(`Viator request unavailable: HTTP ${response.status}; ${known.includes(failure?.error) ? failure.error : 'UNKNOWN'}`)
        throw new Error('unavailable')
      }
      const data = await response.json() as Result
      if (!Array.isArray(data.products)) throw new Error('invalid')
      if (current.signal.aborted) return
      if (offset === 1) trackProduct(data.products.length ? 'tours_results' : 'tours_empty', lang)
      setResult(data)
      setApplied(criteria)
      setStart(offset)
      setState('ready')
      if (focusResults) requestAnimationFrame(() => {
        if (current.signal.aborted) return
        resultsHeading.current?.focus({ preventScroll: true })
        resultsHeading.current?.scrollIntoView({ block: 'start' })
      })
    } catch {
      if (current.signal.aborted) return
      if (offset === 1) trackProduct('tours_error', lang)
      setState('error')
    }
  }, [lang])

  useEffect(() => {
    if (hasCity || initialQuery.trim()) {
      const term = initialQuery.trim()
      const timer = setTimeout(() => void search({ city: initialCity, term, query: term, filters: emptyFilters }), 0)
      return () => { clearTimeout(timer); controller.current?.abort() }
    }
    return () => controller.current?.abort()
  }, [initialCity, initialQuery, hasCity, search])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const button = (event.nativeEvent as SubmitEvent).submitter
    const categoryClick = button instanceof HTMLButtonElement && button.name === 'category'
    const selectedCategory = categoryClick ? Number(button.value) : category
    const destination = button instanceof HTMLButtonElement && button.name === 'destination' ? button.value : city
    const nextTerm = selectedCategory === null ? term.trim() : selectedCategory === 0 ? '' : labels.categories[selectedCategory]
    const query = selectedCategory === null ? nextTerm : tourCategoryTerm(selectedCategory, lang)
    if (categoryClick && state === 'ready' && start === 1 && !pending && applied?.query === query && applied.term === nextTerm) return
    setCategory(selectedCategory)
    setTerm(nextTerm)
    setCity(destination)
    if (filtersOpen) {
      if (filterPanel.current?.contains(document.activeElement)) filterToggle.current?.focus()
      setFiltersOpen(false)
    }
    void search({ city: destination, term: nextTerm, query, filters })
  }

  const loading = state === 'loading'
  const showDestinations = !result && state === 'idle'
  const resultCity = applied && (localDestinations[applied.city] ?? cityName(applied.city, lang))
  const plannerCity = publicCities.find(destination => destination.slug === applied?.city)?.name
  const searchStatus = state === 'error' ? t[5] : loading ? t[3] : result?.products.length === 0 ? t[4] : ''
  const sortControl = <label className="vt-sort">{f[0]}<select value={filters.sort} onChange={e => update('sort', e.target.value)}>{['recommended', 'priceAsc', 'priceDesc', 'rating'].map((v, i) => <option key={v} value={v}>{f[i + 1]}</option>)}</select></label>
  return <section className="viator-directory" aria-labelledby="viator-heading" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <header className="vt-hero">
      <picture className="vt-hero-media">
        <source media="(max-width: 640px)" srcSet="/photos/directory/tours-768.webp" width="768" height="520"/>
        <img className="vt-hero-image" src="/photos/directory/tours.webp" width="1600" height="640" alt="" fetchPriority="high"/>
      </picture>
      <div className="vt-hero-copy">
        <span className="vt-hero-label"><Compass size={17} aria-hidden="true"/>{toursLabel(lang)}</span>
        <h1 id="viator-heading">{labels.title}</h1>
        <p>{labels.intro}</p>
      </div>
      <span className="vt-location" dir="auto"><MapPin size={14} aria-hidden="true"/>Düden · {cityName('antalya', lang)}</span>
      <TourJourneyMotion lang={lang}/>
    </header>
    <form className="vt-content" onSubmit={submit} onInvalidCapture={event => {
      const input = event.target as HTMLElement
      if (filterPanel.current?.contains(input)) {
        const section = input.closest('details')
        if (section) section.open = true
        flushSync(() => setFiltersOpen(true))
      }
    }}>
      <div className="vt-searchbar">
        <label className="vt-field vt-destination"><MapPin aria-hidden="true"/><span>{t[1]}</span>
          <select value={city} onChange={e => setCity(e.target.value)}>
            {publicCities.map(c => <option key={c.slug} value={c.slug}>{cityDisplayName(c.name, lang)}{localDestinations[c.slug] && ` · ${localDestinations[c.slug]}`}</option>)}
          </select>
        </label>
        <label className="vt-field vt-term"><Search aria-hidden="true"/><span>{s[0]}</span>
          <input type="search" maxLength={160} value={term} onChange={e => { setTerm(e.target.value); setCategory(null) }} placeholder={s[1]}/>
        </label>
        <label className="vt-field vt-date"><CalendarDays aria-hidden="true"/><span>{f[13]}</span>
          <input type="date" min={today} max={dateLimit.toISOString().slice(0, 10)} value={filters.date} onChange={e => update('date', e.target.value)}/>
        </label>
        <button type="submit" disabled={loading} className="vt-primary vt-search-button"><Search size={19} aria-hidden="true"/>{loading ? t[3] : pending ? actions[1] : t[2]}</button>
      </div>

      <CategoryRail className="vt-categories" lang={lang} label={labels.categoryLabel}>
        {labels.categories.map((label, index) => {
          const Icon = categoryIcons[index]
          return <button key={label} type="submit" name="category" value={index} disabled={loading} aria-pressed={index === (category ?? (term.trim() ? -1 : 0))}><Icon aria-hidden="true"/><span>{label}</span></button>
        })}
      </CategoryRail>

      <div className="vt-layout">
        <aside className="vt-filters" ref={filterPanel} data-open={filtersOpen} aria-label={actions[0]}>
          <h2 className="vt-sidebar-heading"><SlidersHorizontal size={20} aria-hidden="true"/>{actions[0]}</h2>
          <button className="vt-filter-toggle" ref={filterToggle} type="button" aria-expanded={filtersOpen} aria-controls="vt-filters-panel" onClick={() => setFiltersOpen(!filtersOpen)}>
            <SlidersHorizontal size={19} aria-hidden="true"/>{actions[0]}{activeFilters > 0 && <span>({number.format(activeFilters)})</span>}<ChevronDown size={17} aria-hidden="true"/>
          </button>
          <div className="vt-filter-body" id="vt-filters-panel">
            <details open className="vt-filter-group">
              <summary><Coins size={17} aria-hidden="true"/>{labels.price}<ChevronDown size={16} aria-hidden="true"/></summary>
              <div className="vt-price-inputs">
                <label>{f[5]}<input type="number" min="0" max={filters.maxPrice || 100000} step="0.01" value={filters.minPrice} onChange={e => update('minPrice', e.target.value)}/></label>
                <label>{f[6]}<input type="number" min={Number(filters.minPrice) || 0.01} max="100000" step="0.01" value={filters.maxPrice} onChange={e => update('maxPrice', e.target.value)}/></label>
              </div>
              <label className="vt-currency">{f[17]}<select value={filters.currency} onChange={e => update('currency', e.target.value)}>{['EUR', 'USD', 'GBP', 'TRY', 'AED', 'CNY'].map(code => <option key={code}>{code}</option>)}</select></label>
            </details>
            <details className="vt-filter-group"><summary><Clock3 size={17} aria-hidden="true"/>{f[7]}<ChevronDown size={16} aria-hidden="true"/></summary>
              <select aria-label={f[7]} value={filters.duration} onChange={e => update('duration', e.target.value)}>{['any', 'short', 'day', 'multi'].map((v, i) => <option key={v} value={v}>{f[8 + i]}</option>)}</select>
            </details>
            <details className="vt-filter-group"><summary><Star size={17} aria-hidden="true"/>{f[12]}<ChevronDown size={16} aria-hidden="true"/></summary>
              <select aria-label={f[12]} value={filters.rating} onChange={e => update('rating', e.target.value)}><option value="any">{f[8]}</option><option value="3">{number.format(3)}+ / {number.format(5)}</option><option value="4">{number.format(4)}+ / {number.format(5)}</option></select>
            </details>
            <div className="vt-switches">{(['private', 'freeCancellation', 'skipLine'] as const).map((key, i) =>
              <label key={key}><span>{f[14 + i]}</span><input type="checkbox" checked={filters[key]} onChange={e => update(key, e.target.checked)}/></label>
            )}</div>
            {!result && sortControl}
            <button type="submit" disabled={loading} className="vt-primary vt-apply">{actions[1]}</button>
            <button type="button" onClick={() => setFilters(emptyFilters)} className="vt-reset">{f[18]}</button>
          </div>
        </aside>

        <div className="vt-results">
          <div className="vt-results-header">
            <div>
              <h2 ref={resultsHeading} tabIndex={-1}>{showDestinations ? labels.byDestination : toursLabel(lang)}</h2>
              {result && applied && <p className="vt-result-summary">{resultCity}{applied.term && ` · ${applied.term}`}{result.products.length > 0 && ` · ${f[19]} ${number.format(start)}–${number.format(start + result.products.length - 1)} / ${number.format(result.totalCount)}`}</p>}
            </div>
            {result && <div className="vt-results-sort">{sortControl}{applied && filters.sort !== applied.filters.sort && <button type="submit" className="vt-sort-apply" disabled={loading}>{actions[1]}</button>}</div>}
          </div>
          <div role="status" className="vt-result-status">{searchStatus || (result && result.products.length > 0 ? <span className="sr-only">{f[19]} {number.format(result.totalCount)}</span> : null)}</div>
          {result?.sandbox && <p className="vt-sandbox">{t[9]}</p>}
          {result?.language === 'en' && lang !== 'en' && <p className="vt-language">{t[12]}</p>}
          {showDestinations && <div className="vt-grid">{featured.map(({ city: destination, image }, i) => <article className="vt-card vt-city-card" key={destination}>
            <CityHighlightPhoto city={destination} index={image} name={labels.landmarks[i]} lang={lang}/>
            <button type="submit" name="destination" value={destination}>
              <span><strong>{cityName(destination, lang)}</strong><small>{labels.landmarks[i]}</small></span><ArrowRight size={20} aria-hidden="true"/>
            </button>
          </article>)}</div>}
          {!!result?.products.length && <div className="vt-grid">{result.products.map(p => <article key={p.code} className="vt-card">
            {p.photo && <div className="vt-photo" key={p.photo}><img src={p.photo} alt="" width={720} height={480} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={e => { e.currentTarget.parentElement!.hidden = true }}/>
              {result.destination && <span><MapPin size={14} aria-hidden="true"/>{resultCity ?? result.destination}</span>}
            </div>}
            <div className="vt-card-body">
              <h3 dir="auto" lang={result.language}>{p.title}</h3>
              <div className="vt-card-meta">
                {p.rating !== undefined && <span aria-label={`${f[4]} ${number.format(p.rating)} / ${number.format(5)}${p.reviewCount !== undefined ? ` (${number.format(p.reviewCount)})` : ''}`}><Star className="vt-rating-star" size={16} aria-hidden="true"/><strong>{number.format(p.rating)}</strong>{p.reviewCount !== undefined && ` (${number.format(p.reviewCount)})`}</span>}
                {p.durationMinutes && <span><Clock3 size={16} aria-hidden="true"/>{formatTourDuration(p.durationMinutes, lang)}</span>}
                {p.freeCancellation && <span><Check className="vt-check" size={17} aria-hidden="true"/>{f[15]}</span>}
              </div>
              {p.description && <details className="vt-description"><summary>{f[21]}<ChevronDown size={14} aria-hidden="true"/></summary><p lang={result.language} dir="auto">{p.description}</p></details>}
              <div className="vt-card-action">
                {p.fromPrice !== undefined && p.currency && <span>{t[6]} <strong>{new Intl.NumberFormat(lang, { style: 'currency', currency: p.currency }).format(p.fromPrice)}</strong></span>}
                <a href={p.productUrl} onClick={() => trackProduct('viator_open', lang)} target="_blank" rel="sponsored noopener noreferrer" className="vt-primary">{t[7]}<ExternalLink size={15} aria-hidden="true"/></a>
              </div>
              {plannerCity && <TourDayPlan city={plannerCity} lang={lang} code={p.code} url={p.productUrl} name={p.title}/>}
            </div>
          </article>)}</div>}
          {result && applied && <div className="vt-paging">
            {start > 1 && <button type="button" disabled={loading || !!pending} onClick={() => void search(applied, start - 12, true)}><ChevronLeft size={16} aria-hidden="true"/>{t[11]}</button>}
            {result.products.length > 0 && start + 12 <= result.totalCount && start < 9997 && <button type="button" disabled={loading || !!pending} onClick={() => void search(applied, start + 12, true)}>{t[10]}<ChevronRight size={16} aria-hidden="true"/></button>}
          </div>}
          {!!result?.products.length && <p className="vt-disclosure" data-testid="tour-disclosure">{t[8]}</p>}
        </div>
      </div>
    </form>
    <div className="vt-more">
      <a href={discoverySwitchHref('activities', lang, applied?.city ?? city, applied?.term ?? term.trim())}>{placesLabel}<ArrowRight size={16} aria-hidden="true"/></a>
      <SearchGuide path="/tours" lang={lang}/>
    </div>
  </section>
}
