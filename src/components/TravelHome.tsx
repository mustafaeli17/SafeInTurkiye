import {localizePath} from '../lib/searchLocales';
import CityArtwork from './CityArtwork';
import HomePhotoCard from './HomePhotoCard';
import {sectionPath} from '../lib/sectionNavigation';
import {cityDisplayName} from '../lib/cityLocale';
import { Landmark, Clapperboard, Ticket, BookOpen, ArrowRight, Search, CarTaxiFront, BanknoteArrowDown, BusFront, MapPin, ShieldCheck, Siren } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import HomeHarbour from './HomeHarbour'
import {cityPath} from '../lib/publicRoutes'
import {toursLabel} from '../lib/viatorCopy'
import SearchAlternatives from './SearchAlternatives'
import {searchHelp} from '../services/homeSearch'


type Destination = 'city' | 'taxi' | 'transit' | 'currency' | 'nearme' | 'safety' | 'stay' | 'food' | 'experiences' | 'assistant' | 'tours'
const translations = {
  es: ['Türkiye,', 'más fácil.', 'Información local práctica para un viaje más seguro, sencillo y agradable.', 'Busca una ciudad, lugar o servicio', 'Buscar', '¿Lo necesitas ahora?', 'Explora Türkiye', 'Planifica tu viaje', 'Antes de viajar', 'Ver todo', 'Tarifa de taxi', 'Tipos de cambio', 'Transporte', 'Cerca de mí', 'Seguridad', 'Emergencias', 'Hoteles', 'Restaurantes', 'Actividades', 'Guías de viaje', 'Ciudades, costas y experiencias inolvidables.', 'Todo lo que necesitas en un solo lugar.', 'Tarjetas de transporte, dinero y respuestas útiles.', 'Museos y cultura', 'Cine', 'Ocio', 'Verano', 'Invierno'],
  en: ['Türkiye,', 'made easier.', 'Practical local information for a safer, smarter and more enjoyable trip.', 'Search cities, places or services', 'Search', 'Need it now?', 'Explore Türkiye', 'Plan your trip', 'Know before you go', 'View all', 'Taxi fare', 'Exchange rates', 'Getting around', 'Near me', 'Safety', 'Emergency', 'Hotels', 'Restaurants', 'Activities', 'Travel guides', 'Cities, coastlines and unforgettable experiences.', 'Everything you need, in one place.', 'Transport cards, money and useful travel answers.', 'Museums & culture', 'Cinema', 'Entertainment', 'Summer', 'Winter'],
  tr: ['Türkiye,', 'şimdi daha kolay.', 'Daha güvenli, bilinçli ve keyifli bir gezi için pratik yerel bilgiler.', 'Şehir, yer veya hizmet ara', 'Ara', 'Hemen lazım mı?', 'Türkiye’yi keşfet', 'Gezini planla', 'Gitmeden önce', 'Tümünü gör', 'Taksi ücreti', 'Döviz kurları', 'Toplu taşıma', 'Yakınımda', 'Güvenlik', 'Acil durum', 'Oteller', 'Restoranlar', 'Aktiviteler', 'Seyahat rehberi', 'Şehirler, sahiller ve unutulmaz deneyimler.', 'İhtiyacın olan her şey bir arada.', 'Ulaşım kartları, para ve pratik seyahat cevapları.', 'Müze ve kültür', 'Sinema', 'Eğlence', 'Yaz', 'Kış'],
  de: ['Türkiye,', 'einfach entdecken.', 'Praktische lokale Informationen für eine sichere und schöne Reise.', 'Stadt, Ort oder Service suchen', 'Suchen', 'Jetzt gebraucht?', 'Türkiye entdecken', 'Reise planen', 'Vor der Reise', 'Alle ansehen', 'Taxipreis', 'Wechselkurse', 'Nahverkehr', 'In der Nähe', 'Sicherheit', 'Notfall', 'Hotels', 'Restaurants', 'Aktivitäten', 'Reisefragen', 'Städte, Küsten und unvergessliche Erlebnisse.', 'Alles für Ihre Reise an einem Ort.', 'Verkehrskarten, Geld und praktische Antworten.', 'Museen & Kultur', 'Kino', 'Unterhaltung', 'Sommer', 'Winter'],
  fr: ['Türkiye,', 'en toute simplicité.', 'Des informations locales pratiques pour un voyage serein et agréable.', 'Ville, lieu ou service', 'Rechercher', 'Besoin immédiat ?', 'Explorer la Türkiye', 'Préparer votre voyage', 'Avant de partir', 'Voir tout', 'Tarif taxi', 'Taux de change', 'Transports', 'À proximité', 'Sécurité', 'Urgence', 'Hôtels', 'Restaurants', 'Activités', 'Guides de voyage', 'Villes, côtes et expériences inoubliables.', 'Tout pour votre voyage au même endroit.', 'Cartes de transport, argent et réponses utiles.', 'Musées et culture', 'Cinéma', 'Loisirs', 'Été', 'Hiver'],
  ar: ['تركيا،', 'بكل سهولة.', 'معلومات محلية عملية لرحلة أكثر أمانًا وراحة ومتعة.', 'ابحث عن مدينة أو مكان أو خدمة', 'بحث', 'تحتاجه الآن؟', 'استكشف تركيا', 'خطط لرحلتك', 'قبل السفر', 'عرض الكل', 'أجرة التاكسي', 'أسعار الصرف', 'المواصلات', 'بالقرب مني', 'الأمان', 'الطوارئ', 'الفنادق', 'المطاعم', 'الأنشطة', 'دليل السفر', 'مدن وسواحل وتجارب لا تنسى.', 'كل ما تحتاجه لرحلتك في مكان واحد.', 'بطاقات المواصلات والمال وإجابات مفيدة.', 'متاحف وثقافة', 'سينما', 'ترفيه', 'الصيف', 'الشتاء'],
  ru: ['Турция,', 'путешествовать проще.', 'Практические местные сведения для безопасного и приятного путешествия.', 'Найти город, место или услугу', 'Поиск', 'Нужно сейчас?', 'Откройте Турцию', 'Планируйте поездку', 'Перед поездкой', 'Смотреть всё', 'Стоимость такси', 'Курсы валют', 'Транспорт', 'Рядом со мной', 'Безопасность', 'Экстренная помощь', 'Отели', 'Рестораны', 'Развлечения', 'Путеводитель', 'Города, побережья и незабываемые впечатления.', 'Всё для поездки в одном месте.', 'Транспортные карты, деньги и полезные ответы.', 'Музеи и культура', 'Кино', 'Развлечения', 'Лето', 'Зима'],
  zh: ['土耳其，', '旅行更轻松。', '实用的当地信息，让旅程更安全、更从容、更愉快。', '搜索城市、地点或服务', '搜索', '现在需要？', '探索土耳其', '规划旅程', '出发前须知', '查看全部', '出租车费用', '汇率', '公共交通', '附近地点', '安全', '紧急帮助', '酒店', '餐厅', '活动', '旅行指南', '城市、海岸与难忘的体验。', '旅行所需，尽在一处。', '交通卡、换汇和实用旅行问答。', '博物馆与文化', '影院', '娱乐', '夏季', '冬季'],
}
const allCityLabels = {
  tr: 'Tüm {n} şehri gör', en: 'View all {n} cities', de: 'Alle {n} Städte ansehen',
  es: 'Ver las {n} ciudades', fr: 'Voir les {n} villes', ar: 'عرض كل المدن ({n})',
  ru: 'Все города ({n})', zh: '查看全部 {n} 个城市',
}

