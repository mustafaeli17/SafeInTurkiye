import { formatTransitDuration } from './transitDuration'

type DirectoryCopy = {
  title: string
  intro: string
  byDestination: string
  price: string
  categoryLabel: string
  categories: [string, string, string, string, string, string, string, string, string]
  landmarks: [string, string, string]
}

const directory: Record<string, DirectoryCopy> = {
  en: {
    title: 'Discover Türkiye with unique tours',
    intro: 'Explore cities, sail the coast or take a day trip. Find your next experience with Viator.',
    byDestination: 'Explore by destination', price: 'Price range', categoryLabel: 'Tour categories',
    categories: ['All tours', 'City tours', 'Cruises', 'Culture', 'History', 'Nature', 'Adventure', 'Food & drink', 'Museums'],
    landmarks: ['Hagia Sophia', 'Düden Waterfalls', 'Rose Valley'],
  },
  tr: {
    title: 'Türkiye’yi turlarla keşfedin',
    intro: 'Şehirleri gezin, kıyılarda denize açılın veya günübirlik bir gezi planlayın. Viator’da size uygun turu bulun.',
    byDestination: 'Destinasyona göre keşfedin', price: 'Fiyat aralığı', categoryLabel: 'Tur kategorileri',
    categories: ['Tüm turlar', 'Şehir turları', 'Tekne turları', 'Kültür', 'Tarih', 'Doğa', 'Macera', 'Yeme içme', 'Müzeler'],
    landmarks: ['Ayasofya', 'Düden Şelaleleri', 'Güllüdere Vadisi'],
  },
  de: {
    title: 'Die Türkei auf Touren entdecken',
    intro: 'Städte erkunden, an der Küste entlangsegeln oder einen Tagesausflug machen. Finde deine Tour mit Viator.',
    byDestination: 'Reiseziele entdecken', price: 'Preisspanne', categoryLabel: 'Tourkategorien',
    categories: ['Alle Touren', 'Stadttouren', 'Bootstouren', 'Kultur', 'Geschichte', 'Natur', 'Abenteuer', 'Essen & Trinken', 'Museen'],
    landmarks: ['Hagia Sophia', 'Düden-Wasserfälle', 'Rosental'],
  },
  es: {
    title: 'Descubre Turquía con excursiones únicas',
    intro: 'Recorre ciudades, navega por la costa o disfruta de una excursión de un día. Encuentra tu experiencia con Viator.',
    byDestination: 'Explora por destino', price: 'Rango de precios', categoryLabel: 'Tipos de excursiones',
    categories: ['Todas', 'Por la ciudad', 'Cruceros', 'Cultura', 'Historia', 'Naturaleza', 'Aventura', 'Gastronomía', 'Museos'],
    landmarks: ['Santa Sofía', 'Cascadas de Düden', 'Valle de las Rosas'],
  },
  fr: {
    title: 'Découvrez la Turquie en excursion',
    intro: 'Visitez les villes, longez la côte en bateau ou partez en excursion à la journée. Trouvez votre activité avec Viator.',
    byDestination: 'Explorer par destination', price: 'Fourchette de prix', categoryLabel: 'Types d’excursions',
    categories: ['Tout voir', 'Visites en ville', 'Croisières', 'Culture', 'Histoire', 'Nature', 'Aventure', 'Gastronomie', 'Musées'],
    landmarks: ['Sainte-Sophie', 'Chutes de Düden', 'Vallée des Roses'],
  },
  ar: {
    title: 'اكتشف تركيا في جولات مميزة',
    intro: 'استكشف المدن أو أبحر على طول الساحل أو انطلق في رحلة ليوم واحد. اعثر على تجربتك مع Viator.',
    byDestination: 'استكشف حسب الوجهة', price: 'نطاق السعر', categoryLabel: 'فئات الجولات',
    categories: ['كل الجولات', 'جولات المدن', 'رحلات بحرية', 'الثقافة', 'التاريخ', 'الطبيعة', 'المغامرات', 'المأكولات والمشروبات', 'المتاحف'],
    landmarks: ['آيا صوفيا', 'شلالات دودن', 'وادي الورود'],
  },
  ru: {
    title: 'Откройте для себя Турцию с экскурсией',
    intro: 'Прогуляйтесь по городу, отправьтесь в круиз или выберите поездку на день. Найдите экскурсию на Viator.',
    byDestination: 'Выбор направления', price: 'Диапазон цен', categoryLabel: 'Виды экскурсий',
    categories: ['Все экскурсии', 'По городу', 'Круизы', 'Культура', 'История', 'Природа', 'Приключения', 'Еда и напитки', 'Музеи'],
    landmarks: ['Айя-София', 'Дюденские водопады', 'Розовая долина'],
  },
  zh: {
    title: '跟随特色行程探索土耳其',
    intro: '漫步城市、沿海巡游，或来一次一日游。在 Viator 寻找适合自己的体验。',
    byDestination: '按目的地探索', price: '价格范围', categoryLabel: '行程类别',
    categories: ['全部行程', '城市观光', '游船', '文化', '历史', '自然风光', '探险', '美食美酒', '博物馆'],
    landmarks: ['圣索菲亚大教堂', '杜登瀑布', '玫瑰谷'],
  },
}

export function tourDirectoryCopy(lang: string) {
  return directory[lang] ?? directory.en
}

// Only the preset searches use a translated keyword. A visitor's own place names pass through unchanged.
const categoryTerms: Record<string, string[]> = {
  en: ['', 'city tour', 'cruise', 'culture', 'history', 'nature', 'adventure', 'food', 'museum tour'],
  de: ['', 'Stadtführung', 'Bootstour', 'Kultur', 'Geschichte', 'Natur', 'Abenteuer', 'Kulinarik', 'Museumsführung'],
  es: ['', 'visita por la ciudad', 'crucero', 'cultura', 'historia', 'naturaleza', 'aventura', 'gastronomía', 'visita al museo'],
  fr: ['', 'visite de la ville', 'croisière', 'culture', 'histoire', 'nature', 'aventure', 'gastronomie', 'visite du musée'],
}

export function tourCategoryTerm(index: number, lang: string) {
  return (categoryTerms[lang] ?? categoryTerms.en)[index]
}

export function formatTourDuration(range: { from: number; to: number }, lang: string) {
  const { from, to } = range
  if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to < from) return ''
  const unitSize = from % 1440 === 0 && to % 1440 === 0 ? 1440 : from % 60 === 0 && to % 60 === 0 ? 60 : 1
  if (unitSize === 1 && to >= 60) {
    const start = formatTransitDuration(`${from * 60}s`, lang)
    return from === to ? start : `${start}–${formatTransitDuration(`${to * 60}s`, lang)}`
  }
  const unit = unitSize === 1440 ? 'day' : unitSize === 60 ? 'hour' : 'minute'
  const formatter = new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'long' })
  if (from === to) return formatter.format(from / unitSize)
  return typeof formatter.formatRange === 'function'
    ? formatter.formatRange(from / unitSize, to / unitSize)
    : `${formatter.format(from / unitSize)}–${formatter.format(to / unitSize)}`
}
