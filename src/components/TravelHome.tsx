import { Hotel, Utensils, Ticket, BookOpen, ArrowRight, Search } from 'lucide-react'
import { useState } from 'react'

type Destination = 'city' | 'taxi' | 'transit' | 'currency' | 'nearme' | 'safety' | 'stay' | 'food' | 'experiences' | 'assistant'
const translations = {
  en: ['Türkiye,', 'made easier.', 'Practical local information for a safer, smarter and more enjoyable trip.', 'Where are you going or what do you need?', 'Search', 'Need it now?', 'Explore Türkiye', 'Plan your trip', 'Know before you go', 'View all', 'Taxi fare', 'Exchange rates', 'Getting around', 'Near me', 'Safety', 'Emergency', 'Hotels', 'Restaurants', 'Activities', 'Travel guides', 'Cities, coastlines and unforgettable experiences.', 'Everything you need, in one place.', 'Transport cards, money and useful travel answers.', 'Museums & culture', 'Cinema', 'Entertainment', 'Summer', 'Winter'],
  tr: ['Türkiye,', 'şimdi daha kolay.', 'Daha güvenli, bilinçli ve keyifli bir gezi için pratik yerel bilgiler.', 'Nereye gitmek veya ne bulmak istiyorsun?', 'Ara', 'Hemen lazım mı?', 'Türkiye’yi keşfet', 'Gezini planla', 'Gitmeden önce', 'Tümünü gör', 'Taksi ücreti', 'Döviz kurları', 'Toplu taşıma', 'Yakınımda', 'Güvenlik', 'Acil durum', 'Oteller', 'Restoranlar', 'Aktiviteler', 'Seyahat rehberi', 'Şehirler, sahiller ve unutulmaz deneyimler.', 'İhtiyacın olan her şey bir arada.', 'Ulaşım kartları, para ve pratik seyahat cevapları.', 'Müze ve kültür', 'Sinema', 'Eğlence', 'Yaz', 'Kış'],
  de: ['Türkiye,', 'einfach entdecken.', 'Praktische lokale Informationen für eine sichere und schöne Reise.', 'Wohin möchten Sie oder was suchen Sie?', 'Suchen', 'Jetzt gebraucht?', 'Türkiye entdecken', 'Reise planen', 'Vor der Reise', 'Alle ansehen', 'Taxipreis', 'Wechselkurse', 'Nahverkehr', 'In der Nähe', 'Sicherheit', 'Notfall', 'Hotels', 'Restaurants', 'Aktivitäten', 'Reisefragen', 'Städte, Küsten und unvergessliche Erlebnisse.', 'Alles für Ihre Reise an einem Ort.', 'Verkehrskarten, Geld und praktische Antworten.', 'Museen & Kultur', 'Kino', 'Unterhaltung', 'Sommer', 'Winter'],
  fr: ['Türkiye,', 'en toute simplicité.', 'Des informations locales pratiques pour un voyage serein et agréable.', 'Où allez-vous ou que cherchez-vous ?', 'Rechercher', 'Besoin immédiat ?', 'Explorer la Türkiye', 'Préparer votre voyage', 'Avant de partir', 'Voir tout', 'Tarif taxi', 'Taux de change', 'Transports', 'À proximité', 'Sécurité', 'Urgence', 'Hôtels', 'Restaurants', 'Activités', 'Guides de voyage', 'Villes, côtes et expériences inoubliables.', 'Tout pour votre voyage au même endroit.', 'Cartes de transport, argent et réponses utiles.', 'Musées et culture', 'Cinéma', 'Loisirs', 'Été', 'Hiver'],
  ar: ['تركيا،', 'بكل سهولة.', 'معلومات محلية عملية لرحلة أكثر أمانًا وراحة ومتعة.', 'إلى أين تريد الذهاب أو ماذا تبحث عنه؟', 'بحث', 'تحتاجه الآن؟', 'استكشف تركيا', 'خطط لرحلتك', 'قبل السفر', 'عرض الكل', 'أجرة التاكسي', 'أسعار الصرف', 'المواصلات', 'بالقرب مني', 'الأمان', 'الطوارئ', 'الفنادق', 'المطاعم', 'الأنشطة', 'دليل السفر', 'مدن وسواحل وتجارب لا تنسى.', 'كل ما تحتاجه لرحلتك في مكان واحد.', 'بطاقات المواصلات والمال وإجابات مفيدة.', 'متاحف وثقافة', 'سينما', 'ترفيه', 'الصيف', 'الشتاء'],
  ru: ['Турция,', 'путешествовать проще.', 'Практические местные сведения для безопасного и приятного путешествия.', 'Куда вы едете или что ищете?', 'Поиск', 'Нужно сейчас?', 'Откройте Турцию', 'Планируйте поездку', 'Перед поездкой', 'Смотреть всё', 'Стоимость такси', 'Курсы валют', 'Транспорт', 'Рядом со мной', 'Безопасность', 'Экстренная помощь', 'Отели', 'Рестораны', 'Развлечения', 'Путеводитель', 'Города, побережья и незабываемые впечатления.', 'Всё для поездки в одном месте.', 'Транспортные карты, деньги и полезные ответы.', 'Музеи и культура', 'Кино', 'Развлечения', 'Лето', 'Зима'],
  zh: ['土耳其，', '旅行更轻松。', '实用的当地信息，让旅程更安全、更从容、更愉快。', '想去哪里，或需要什么帮助？', '搜索', '现在需要？', '探索土耳其', '规划旅程', '出发前须知', '查看全部', '出租车费用', '汇率', '公共交通', '附近地点', '安全', '紧急帮助', '酒店', '餐厅', '活动', '旅行指南', '城市、海岸与难忘的体验。', '旅行所需，尽在一处。', '交通卡、换汇和实用旅行问答。', '博物馆与文化', '影院', '娱乐', '夏季', '冬季'],
}
export default function TravelHome({ lang, cities, onNavigate, onCity, onSearch, onCategory }: {
  lang: string
  cities: Array<{ key: string; name: string; coverImage: string }>
  onNavigate: (destination: Destination) => void
  onCity: (city: string) => void
  onSearch: (query: string) => void
  onCategory: (category: string) => void
}) {
  const t = translations[lang as keyof typeof translations] ?? translations.en
  const [query, setQuery] = useState('')
  const quick = [{ label: t[10], emoji: '🚕', page: 'taxi' }, { label: t[11], emoji: '💵', page: 'currency' }, { label: t[12], emoji: '🚌', page: 'transit' }, { label: t[13], emoji: '📍', page: 'nearme' }, { label: t[14], emoji: '🛡️', page: 'safety' }] as const
  const plan = [{ label: t[16], icon: Hotel, page: 'stay' }, { label: t[17], icon: Utensils, page: 'food' }, { label: t[18], icon: Ticket, page: 'experiences' }, { label: t[19], icon: BookOpen, page: 'assistant' }] as const
  return <main className="travel-home">
    <section className="travel-hero">
      <img className="travel-hero-photo" src={cities[0]?.coverImage} alt={cities[0]?.name} fetchPriority="high" />
      <div className="travel-hero-wash" />
      <div className="travel-hero-copy">
        <h1>{t[0]}<br />{' '}<span>{t[1]}</span></h1>
        <p>{t[2]}</p>
        <form onSubmit={event => { event.preventDefault(); onSearch(query) }} className="travel-search"><Search size={19} aria-hidden="true" /><input aria-label={t[3]} placeholder={t[3]} value={query} onChange={event => setQuery(event.target.value)} /><button type="submit">{t[4]}</button></form>
        <div className="travel-city-chips">{cities.map(city => <button key={city.key} onClick={() => onCity(city.key)}>{city.name}</button>)}</div>
      </div>
    </section>
    <section className="travel-section"><h2>{t[5]}</h2><div className="travel-quick-grid">{quick.map(({ label, emoji, page }) => <button key={page} onClick={() => onNavigate(page)} className="travel-tool"><span className="travel-tool-emoji" aria-hidden="true">{emoji}</span><span>{label}</span><ArrowRight size={14} aria-hidden="true" /></button>)}<a href="tel:112" className="travel-tool travel-emergency"><span className="travel-tool-emoji" aria-hidden="true">🚨</span><span>{t[15]}</span><strong>112</strong></a></div></section>
    <section className="travel-section"><div className="travel-section-heading"><div><h2>{t[6]}</h2><p>{t[20]}</p></div><button onClick={() => onNavigate('city')}>{t[9]} <ArrowRight size={14} /></button></div><div className="travel-cities">{cities.map(city => <button key={city.key} onClick={() => onCity(city.key)}><img src={city.coverImage} alt={city.name} loading="lazy" /><span>{city.name}<ArrowRight size={16} /></span></button>)}</div></section>
    <section className="travel-section"><div className="travel-section-heading"><div><h2>{t[7]}</h2><p>{t[21]}</p></div></div><div className="travel-plan-grid">{plan.map(({ label, icon: Icon, page }) => <button key={page} onClick={() => onNavigate(page)} className="travel-tool"><Icon aria-hidden="true" /><span>{label}</span><ArrowRight size={14} aria-hidden="true" /></button>)}</div></section>
    <section className="travel-section"><div className="travel-section-heading"><h2>{t[18]}</h2><button onClick={() => onNavigate('experiences')}>{t[9]} <ArrowRight size={14} /></button></div><div className="travel-category-grid">{['Museum & Culture', 'Cinema', 'Entertainment', 'Summer', 'Winter'].map((category, index) => <button key={category} onClick={() => onCategory(category)}><span>{['🏛️', '🎬', '🎟️', '☀️', '❄️'][index]}</span>{t[23 + index]}<ArrowRight size={14} /></button>)}</div></section>
    <section className="travel-guide-banner"><BookOpen size={32} /><div><h2>{t[8]}</h2><p>{t[22]}</p></div><button onClick={() => onNavigate('assistant')}>{t[19]} <ArrowRight size={16} /></button></section>
  </main>
}