export default function TravelHome({ lang, cities, onNavigate, onCity, onSearch, onCategory,initialQuery='',chooseSearch=false }: {
  lang: string
  initialQuery?:string
  chooseSearch?:boolean
  cities: Array<{ key: string; name: string }>
  onNavigate: (destination: Destination) => void
  onCity: (city: string) => void
  onSearch: (query: string) => void
  onCategory: (category: string) => void
}) {
  const t = translations[lang as keyof typeof translations] ?? translations.en
  const [query, setQuery] = useState(initialQuery)
  const [motionPaused, setMotionPaused] = useState(() => {
    try { return window.sessionStorage.getItem('home-motion-paused') === '1' }
    catch { return false }
  })
  function toggleMotion() {
    const paused = !motionPaused
    setMotionPaused(paused)
    try { window.sessionStorage.setItem('home-motion-paused', paused ? '1' : '0') }
    catch { /* The control still works if browser storage is unavailable. */ }
  }
  const [allCities, setAllCities] = useState(() => typeof window !== 'undefined' && window.history.state?.homeGridExpanded === true)
  const cityHeading = useRef<HTMLHeadingElement>(null)
  const cityCards = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const city = window.history.state?.homeGridCity
    if (typeof city !== 'string') return
    const frame = requestAnimationFrame(() => {
      const card = Array.from(cityCards.current?.querySelectorAll('a') ?? []).find(link => link.dataset.city === city)
      if (!card || !card.getClientRects().length) return
      card.focus({preventScroll: true})
      card.scrollIntoView({block: 'center'})
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  const allCityLabel = (allCityLabels[lang as keyof typeof allCityLabels] ?? allCityLabels.en)
    .replace('{n}', new Intl.NumberFormat(lang).format(cities.length))
  function showCityGrid() {
    setAllCities(true)
    cityHeading.current?.focus({preventScroll: true})
    cityHeading.current?.scrollIntoView({block: 'start'})
  }
  const fewerCities: Record<string,string> = {en:'Show fewer',tr:'Daha az göster',de:'Weniger anzeigen',es:'Ver menos',fr:'Voir moins',ar:'عرض أقل',ru:'Свернуть',zh:'收起'}
  useEffect(()=>setQuery(initialQuery),[initialQuery])
  const quick = [
    {label: t[10], icon: CarTaxiFront, page: 'taxi'}, {label: t[11], icon: BanknoteArrowDown, page: 'currency'},
    {label: t[12], icon: BusFront, page: 'transit'}, {label: t[13], icon: MapPin, page: 'nearme'},
    {label: t[14], icon: ShieldCheck, page: 'safety'},
  ] as const
  const plan = [
    { label: t[16], image: 'hotels', page: 'stay' },
    { label: t[17], image: 'restaurants', page: 'food' },
    { label: t[18], image: 'activities', page: 'experiences' },
    { label: toursLabel(lang), image: 'tours', page: 'tours' },
  ] as const
  return <main className="travel-home" data-motion-paused={motionPaused}>
    <HomeHarbour lang={lang} paused={motionPaused} onToggle={toggleMotion}>
        <h1>{t[0]}<br />{' '}<span>{t[1]}</span></h1>
        <p>{t[2]}</p>
        <form role="search" onSubmit={event => { event.preventDefault(); onSearch(query) }} className="travel-search"><Search size={19} aria-hidden="true" /><input type="search" enterKeyHint="search" aria-label={t[3]} placeholder={t[3]} maxLength={160} value={query} onChange={event => setQuery(event.target.value)} /><button type="submit">{t[4]}</button></form>
        <div className="travel-city-chips">
          {cities.slice(0,3).map(city => <a key={city.key} href={localizePath(cityPath(city.key),lang)} onClick={event=>{if(!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onCity(city.key);}}}>{cityDisplayName(city.name,lang)}</a>)}
          {cities.length>3&&<button type="button" className="travel-city-jump" aria-controls="home-city-cards" onClick={showCityGrid}>{allCityLabel}<ArrowRight size={15} aria-hidden="true"/></button>}
        </div>
    </HomeHarbour>
    {chooseSearch&&<section className="travel-section" role="status"><p className="mb-3">{searchHelp[lang]??searchHelp.en}</p><SearchAlternatives lang={lang} query={initialQuery}/></section>}
    <section className="travel-section"><h2>{t[5]}</h2>
      <div className="home-shortcuts">{quick.map(({label, icon: Icon, page}) =>
        <a key={page} href={localizePath(sectionPath(page),lang)} onClick={event=>{
          if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
          event.preventDefault()
          onNavigate(page)
        }}><Icon size={22} aria-hidden="true"/><span>{label}</span><ArrowRight size={14} aria-hidden="true"/></a>
      )}<a href="tel:112"><Siren size={22} aria-hidden="true"/><span>{t[15]}</span><small>112</small></a></div>
    </section>
    <section className="travel-section">
      <div className="travel-section-heading"><h2 ref={cityHeading} tabIndex={-1} className="travel-city-heading">{t[6]}</h2>
        {cities.length>4&&<button type="button" className="travel-city-toggle" aria-expanded={allCities} aria-controls="home-city-cards" onClick={()=>setAllCities(!allCities)}>{allCities?(fewerCities[lang]??fewerCities.en):t[9]} <ArrowRight size={16} aria-hidden="true"/></button>}
      </div>
      <div id="home-city-cards" ref={cityCards} className="home-photo-grid home-city-photos" data-expanded={allCities}>
        {cities.map(city => {
          const path = cityPath(city.key)
          return <HomePhotoCard key={city.key} city={city.key} label={cityDisplayName(city.name,lang)}
            href={localizePath(path,lang)} balloon={path === '/cities/cappadocia'} onOpen={() => {
              window.history.replaceState({...window.history.state,homeGridCity:city.key,homeGridExpanded:allCities},'')
              onCity(city.key)
            }}>
            {path === '/cities/istanbul'
              ? <img className="home-istanbul-art" src="/photos/nearby-hagia-sophia-768.webp"
                  srcSet="/photos/nearby-hagia-sophia-768.webp 768w, /photos/nearby-hagia-sophia-1600.webp 1600w"
                  sizes="(max-width: 700px) 48vw, 275px" width="768" height="256" loading="lazy" decoding="async" alt=""/>
              : <CityArtwork city={city.key} lang={lang} />}
          </HomePhotoCard>
        })}
      </div>
    </section>
    <section className="travel-section">
      <div className="travel-section-heading"><h2>{t[7]}</h2></div>
      <div className="home-photo-grid home-plan-photos">
        {plan.map(({label, image, page}) => <HomePhotoCard key={page} label={label}
          href={localizePath(sectionPath(page),lang)} onOpen={() => onNavigate(page)}>
          <img src={`/photos/directory/${image}-768.webp`} width="768" height="520" loading="lazy" decoding="async" alt=""/>
        </HomePhotoCard>)}
      </div>
      <div className="home-activity-links" role="group" aria-label={t[18]}>
        {[{name: 'Museum & Culture', icon: Landmark}, {name: 'Cinema', icon: Clapperboard}, {name: 'Entertainment', icon: Ticket}].map(({name, icon: Icon}, index) =>
          <button type="button" key={name} onClick={() => onCategory(name)}><Icon size={15} aria-hidden="true" />{t[23 + index]}</button>)}
      </div>
    </section>
    <a className="home-guide-link" href={localizePath(sectionPath('assistant'),lang)} onClick={event=>{
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      onNavigate('assistant')
    }}>
      <BookOpen size={27} aria-hidden="true" /><div><h2>{t[8]}</h2><p>{t[22]}</p></div>
      <span>{t[19]}</span><ArrowRight size={17} aria-hidden="true" />
    </a>
  </main>
}
