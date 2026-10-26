import AccessibleDialog from './components/AccessibleDialog';
import {authCopy} from './lib/authCopy';
import {
Bot,
Building2,
ChevronDown,
Hotel,
Loader2,
Lock,
MapPin,
Menu,
Navigation2,
PhoneCall,
Shield,
ShieldCheck,
Ticket,
Utensils,
X
} from 'lucide-react';
import { lazy,Suspense,useCallback,useEffect,useRef,useState } from 'react';
const siteLogo='/brand-logo.webp';
import CityArtwork from './components/CityArtwork';
import HomeButton from './components/HomeButton';
import type {ComponentProps} from 'react';
const NearbyPlacesComponent=lazy(()=>import('./components/NearbyPlaces'));
function NearbyPlaces(props:ComponentProps<typeof NearbyPlacesComponent>){return <Suspense fallback={<PageLoading lang={props.lang}/>}><NearbyPlacesComponent {...props}/></Suspense>;}
import PageLoading from './components/PageLoading';
const SafeRouteMap=lazy(()=>import('./components/TaxiRouteMap'));
const FirstVisitPlan=lazy(()=>import('./components/FirstVisitPlan'));
import PhotoCredits from './components/PhotoCredits';
import SponsoredBusinesses from './components/SponsoredBusinesses';
import TravelHome from './components/TravelHome';
import { WeatherCard } from './components/WeatherCard';
import citiesEs from './data/citiesEs.json';
import citiesTr from './data/citiesTr.json';
import citiesZh from './data/citiesZh.json';
import cityGuides from './data/cityGuides.json';
import gaziantepCopy from './data/gaziantepCopy.json';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { navigateTo,useBrowserLocation } from './lib/browserNavigation';
import { cityDisplayName,cityLocale } from './lib/cityLocale';
import { findCityGuide,openCityGuide } from './lib/cityNavigation';
import { cityTransportText } from './lib/cityTransportCopy';
import { destinationSlug,discoveryCity } from './lib/discoveryNavigation';
import { readLanguagePreference,saveLanguagePreference } from './lib/languagePreference';
import { cityPath,publicCities } from './lib/publicRoutes';
import { regionalDescription } from './lib/regionalDescription';
import { sectionFromPath,sectionPath,transferIntent,type Section } from './lib/sectionNavigation';
import {tourIntent} from './services/tourSearch';
import {mentionedSearchCity} from './services/searchCities';
import { updateSectionSeo } from './lib/seo';
import { siteInformation } from './lib/siteInformation';
import { supabaseConfigured } from './lib/supabase';
import { taxiBudgetRange } from './lib/taxiBudget';
import { routeFareRange } from './lib/taxiCalculation';
import { taxiCityFromAddress,taxiReferenceCity,taxiUnavailableText } from './lib/taxiCity';
import { taxiBudgetCopy,taxiDetailsCopy,taxiEstimateCopy,taxiIntroCopy } from './lib/taxiCopy';
import { taxiErrorText,type TaxiErrorKey } from './lib/taxiErrors';
import {taxiCalculationMapNotice} from './lib/taxiRouteNotice';
import SearchContext from './components/SearchContext';
import { taxiSearchUrl } from './lib/taxiSearch';
import { toursLabel } from './lib/viatorCopy';
import { directoryText } from './lib/visitorDirectory';
import { getCurrentTaxiTariffs } from './repositories/tariffRepository';
const CurrencyRates = lazy(()=>import('./components/CurrencyRates'));
const SafetyTips = lazy(()=>import('./components/SafetyTips'));
const TransitPlanner = lazy(()=>import('./components/TransitPlanner'));
const ViatorTours = lazy(()=>import('./components/ViatorTours'));
const TravelFaq = lazy(()=>import('./components/TravelFaq'));
const TransportCardGuide = lazy(()=>import('./components/TravelFaq').then(module=>({default:module.TransportCardGuide})));
const ContentAdmin = lazy(()=>import('./components/ContentAdmin'));

// ============================================================================
// 1. TİP TANIMLARI & 6 DİLLİ SÖZLÜK SİSTEMİ
// ============================================================================
type SupportedLang = 'en' | 'tr' | 'de' | 'fr' | 'ar' | 'ru' | 'zh' | 'es';

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteGeometryPoint {
  lat: number;
  lng: number;
}

interface GeocodedPlace {
  label: string;
  lat: number;
  lng: number;
  city?: string;
}

interface CityInfo {
  name: string;
  tagline: string;
  lat: number;
  lng: number;
  temp: string;
  weatherDesc: string;
  humidity: string;
  wind: string;
  localTip: string;
  highlights: { name: string; detail: string }[];
}

interface TaxiTariff {
  city: string;
  openingFare: number;
  pricePerKm: number;
  minimumFare: number;
  waitingFarePerHour: number;
  source: string;
  lastUpdated: string;
  sourceUrl?: string;
}


// Tam Çalışan Çeviri Sözlüğü
const dict: Record<SupportedLang, Record<string, string>> = {
  es: {heroTitle:'Explora Türkiye con confianza',heroSub:'Información local práctica para viajar por Türkiye.',searchPlaceholder:'¿Qué necesitas? Taxi, metro, farmacia…',popCities:'Ciudades populares',popCitiesSub:'Descubre los destinos de Türkiye',viewAll:'Ver todo',aiHelpTitle:'¿Necesitas ayuda?',aiHelpSub:'Consulta nuestras guías y preguntas frecuentes.',startChat:'Ver preguntas',explore:'Explorar',assistant:'Preguntas frecuentes',taxi:'Tarifa de taxi',transit:'Transporte',currency:'Cambio de divisas',cityWeather:'Ciudades y tiempo',hotels:'Hoteles',dining:'Restaurantes',activities:'Actividades',nearMe:'Cerca de mí',emergency:'112 Emergencias'},
  en: {
    heroTitle: 'Explore Türkiye with confidence',
    heroSub: 'Taxi estimates, station guides, dated reference rates, and practical city information.',
    searchPlaceholder: 'What do you need help with? (e.g. Taksim taxi, M11 Metro, pharmacy)',
    popCities: 'Popular Cities',
    popCitiesSub: "Explore Türkiye's most visited destinations",
    viewAll: 'View all',
    aiHelpTitle: 'Need instant help?',
    aiHelpSub: 'Chat with our AI Travel Assistant for verified rates and transit guides.',
    startChat: 'Start Chat',
    explore: 'Explore',
    assistant: 'AI Assistant',
    taxi: 'Taxi Fare',
    transit: 'Transit Navigator',
    currency: 'Exchange',
    cityWeather: 'Cities & Weather',
    hotels: 'Hotels',
    dining: 'Dining',
    activities: 'Activities',
    nearMe: 'Near Me',
    emergency: '112 SOS'
  },
  tr: {
    heroTitle: 'Türkiye’yi güvenle keşfedin',
    heroSub: 'Gerçek zamanlı UKOME taksi tarifeleri, toplu taşıma rotaları, döviz kurları ve acil yardım.',
    searchPlaceholder: 'Neye ihtiyacınız var? (örn. Taksim taksi, M2 Metro, eczane)',
    popCities: 'Popüler Şehirler',
    popCitiesSub: 'Türkiye’nin en çok ziyaret edilen destinasyonları',
    viewAll: 'Tümünü gör',
    aiHelpTitle: 'Anında yardıma mı ihtiyacınız var?',
    aiHelpSub: 'Onaylı fiyatlar ve ulaşım rotaları için Yapay Zeka Asistanımızla görüşün.',
    startChat: 'Sohbeti Başlat',
    explore: 'Keşfet',
    assistant: 'Yapay Zeka Asistan',
    taxi: 'Taksi Ücreti',
    transit: 'Toplu Taşıma',
    currency: 'Döviz (Exchange)',
    cityWeather: 'Şehirler & Hava',
    hotels: 'Oteller',
    dining: 'Yeme & İçme',
    activities: 'Aktiviteler',
    nearMe: 'Yakınımda',
    emergency: '112 Acil'
  },
  de: {
    heroTitle: 'Reisen Sie mit Vertrauen durch die Türkei',
    heroSub: 'Offizielle UKOME-Taxitarife, ÖPNV-Strecken, Wechselkurse und 24/7 Notfallhilfe.',
    searchPlaceholder: 'Wobei benötigen Sie Hilfe? (z.B. Taxi, Metro, Apotheke)',
    popCities: 'Beliebte Städte',
    popCitiesSub: 'Entdecken Sie die meistbesuchten Reiseziele',
    viewAll: 'Alle ansehen',
    aiHelpTitle: 'Brauchen Sie Hilfe?',
    aiHelpSub: 'Chatten Sie mit unserem KI-Assistenten für verifizierte Tarife.',
    startChat: 'Chat starten',
    explore: 'Entdecken',
    assistant: 'KI-Assistent',
    taxi: 'Taxipreis',
    transit: 'ÖPNV Navigator',
    currency: 'Wechselkurs',
    cityWeather: 'Städte & Wetter',
    hotels: 'Hotels',
    dining: 'Restaurants',
    activities: 'Aktivitäten',
    nearMe: 'In der Nähe',
    emergency: '112 Notruf'
  },
  fr: {
    heroTitle: 'Explorez la Turquie en toute confiance',
    heroSub: 'Tarifs officiels UKOME, transports publics, cours de change et assistance 24/7.',
    searchPlaceholder: 'De quoi avez-vous besoin ? (ex: taxi, métro, pharmacie)',
    popCities: 'Villes Populaires',
    popCitiesSub: 'Découvrez les destinations les plus visitées',
    viewAll: 'Voir tout',
    aiHelpTitle: 'Besoin d’aide ?',
    aiHelpSub: 'Discutez avec notre assistant IA pour des conseils fiables.',
    startChat: 'Démarrer le chat',
    explore: 'Explorer',
    assistant: 'Assistant IA',
    taxi: 'Tarif Taxi',
    transit: 'Navig. Transport',
    currency: 'Change',
    cityWeather: 'Villes & Météo',
    hotels: 'Hôtels',
    dining: 'Gastronomie',
    activities: 'Activités',
    nearMe: 'À Proximité',
    emergency: '112 Urgences'
  },
  ar: {
    heroTitle: 'استكشف تركيا بكل ثقة وأمان',
    heroSub: 'أسعار التاكسي الرسمية، خطوط المواصلات العامة، وأسعار الصرف الحية.',
    searchPlaceholder: 'بماذا تحتاج للمساعدة؟ (مثل: تاكسي، مترو، صيدلية)',
    popCities: 'المدن الشهيرة',
    popCitiesSub: 'استكشف الوجهات الأكثر زيارة في تركيا',
    viewAll: 'عرض الكل',
    aiHelpTitle: 'هل تحتاج مساعدة فورية؟',
    aiHelpSub: 'تحدث مع مساعد السفر الذكي للتعرف على الطرق والأسعار.',
    startChat: 'ابدأ المحادثة',
    explore: 'استكشاف',
    assistant: 'المساعد الذكي',
    taxi: 'أجرة التاكسي',
    transit: 'المواصلات',
    currency: 'الصرافة',
    cityWeather: 'المدن والطقس',
    hotels: 'الفنادق',
    dining: 'المطاعم',
    activities: 'الأنشطة',
    nearMe: 'بالقرب مني',
    emergency: '112 طوارئ'
  },
  ru: {
    heroTitle: 'Путешествуйте по Турции уверенно',
    heroSub: 'Официальные тарифы на такси UKOME, маршруты транспорта и курсы валют.',
    searchPlaceholder: 'Чем вам помочь? (например: такси, метро, аптека)',
    popCities: 'Популярные Города',
    popCitiesSub: 'Самые посещаемые направления Турции',
    viewAll: 'Смотреть все',
    aiHelpTitle: 'Нужна помощь?',
    aiHelpSub: 'Задайте вопрос нашему ИИ-помощнику для проверенных тарифов.',
    startChat: 'Начать чат',
    explore: 'Обзор',
    assistant: 'ИИ Помощник',
    taxi: 'Тариф такси',
    transit: 'Транспорт',
    currency: 'Обмен валют',
    cityWeather: 'Города и погода',
    hotels: 'Отели',
    dining: 'Рестораны',
    activities: 'Активный отдых',
    nearMe: 'Рядом со мной',
    emergency: '112 Экстренно'
  },
  zh: {
    heroTitle: '放心探索土耳其',
    heroSub: '带来源标注的出租车参考价、交通指南、汇率和实用城市信息。',
    searchPlaceholder: '你需要什么帮助？（例如：出租车、地铁、药房）',
    popCities: '热门城市', popCitiesSub: '探索土耳其最受欢迎的目的地', viewAll: '查看全部',
    aiHelpTitle: '需要即时帮助？', aiHelpSub: '询问旅行助手，获取有来源的旅行信息。', startChat: '开始聊天',
    explore: '探索', assistant: '旅行助手', taxi: '出租车费用', transit: '公共交通', currency: '汇率', cityWeather: '城市与天气',
    hotels: '酒店', dining: '餐饮', activities: '活动', nearMe: '附近', emergency: '112 紧急电话'
  }
};

const pageCopy: Record<SupportedLang, Record<string, string>> = {
  es: { more:'Más',safety:'Guía de seguridad',back:'Volver al inicio',taxiTitle:'Calculadora de taxi',taxiSub:'Calcula una estimación según la distancia por carretera y la tarifa de referencia.',origin:'Desde',destination:'Hasta',locate:'Usar mi ubicación',calculate:'Calcular ruta y tarifa',estimate:'Precio estimado',distance:'Distancia por carretera',duration:'Duración estimada',miss:'No te pierdas en',hotelsTitle:'Hoteles',night:'noche',book:'Solicitar estancia',diningTitle:'Restaurantes en Türkiye',hours:'Horario',average:'Promedio',reserve:'Solicitar mesa',activitiesTitle:'Actividades',activitiesSub:'Explora museos, cine, ocio y propuestas para el verano y el invierno.',details:'Información / solicitud',safetySub:'Consejos prácticos para un viaje más seguro y tranquilo.',emergencyTitle:'Emergencias',emergencyText:'En Türkiye, llama al 112 para ambulancias, bomberos y policía.',taxiSafety:'Pide que usen el taxímetro y guarda el recibo.',useful:'Lugares útiles',usefulText:'Encuentra farmacias, comisarías, cajeros y paradas de taxi cercanos.',cityTransport:'Transporte urbano',noTraffic:'No hay datos de tráfico en directo conectados.' },
  en: { more: 'More', safety: 'Safety guide', back: 'Back to home', taxiTitle: 'Taxi fare calculator', taxiSub: 'Estimate the fare with road distance and the dated official municipal tariff.', origin: 'From (origin)', destination: 'To (destination)', locate: 'Use current location', calculate: 'Calculate route & fare', estimate: 'Estimated fare range', distance: 'Road distance', duration: 'Estimated duration', miss: "Don't miss in", hotelsTitle: 'Hotels', night: 'night', book: 'Request stay', diningTitle: 'Restaurants in Türkiye', hours: 'Hours', average: 'Average', reserve: 'Request table', activitiesTitle: 'Activities & tours', activitiesSub: 'Browse museums, cinema, entertainment, summer and winter ideas separately.', details: 'Details / request', safetySub: 'Practical essentials for a safer, calmer trip.', emergencyTitle: 'Emergency', emergencyText: 'Call 112 for ambulance, fire and police emergencies in Türkiye.', taxiSafety: 'Ask for the meter to be used and keep your receipt.', useful: 'Useful places', usefulText: 'Find published pharmacies, police desks, ATMs and taxi ranks nearby.', cityTransport: 'Getting around', noTraffic: 'Live traffic data is not connected; no fixed traffic percentage is shown.' },
  tr: { more: 'Daha fazla', safety: 'Güvenlik rehberi', back: 'Ana sayfaya dön', taxiTitle: 'Taksi ücreti hesaplama', taxiSub: 'Yol mesafesi ve tarihli resmî belediye tarifesiyle tahmini ücret hesaplayın.', origin: 'Nereden', destination: 'Nereye', locate: 'Konumumu kullan', calculate: 'Rota ve ücreti hesapla', estimate: 'Tahmini ücret aralığı', distance: 'Yol mesafesi', duration: 'Tahmini süre', miss: 'Kaçırmayın:', hotelsTitle: 'Oteller', night: 'gece', book: 'Konaklama talebi', diningTitle: 'Türkiye’de restoranlar', hours: 'Saatler', average: 'Ortalama', reserve: 'Masa talebi', activitiesTitle: 'Aktiviteler ve turlar', activitiesSub: 'Müze, sinema, eğlence, yaz ve kış seçeneklerini ayrı inceleyin.', details: 'Bilgi / talep', safetySub: 'Daha güvenli ve sakin bir gezi için temel bilgiler.', emergencyTitle: 'Acil durum', emergencyText: 'Türkiye’de ambulans, itfaiye ve polis için 112’yi arayın.', taxiSafety: 'Taksimetrenin açılmasını isteyin ve fişinizi saklayın.', useful: 'Yararlı yerler', usefulText: 'Yakındaki kayıtlı eczane, polis noktası, ATM ve taksi duraklarını bulun.', cityTransport: 'Şehir içi ulaşım', noTraffic: 'Canlı trafik verisi bağlı değil; sabit trafik yüzdesi gösterilmiyor.' },
  de: { more: 'Mehr', safety: 'Sicherheit', back: 'Zur Startseite', taxiTitle: 'Taxipreis berechnen', taxiSub: 'Schätzung mit Straßenentfernung und datiertem amtlichem Tarif.', origin: 'Von', destination: 'Nach', locate: 'Standort verwenden', calculate: 'Route & Preis berechnen', estimate: 'Geschätzter Preis', distance: 'Straßenentfernung', duration: 'Geschätzte Dauer', miss: 'Nicht verpassen in', hotelsTitle: 'Hotels', night: 'Nacht', book: 'Unterkunft anfragen', diningTitle: 'Restaurants in Türkiye', hours: 'Öffnungszeiten', average: 'Durchschnitt', reserve: 'Tisch anfragen', activitiesTitle: 'Aktivitäten & Touren', activitiesSub: 'Museen, Kino, Unterhaltung sowie Sommer- und Winterideen.', details: 'Details / Anfrage', safetySub: 'Praktische Grundlagen für eine sichere Reise.', emergencyTitle: 'Notfall', emergencyText: 'Rufen Sie in Türkiye für Rettung, Feuerwehr und Polizei 112 an.', taxiSafety: 'Taxameter einschalten lassen und Beleg aufbewahren.', useful: 'Nützliche Orte', usefulText: 'Apotheken, Polizei, Geldautomaten und Taxistände in der Nähe finden.', cityTransport: 'Nahverkehr', noTraffic: 'Keine Live-Verkehrsdaten; es wird kein fester Prozentsatz angezeigt.' },
  fr: { more: 'Plus', safety: 'Sécurité', back: 'Retour à l’accueil', taxiTitle: 'Calcul du tarif taxi', taxiSub: 'Estimation selon la distance routière et le tarif municipal officiel daté.', origin: 'Départ', destination: 'Destination', locate: 'Utiliser ma position', calculate: 'Calculer trajet et tarif', estimate: 'Fourchette estimée', distance: 'Distance routière', duration: 'Durée estimée', miss: 'À ne pas manquer à', hotelsTitle: 'Hôtels', night: 'nuit', book: 'Demander un séjour', diningTitle: 'Restaurants en Türkiye', hours: 'Horaires', average: 'Moyenne', reserve: 'Demander une table', activitiesTitle: 'Activités et visites', activitiesSub: 'Musées, cinéma, loisirs et idées d’été ou d’hiver.', details: 'Détails / demande', safetySub: 'L’essentiel pour un voyage plus serein.', emergencyTitle: 'Urgence', emergencyText: 'Appelez le 112 pour ambulance, pompiers et police en Türkiye.', taxiSafety: 'Demandez le compteur et gardez le reçu.', useful: 'Lieux utiles', usefulText: 'Trouvez pharmacies, police, distributeurs et stations de taxi.', cityTransport: 'Se déplacer', noTraffic: 'Pas de trafic en direct ; aucun pourcentage fixe n’est affiché.' },
  ar: { more: 'المزيد', safety: 'دليل الأمان', back: 'العودة للرئيسية', taxiTitle: 'حاسبة أجرة التاكسي', taxiSub: 'تقدير حسب مسافة الطريق والتعرفة البلدية الرسمية المؤرخة.', origin: 'من', destination: 'إلى', locate: 'استخدم موقعي', calculate: 'احسب الطريق والأجرة', estimate: 'نطاق الأجرة التقديري', distance: 'مسافة الطريق', duration: 'المدة المقدرة', miss: 'لا تفوّت في', hotelsTitle: 'الفنادق', night: 'ليلة', book: 'طلب إقامة', diningTitle: 'مطاعم تركيا', hours: 'الساعات', average: 'المتوسط', reserve: 'طلب طاولة', activitiesTitle: 'الأنشطة والجولات', activitiesSub: 'المتاحف والسينما والترفيه وأنشطة الصيف والشتاء.', details: 'التفاصيل / طلب', safetySub: 'أساسيات عملية لرحلة أكثر أمانًا.', emergencyTitle: 'طوارئ', emergencyText: 'اتصل بـ112 للإسعاف والإطفاء والشرطة في تركيا.', taxiSafety: 'اطلب تشغيل العداد واحتفظ بالإيصال.', useful: 'أماكن مفيدة', usefulText: 'اعثر على الصيدليات والشرطة وأجهزة الصراف ومواقف التاكسي.', cityTransport: 'التنقل في المدينة', noTraffic: 'بيانات المرور المباشرة غير متصلة ولا نعرض نسبة ثابتة.' },
  ru: { more: 'Ещё', safety: 'Безопасность', back: 'На главную', taxiTitle: 'Расчёт стоимости такси', taxiSub: 'Оценка по дорожному расстоянию и датированному муниципальному тарифу.', origin: 'Откуда', destination: 'Куда', locate: 'Моё местоположение', calculate: 'Рассчитать маршрут и цену', estimate: 'Примерная стоимость', distance: 'Расстояние', duration: 'Примерное время', miss: 'Не пропустите в', hotelsTitle: 'Отели', night: 'ночь', book: 'Запросить проживание', diningTitle: 'Рестораны Турции', hours: 'Часы', average: 'Среднее', reserve: 'Запросить столик', activitiesTitle: 'Экскурсии и развлечения', activitiesSub: 'Музеи, кино, развлечения, летние и зимние идеи.', details: 'Подробнее / запрос', safetySub: 'Практические основы безопасной поездки.', emergencyTitle: 'Экстренная помощь', emergencyText: 'В Турции звоните 112 для скорой, пожарной и полиции.', taxiSafety: 'Попросите включить счётчик и сохраните чек.', useful: 'Полезные места', usefulText: 'Найдите аптеки, полицию, банкоматы и стоянки такси.', cityTransport: 'Транспорт', noTraffic: 'Онлайн-данные трафика не подключены; фиксированный процент не показывается.' },
  zh: { more: '更多', safety: '安全指南', back: '返回首页', taxiTitle: '出租车费用计算', taxiSub: '根据道路距离和注明日期的官方市政资费估算。', origin: '出发地', destination: '目的地', locate: '使用当前位置', calculate: '计算路线和费用', estimate: '预计费用范围', distance: '道路距离', duration: '预计时间', miss: '不可错过：', hotelsTitle: '酒店', night: '晚', book: '申请住宿', diningTitle: '土耳其餐厅', hours: '营业时间', average: '平均', reserve: '申请订桌', activitiesTitle: '活动与游览', activitiesSub: '分别浏览博物馆、影院、娱乐以及夏季和冬季活动。', details: '详情 / 申请', safetySub: '让旅程更安全从容的实用基础信息。', emergencyTitle: '紧急情况', emergencyText: '在土耳其需要救护车、消防或警察时拨打112。', taxiSafety: '请司机打表并保留收据。', useful: '实用地点', usefulText: '查找附近公开登记的药房、警察、ATM和出租车站。', cityTransport: '市内交通', noTraffic: '尚未接入实时交通数据，不显示固定拥堵百分比。' },
};

const footerCopy: Record<SupportedLang, { signIn: string; source: string; privacy: string; terms: string; rights: string }> = {
  es: {signIn:'Iniciar sesión',source:'Tarifas de taxi, guías de transporte, tipos de cambio de referencia e información de ciudades con sus fuentes.',privacy:'Política de privacidad',terms:'Condiciones de uso',rights:'Todos los derechos reservados.'},
  en: { signIn: 'Sign in', source: 'Source-labelled taxi tariffs, transit guides, reference rates and city information.', privacy: 'Privacy policy', terms: 'Terms of service', rights: 'All rights reserved.' },
  tr: { signIn: 'Giriş yap', source: 'Kaynağı belirtilmiş taksi tarifeleri, ulaşım rehberleri, referans kurlar ve şehir bilgileri.', privacy: 'Gizlilik politikası', terms: 'Kullanım koşulları', rights: 'Tüm hakları saklıdır.' },
  de: { signIn: 'Anmelden', source: 'Taxitarife, Verkehrshinweise, Referenzkurse und Stadtinformationen mit Quellen.', privacy: 'Datenschutz', terms: 'Nutzungsbedingungen', rights: 'Alle Rechte vorbehalten.' },
  fr: { signIn: 'Se connecter', source: 'Tarifs taxi, guides de transport, cours de référence et informations urbaines avec sources.', privacy: 'Confidentialité', terms: 'Conditions d’utilisation', rights: 'Tous droits réservés.' },
  ar: { signIn: 'تسجيل الدخول', source: 'تعرفات تاكسي وأدلة مواصلات وأسعار مرجعية ومعلومات مدن موثقة بالمصادر.', privacy: 'سياسة الخصوصية', terms: 'شروط الاستخدام', rights: 'جميع الحقوق محفوظة.' },
  ru: { signIn: 'Войти', source: 'Тарифы такси, транспортные справочники, курсы и сведения о городах с указанием источников.', privacy: 'Конфиденциальность', terms: 'Условия использования', rights: 'Все права защищены.' },
  zh: { signIn: '登录', source: '提供标注来源的出租车资费、交通指南、参考汇率和城市信息。', privacy: '隐私政策', terms: '服务条款', rights: '保留所有权利。' },
};

// ============================================================================
// 2. RESMİ TARİFELER & DÖVİZ
// ============================================================================
const citiesDetailedData: Record<string, CityInfo> = {
  'Ankara': {
    name: 'Ankara', tagline: 'Türkiye’s capital: museums, historic streets and parks',
    lat: 39.9334, lng: 32.8597,
    temp: '', weatherDesc: '', humidity: '', wind: '',
    localTip: 'Use Başkent Kart Ulaşım for urban transport. Check EGO for routes and departure times.',
    highlights: [
      { name: 'Anıtkabir', detail: 'Memorial grounds and museum; check visiting hours before travel.' },
      { name: 'Museum of Anatolian Civilizations', detail: 'Archaeological collections near Ankara Castle.' },
      { name: 'Ankara Castle & Hamamönü', detail: 'Historic streets and city views.' },
    ],
  },
  'İstanbul': {
    name: 'İstanbul',
    tagline: 'Bridging continents with vibrant history, ferries and culture',
    lat: 41.0082, lng: 28.9784,
    temp: '25°C',
    weatherDesc: 'Sunny & Pleasant',
    humidity: '58%',
    wind: '18 km/h NE',
    localTip: 'During 17:30 - 20:00, prefer Marmaray or Bosphorus ferries to avoid bridge gridlock.',
    highlights: [
      { name: 'Hagia Sophia & Sultanahmet', detail: 'Historic peninsula essentials; arrive early for shorter queues.' },
      { name: 'Topkapı Palace', detail: 'Allow a half day for the palace, gardens and museum collections.' },
      { name: 'Bosphorus ferries', detail: 'A practical and scenic way to cross between the European and Asian sides.' }
    ]
  },
  'Cappadocia': {
    name: 'Cappadocia (Kapadokya)',
    tagline: 'Fairy chimneys, volcanic valleys and sunrise balloon corridors',
    lat: 38.6431, lng: 34.8289,
    temp: '22°C',
    weatherDesc: 'Clear Sky & Calm',
    humidity: '34%',
    wind: '7 km/h SW',
    localTip: 'Early dawn balloon flights depend on Civil Aviation wind approval checked at 05:00.',
    highlights: [
      { name: 'Göreme Open-Air Museum', detail: 'Rock-cut churches and frescoes; go first thing in the morning.' },
      { name: 'Love & Rose Valleys', detail: 'Plan the walk before the midday sun and take water.' },
      { name: 'Uçhisar Castle', detail: 'Wide valley views from the highest point in the area.' }
    ]
  },
  'Antalya': {
    name: 'Antalya',
    tagline: 'Turquoise Mediterranean shores, waterfalls and Roman ruins',
    lat: 36.8969, lng: 30.7133,
    temp: '30°C',
    weatherDesc: 'Warm & Sunny',
    humidity: '64%',
    wind: '12 km/h S',
    localTip: 'Use AntRay tramway from the airport directly to Hadrian Gate in Kaleiçi.',
    highlights: [
      { name: 'Antalya Museum', detail: 'One of Türkiye’s strongest archaeology collections.' },
      { name: 'Kaleiçi & Hadrian’s Gate', detail: 'Walkable old town lanes, harbour views and Roman history.' },
      { name: 'Düden Waterfalls', detail: 'A short excursion with sea-cliff viewpoints.' }
    ]
  },
  'İzmir': {
    name: 'İzmir',
    tagline: 'Aegean breeze, Kordon promenade, and lively bazaar alleys',
    lat: 38.4237, lng: 27.1428,
    temp: '28°C',
    weatherDesc: 'Breezy & Sunny',
    humidity: '50%',
    wind: '22 km/h W',
    localTip: 'Enjoy the sunset ferry from Alsancak to Karşıyaka with contactless credit card tap.',
    highlights: [
      { name: 'Agora Open Air Museum', detail: 'Roman-era remains beside the historic market district.' },
      { name: 'Kemeraltı Bazaar', detail: 'A lively maze for food, crafts and local shopping.' },
      { name: 'Kordon & ferry line', detail: 'An easy waterfront walk and a useful cross-bay connection.' }
    ]
  }
};

// ============================================================================
// 3. ASLA ÇÖKMEYEN İNTERAKTİF HARİTA (Leaflet CDN)
// ============================================================================

// ============================================================================
// 4. ANA BİLEŞEN
// ============================================================================
export default function App({initialLanguage}:{initialLanguage?:string} = {}) {
  const { session, isStaff, role, signIn,signOut,loading:authLoading } = useSupabaseAuth();
  const mockDataEnabled = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';
  const browserLocation=useBrowserLocation();
  const [browserPath,browserQuery='']=browserLocation.split('?');
  const [adminOpen,setAdminOpen]=useState(false);
  const activeTab:'home'|'city'|Section|'admin'=adminOpen?'admin':browserPath.startsWith('/cities/')?'city':sectionFromPath(browserPath)??'home';
  const selectedCityName=publicCities.find(c=>cityPath(c.name)===browserPath)?.name??publicCities.find(c=>c.slug===new URLSearchParams(browserQuery).get('city'))?.name??'İstanbul';
  const setActiveTab = (tab:typeof activeTab) => {
    setAdminOpen(tab==='admin');
    if(tab==='admin'){if(window.location.hash!=='#admin')window.location.assign('#admin');return;}
    const path=tab==='city'?cityPath(selectedCityName):sectionPath(tab);
    const city=destinationSlug(discoveryCity(browserQuery,selectedCityName));
    const target=tab!=='home'&&tab!=='city'&&city?path+'?city='+city:path;
    navigateTo(target);
  };
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [activeTab]);
  useEffect(() => {
    updateSectionSeo(activeTab, selectedCityName);
    // State-only sections must not retain a detail/city schema or language
    // alternates left by the server document they were opened from.
    if(activeTab!=='city')document.getElementById('public-page-schema')?.remove();
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link=>link.remove());
    const path=activeTab==='city'?cityPath(selectedCityName):sectionPath(activeTab);
    if(activeTab==='city'){
      let schema=document.getElementById('public-page-schema');
      if(!schema){schema=document.createElement('script');schema.id='public-page-schema';schema.setAttribute('type','application/ld+json');document.head.appendChild(schema);}
      schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'TouristDestination',name:selectedCityName,url:`https://www.safeinturkiye.com${path}`});
    }
    document.querySelector('link[rel="canonical"]')?.setAttribute('href',`https://www.safeinturkiye.com${path}`);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content',`https://www.safeinturkiye.com${path}`);
  }, [activeTab, selectedCityName]);
  const [lang, setLang] = useState<SupportedLang>(() => {
    const candidate = initialLanguage || readLanguagePreference();
    return ['en','tr','de','fr','ar','ru','zh','es'].includes(candidate) ? candidate as SupportedLang : 'en';
  });
  const searchQuery=new URLSearchParams(browserQuery).get('q')??'';
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dil Metinleri Helper Fonksiyonu
  const tr = useCallback((k: string) => k === 'assistant' ? ({ es:'Preguntas frecuentes',en: 'Travel FAQ', tr: 'Sık Sorulan Sorular', de: 'Reisefragen', fr: 'Questions fréquentes', ar: 'الأسئلة الشائعة', zh: '常见问题', ru: 'Частые вопросы' }[lang]) : dict[lang]?.[k] || dict.en[k] || k, [lang]);
  const page = useCallback((key: string) => pageCopy[lang]?.[key] ?? pageCopy.en[key] ?? key, [lang]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    saveLanguagePreference(lang);
    updateSectionSeo(activeTab,selectedCityName,lang);
  }, [lang,activeTab,selectedCityName]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  useEffect(() => {
    const openAdmin = () => {
      const open=window.location.hash.split('?')[0]==='#admin';setAdminOpen(open);
      if(open&&!session&&!authLoading)setAuthModalOpen(true);
    };
    openAdmin();
    window.addEventListener('hashchange', openAdmin);
    return () => window.removeEventListener('hashchange', openAdmin);
  }, [session,authLoading]);
  const handleGlobalSearch = (input = searchQuery) => {
    const query = input.trim();
    if (!query) return;
    if(activeTab==='home')navigateTo('/?'+new URLSearchParams({q:query}),{replace:true,scroll:false});
    const newCity=findCityGuide(query);
    if(newCity){openCityGuide(newCity.slug,lang);return;}
    const low = query.toLocaleLowerCase('tr-TR');
    const mentionedCity = publicCities.find(city => city.slug===mentionedSearchCity(query));
    const navigateSearch=(section:Section)=>{const params=new URLSearchParams({q:query});if(mentionedCity)params.set('city',mentionedCity.slug);if(transferIntent(query))params.set('intent','transfer');navigateTo(`${sectionPath(section)}?${params}`);};
    setActivityCategory('All');
    const cityMatch = Object.keys(citiesDetailedData).find(city => city.toLocaleLowerCase('tr-TR') === low || city.toLowerCase().replace(/i̇/g, 'i') === query.toLowerCase());
    if (cityMatch) { navigateTo(cityPath(cityMatch)); return; }
    if (tourIntent(query)) navigateSearch('tours');
    else if (/taksi|taxi|fare|ücret|такси|تاكسي|出租车/.test(low)) navigateSearch('taxi');
    else if (/metro|métro|otobüs|bus|tren|train|vapur|ferry|marmaray|ulaşım|transit|route|rota|bahn|transport|транспорт|метро|автобус|مواصلات|مترو|حافل|地铁|公交|交通|火车/.test(low)) navigateSearch('transit');
    else if (/döviz|kur|exchange|currency|euro|usd|wechsel|change|валют|обмен|صرف|صراف|汇率|换汇/.test(low)) navigateSearch('currency');
    else if (/yakın|near|eczane|pharmacy|hastane|hospital|atm|polis|police|nähe|apotheke|proximité|pharmacie|рядом|аптек|قريب|صيدلي|附近|药房/.test(low)) navigateSearch('nearme');
    else if (/otel|hotel|hôtel|konak|stay|отел|гостиниц|فندق|فنادق|酒店|住宿/.test(low)) navigateSearch('stay');
    else if (/restoran|restaurant|yemek|food|cafe|kafe|ресторан|مطعم|مطاعم|餐厅|餐饮/.test(low)) navigateSearch('food');
    else if (/aktiv|activit|etkinlik|museum|musée|müze|gez|cinema|cinéma|музе|кино|متحف|أنشط|سينما|活动|博物馆|影院/.test(low)) navigateSearch('experiences');
    else if (/güven|safety|acil|emergency|sicher|sécurité|безопас|أمان|طوارئ|安全|紧急/.test(low)) navigateSearch('safety');
    else navigateSearch('assistant');
  };

  // Taksi Durumları
  const [detectedTaxiCity, setDetectedTaxiCity] = useState<string>('');
  const [taxiOriginText, setTaxiOriginText] = useState('');
  const [taxiDestText, setTaxiDestText] = useState('');
  const [taxiOriginCoords, setTaxiOriginCoords] = useState<Coordinates | null>(null);
  const [taxiDestCoords, setTaxiDestCoords] = useState<Coordinates | null>(null);
  const [taxiOriginSuggs, setTaxiOriginSuggs] = useState<GeocodedPlace[]>([]);
  const [taxiDestSuggs, setTaxiDestSuggs] = useState<GeocodedPlace[]>([]);
  const taxiClass = 'Yellow';

  const [isTaxiLocating, setIsTaxiLocating] = useState(false);
  const [isTaxiRouting, setIsTaxiRouting] = useState(false);
  const [taxiRouteError, setTaxiRouteError] = useState<TaxiErrorKey | 'unavailable' | null>(null);
  const [taxiTariffs, setTaxiTariffs] = useState<Record<string, TaxiTariff>>({});
  const referenceTaxiCity = taxiReferenceCity(detectedTaxiCity);

  useEffect(() => {
    setTaxiTariffs({});
    if (!supabaseConfigured || !referenceTaxiCity) return;
    let cancelled = false;
    void getCurrentTaxiTariffs(referenceTaxiCity).then((tariffs) => {
      if (cancelled) return;
      const next: Record<string, TaxiTariff> = {};
      for (const tariff of tariffs) next[tariff.vehicleClass] = { city: tariff.city, openingFare: tariff.openingFare, pricePerKm: tariff.perKm, minimumFare: tariff.minimumFare, waitingFarePerHour: tariff.waitingFare, source: tariff.sourceName + ' · ' + tariff.effectiveFrom, lastUpdated: tariff.lastVerified, sourceUrl:tariff.sourceUrl };
      setTaxiTariffs(next);
    }).catch(() => { if (!cancelled) setTaxiTariffs({}); });
    return () => { cancelled = true; };
  }, [referenceTaxiCity]);

  const [taxiRouteResult, setTaxiRouteResult] = useState<{
    distanceKm: number;
    durationMinutes: number;
    geometry: RouteGeometryPoint[];
    source: string;
  } | null>(null);

  const [fareCalculation, setFareCalculation] = useState<{ amount: number; upper:number; hasRange:boolean; source: string; sourceUrls?:string[]; verified?:boolean } | null>(null);
  const taxiRequest = useRef(0);
  useEffect(() => {
    taxiRequest.current++;
    setFareCalculation(null);
    setTaxiRouteResult(null);
    setIsTaxiRouting(false);
  }, [taxiOriginCoords, taxiDestCoords, taxiClass, detectedTaxiCity]);

  const taxiOriginLookupId = useRef(0);

  useEffect(() => {
    setTaxiOriginSuggs([]);
    if (!taxiOriginText || taxiOriginCoords) {
      setTaxiOriginSuggs([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(taxiSearchUrl(taxiOriginText),{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])});
        if (!res.ok) return;
        const data = await res.json();
        if (!controller.signal.aborted && data.features) {
          setTaxiOriginSuggs(data.features.map((f: any) => ({
            label: [f.properties.name, f.properties.city, f.properties.country].filter(Boolean).join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            city: taxiCityFromAddress(f.properties.countrycode, f.properties.state)
          })));
        }
      } catch {}
    }, 300);
    return () => {clearTimeout(timer);controller.abort();};
  }, [taxiOriginText, taxiOriginCoords]);

  useEffect(() => {
    setTaxiDestSuggs([]);
    if (!taxiDestText || taxiDestCoords) {
      setTaxiDestSuggs([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(taxiSearchUrl(taxiDestText),{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])});
        if (!res.ok) return;
        const data = await res.json();
        if (!controller.signal.aborted && data.features) {
          setTaxiDestSuggs(data.features.map((f: any) => ({
            label: [f.properties.name, f.properties.city, f.properties.country].filter(Boolean).join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            city: f.properties.city || f.properties.state
          })));
        }
      } catch {}
    }, 300);
    return () => {clearTimeout(timer);controller.abort();};
  }, [taxiDestText, taxiDestCoords]);

  const handleTaxiCurrentLocation = () => {
    const lookupId = ++taxiOriginLookupId.current;
    if (!('geolocation' in navigator)) {
      setTaxiRouteError('unsupported');
      return;
    }
    setIsTaxiLocating(true);
    setTaxiRouteError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (lookupId !== taxiOriginLookupId.current) return;
        setIsTaxiLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setTaxiOriginCoords(null);
        setTaxiOriginText(taxiErrorText(lang, 'locating'));
        setDetectedTaxiCity('');

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=16`, {signal: AbortSignal.timeout(8000)});
          if (lookupId !== taxiOriginLookupId.current) return;
          if (res.ok) {
            const data = await res.json();
            if (lookupId !== taxiOriginLookupId.current) return;
            setTaxiOriginText(data.display_name || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
            setTaxiOriginCoords(coords);
            setDetectedTaxiCity(taxiCityFromAddress(data.address?.country_code, data.address?.province ?? data.address?.state));
          } else {
            setTaxiOriginText(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
          }
        } catch {
          if (lookupId !== taxiOriginLookupId.current) return;
          setTaxiOriginText(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        }
      },
      () => {
        if (lookupId !== taxiOriginLookupId.current) return;
        setIsTaxiLocating(false);
        setTaxiRouteError('locationFailed');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCalculateTaxiRoute = async () => {
    const request = ++taxiRequest.current;
    setTaxiRouteError(null);
    setTaxiRouteResult(null);
    setFareCalculation(null);

    if (!taxiOriginCoords || !taxiDestCoords) {
      setTaxiRouteError('missingPlaces');
      return;
    }

    setIsTaxiRouting(true);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${taxiOriginCoords.lng},${taxiOriginCoords.lat};${taxiDestCoords.lng},${taxiDestCoords.lat}?overview=full&geometries=geojson&alternatives=true`;
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (request !== taxiRequest.current) return;
      setIsTaxiRouting(false);

      if (!res.ok) {
        setTaxiRouteError('routeFailed');
        return;
      }

      const data = await res.json();
      if (request !== taxiRequest.current) return;
      if (!data.routes || data.routes.length === 0) {
        setTaxiRouteError('noRoute');
        return;
      }

      const primary = data.routes[0];
      if (!Number.isFinite(primary.distance) || primary.distance <= 0 || !Number.isFinite(primary.duration) || primary.duration < 0) throw new Error('INVALID_ROUTE');
      const distanceKm = primary.distance / 1000;
      const durationMinutes = Math.max(1, Math.round(primary.duration / 60));

      const geometry: RouteGeometryPoint[] = primary.geometry.coordinates.map((coord: [number, number]) => ({
        lat: coord[1],
        lng: coord[0]
      }));

      setTaxiRouteResult({
        distanceKm,
        durationMinutes,
        geometry,
        source: 'OpenStreetMap / OSRM Driving Engine'
      });

      const selectedTariff = taxiTariffs[taxiClass.toUpperCase()];
      const tariff = selectedTariff?.city === referenceTaxiCity ? selectedTariff : undefined;
      if (!tariff) {
        const budget=taxiBudgetRange(referenceTaxiCity,[distanceKm],taxiClass.toUpperCase());
        if(budget){setFareCalculation(budget);setTaxiRouteError(null);setIsTaxiRouting(false);return;}
        setFareCalculation(null);
        setTaxiRouteError('unavailable');
        setIsTaxiRouting(false);
        return;
      }
      setFareCalculation({
        ...routeFareRange([distanceKm], tariff.openingFare, tariff.pricePerKm, tariff.minimumFare),
        source: tariff.city+' · '+taxiClass+' · '+tariff.source+' · '+tariff.lastUpdated,
        sourceUrls:tariff.sourceUrl?[tariff.sourceUrl]:undefined, verified:true,
      });
    } catch {
      if (request !== taxiRequest.current) return;
      setIsTaxiRouting(false);
      setTaxiRouteError('network');
    }
  };

  const [activityCategory, setActivityCategory] = useState('All');

  const regionalCity=cityGuides.find(city=>city.name===selectedCityName);
  const localizedGaziantep = regionalCity?.slug==='gaziantep' ? gaziantepCopy[lang as keyof typeof gaziantepCopy] : undefined;
  const baseCityInfo = regionalCity ? {
    name:regionalCity.name,tagline:localizedGaziantep?.tagline??regionalCity.focus,
    
    lat:regionalCity.lat,lng:regionalCity.lng,
    localTip:regionalDescription(regionalCity, lang),
    highlights:(localizedGaziantep?.places??regionalCity.places).map(name=>({name,detail:''})),
  } : citiesDetailedData[selectedCityName] || citiesDetailedData['İstanbul'];
  const currentCityInfo=lang==='tr'?{...baseCityInfo,...citiesTr[selectedCityName as keyof typeof citiesTr]}:lang==='zh'?{...baseCityInfo,...citiesZh[selectedCityName as keyof typeof citiesZh]}:lang==='es'?{...baseCityInfo,...citiesEs[selectedCityName as keyof typeof citiesEs]}:{...baseCityInfo,...cityLocale(selectedCityName,lang)};

  if (!supabaseConfigured && !mockDataEnabled) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <section className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
          <ShieldCheck className="w-10 h-10 text-[#087FFF] mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900">SafeInTürkiye is not configured</h1>
          <p className="mt-3 text-sm text-slate-600">Set the public Supabase URL and anon key to show verified content. Demo data is disabled by default.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F7FB] text-[#0A2540] font-['Inter',sans-serif] flex flex-col justify-between">

      {/* ====================================================================
          NAVBAR (TAŞMAYI ÖNLEYEN & TÜM SAYFALARI DESTEKLEYEN YAPI)
      ==================================================================== */}
      <div>
        <header className="sticky top-0 z-40 bg-white border-b border-sky-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">

            {/* Logo */}
            <a href="/" onClick={event=>{if(event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();setActiveTab('home');}}} className="flex items-center cursor-pointer shrink-0" aria-label="SafeInTürkiye home">
              <img src={siteLogo} alt="SafeInTürkiye" className="h-7 w-auto max-w-[100px] object-contain sm:h-10 sm:max-w-[185px]" />
            </a>

            {/* Menü Butonları */}
            <nav className="hidden lg:flex items-center gap-1.5 text-[13px] font-bold text-slate-600">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'home' ? 'text-[#087FFF] bg-sky-50 font-extrabold' : 'hover:text-[#087FFF] hover:bg-slate-50'
                }`}
              >
                {tr('explore')}
              </button>

              <button
                onClick={() => setActiveTab('assistant')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-extrabold ${
                  activeTab === 'assistant' ? 'bg-[#087FFF] text-white shadow-sm shadow-sky-500/20' : 'bg-sky-50 text-[#087FFF] hover:bg-sky-100'
                }`}
              >
                <Bot className="w-4 h-4" /> {tr('assistant')}
              </button>

              <button
                onClick={() => setActiveTab('taxi')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'taxi' ? 'text-[#087FFF] bg-sky-50 font-extrabold' : 'hover:text-[#087FFF] hover:bg-slate-50'
                }`}
              >
                {tr('taxi')}
              </button>

              <button
                onClick={() => setActiveTab('transit')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'transit' ? 'text-[#087FFF] bg-sky-50 font-extrabold' : 'hover:text-[#087FFF] hover:bg-slate-50'
                }`}
              >
                {tr('transit')}
              </button>

              <button
                onClick={() => setActiveTab('currency')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'currency' ? 'text-[#087FFF] bg-sky-50 font-extrabold' : 'hover:text-[#087FFF] hover:bg-slate-50'
                }`}
              >
                {tr('currency')}
              </button>

              <button
                onClick={() => navigateTo(cityPath('İstanbul'))}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'city' ? 'text-[#087FFF] bg-sky-50 font-extrabold' : 'hover:text-[#087FFF] hover:bg-slate-50'
                }`}
              >
                {tr('cityWeather')}
              </button>

              {/* Sığmayanlar için "More" Açılır Menüsü */}
              <div className="relative">
                <button
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    ['stay', 'food', 'experiences', 'nearme', 'safety'].includes(activeTab) ? 'text-[#087FFF] bg-sky-50 font-extrabold' : 'hover:text-[#087FFF] hover:bg-slate-50'
                  }`}
                >
                  <span>{page('more')}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {moreDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 flex flex-col space-y-0.5 text-[12px]">
                    <button onClick={() => { setActiveTab('stay'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Hotel className="w-4 h-4 text-[#087FFF]" /> {tr('hotels')}
                    </button>
                    <button onClick={() => { setActiveTab('food'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-[#087FFF]" /> {tr('dining')}
                    </button>
                    <button onClick={() => { setActiveTab('experiences'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#087FFF]" /> {tr('activities')}
                    </button>
                    <button onClick={() => { setActiveTab('tours'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#087FFF]" /> {toursLabel(lang)}
                    </button>
                    <button onClick={() => { setActiveTab('nearme'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Navigation2 className="w-4 h-4 text-[#087FFF]" /> {tr('nearMe')}
                    </button>
                    <button onClick={() => { setActiveTab('safety'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#087FFF]" /> {page('safety')}
                    </button>
                  </div>
                )}
              </div>

              {isStaff && (
                <button onClick={() => setActiveTab('admin')} className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer hover:bg-slate-800">
                  CMS Studio
                </button>
              )}
            </nav>

            {/* Dil ve SOS (112 Acil Arama Aktif) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button type="button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(value => !value)} className="lg:hidden w-9 h-9 rounded-xl bg-sky-50 text-[#087FFF] flex items-center justify-center">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as SupportedLang)}
                aria-label="Language"
                className="h-9 w-[72px] px-1 sm:w-auto sm:px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] sm:text-[12px] font-bold text-slate-700 focus:outline-none cursor-pointer hover:bg-sky-50"
              >
                <option value="en">English (EN)</option>
                <option value="tr">Türkçe (TR)</option>
                <option value="de">Deutsch (DE)</option>
                <option value="fr">Français (FR)</option>
                <option value="ar">العربية (AR)</option>
                <option value="ru">Русский (RU)</option>
                <option value="zh">中文 (简体)</option>
                <option value="es">Español (ES)</option>
              </select>

              <a
                href="tel:112"
                aria-label={`${tr('emergency')} 112`}
                className="flex items-center justify-center gap-1.5 w-9 sm:w-auto sm:px-3.5 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-extrabold shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tr('emergency')}</span>
              </a>
            </div>
          </div>
          {mobileMenuOpen && <nav className="lg:hidden border-t border-sky-100 bg-white px-4 py-3 grid grid-cols-2 gap-2 text-[12px] font-bold">
            {([
              ['assistant', tr('assistant')], ['taxi', tr('taxi')], ['transit', tr('transit')], ['currency', tr('currency')], ['city', tr('cityWeather')], ['nearme', tr('nearMe')], ['stay', tr('hotels')], ['food', tr('dining')], ['experiences', tr('activities')], ['tours',toursLabel(lang)], ['safety', page('safety')],
            ] as const).map(([tab, label]) => <button key={tab} type="button" onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }} className={`rounded-xl px-3 py-2 text-left ${activeTab === tab ? 'bg-sky-50 text-[#087FFF]' : 'bg-slate-50 text-slate-700'}`}>{label}</button>)}
            {isStaff && <button type="button" onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }} className="rounded-xl px-3 py-2 text-left bg-slate-900 text-white">CMS Studio</button>}
          </nav>}
        </header>
        {activeTab!=='home' && activeTab!=='taxi' && <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3"><HomeButton lang={lang} currentPage={({assistant:tr('assistant'),transit:tr('transit'),currency:tr('currency'),city:selectedCityName,nearme:tr('nearMe'),stay:page('hotelsTitle'),food:page('diningTitle'),experiences:page('activitiesTitle'),tours:toursLabel(lang),safety:page('safety'),admin:'CMS Studio'} as Record<string,string>)[activeTab]} onClick={()=>{setActiveTab('home');setMobileMenuOpen(false);window.scrollTo(0,0);}}/></div>}
        {activeTab!=='home'&&activeTab!=='tours'&&searchQuery&&<SearchContext query={searchQuery} city={new URLSearchParams(browserQuery).get('city')??undefined} transfer={new URLSearchParams(browserQuery).get('intent')==='transfer'} lang={lang}/>}

        {/* ====================================================================
            PAGE 1: EXPLORE
        ==================================================================== */}
        {activeTab==='city'&&<SponsoredBusinesses context="city" city={selectedCityName} lang={lang}/>}
        {activeTab === 'home' && <TravelHome
          lang={lang}
          initialQuery={searchQuery}
          cities={publicCities.map(city=>({key:city.name,name:city.name}))}
          onNavigate={setActiveTab}
          onCity={city => navigateTo(cityPath(city))}
          onSearch={query => handleGlobalSearch(query)}
          onCategory={category => { setActivityCategory(category); setActiveTab('experiences'); }}
        />}

        {/* ====================================================================
            PAGE 2: AI TRAVEL ASSISTANT
        ==================================================================== */}
        {activeTab === 'assistant' && <Suspense fallback={<PageLoading lang={lang}/>}><TravelFaq lang={lang} initialQuery={searchQuery} /></Suspense>}

        {/* ====================================================================
            PAGE 3: TAKİ HESAPLAYICI
        ==================================================================== */}
        {activeTab === 'taxi' && (
          <main className="reference-page reference-taxi max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <HomeButton lang={lang} currentPage={page('taxiTitle')} onClick={()=>{setActiveTab('home');setMobileMenuOpen(false);window.scrollTo(0,0);}}/>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{page('taxiTitle')}</h1>
              <p className="text-[13px] text-slate-500">{taxiIntroCopy[lang]}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-sky-100 shadow-sm space-y-4">

                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="taxi-origin" className="text-[12px] font-bold text-slate-700">{page('origin')}</label>
                    <button
                      type="button"
                      onClick={handleTaxiCurrentLocation}
                      disabled={isTaxiLocating}
                      className="text-[11px] font-bold text-[#087FFF] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isTaxiLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation2 className="w-3 h-3" />}
                      {page('locate')}
                    </button>
                  </div>
                  <input
                    id="taxi-origin"
                    type="text"
                    value={taxiOriginText}
                    onChange={(e) => {
                      taxiOriginLookupId.current++;
                      setIsTaxiLocating(false);
                      setTaxiOriginText(e.target.value);
                      setTaxiOriginCoords(null);
                      setDetectedTaxiCity('');
                    }}
                    placeholder={page('origin')}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#087FFF]"
                  />
                  {taxiOriginSuggs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {taxiOriginSuggs.map((s, idx) => (
                        <button type="button"
                          key={idx}
                          onClick={() => {
                            taxiOriginLookupId.current++;
                            setIsTaxiLocating(false);
                            setTaxiOriginText(s.label);
                            setTaxiOriginCoords({ lat: s.lat, lng: s.lng });
                            setTaxiOriginSuggs([]);
                            setDetectedTaxiCity(s.city || '');
                          }}
                          className="w-full text-left p-2.5 hover:bg-sky-50 cursor-pointer text-[12px] text-slate-700 border-b border-slate-100 last:border-none"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#087FFF] inline mr-1.5" />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="taxi-destination" className="text-[12px] font-bold text-slate-700 block mb-1">{page('destination')}</label>
                  <input
                    id="taxi-destination"
                    type="text"
                    value={taxiDestText}
                    onChange={(e) => {
                      setTaxiDestText(e.target.value);
                      setTaxiDestCoords(null);
                    }}
                    placeholder={page('destination')}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#087FFF]"
                  />
                  {taxiDestSuggs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {taxiDestSuggs.map((s, idx) => (
                        <button type="button"
                          key={idx}
                          onClick={() => {
                            setTaxiDestText(s.label);
                            setTaxiDestCoords({ lat: s.lat, lng: s.lng });
                            setTaxiDestSuggs([]);
                          }}
                          className="w-full text-left p-2.5 hover:bg-sky-50 cursor-pointer text-[12px] text-slate-700 border-b border-slate-100 last:border-none"
                        >
                          <MapPin className="w-3.5 h-3.5 text-red-500 inline mr-1.5" />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCalculateTaxiRoute}
                  disabled={isTaxiRouting}
                  className="w-full h-11 bg-[#087FFF] hover:bg-[#0284C7] text-white font-bold rounded-xl text-[13px] shadow-sm cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  {isTaxiRouting ? <Loader2 className="w-4 h-4 animate-spin" /> : page('calculate')}
                </button>

                {taxiRouteError && <p role={taxiRouteError === 'unavailable' ? 'status' : 'alert'} className="text-sm text-slate-700 bg-sky-50 rounded-xl p-3">{taxiRouteError === 'unavailable' ? taxiUnavailableText(lang) : taxiErrorText(lang, taxiRouteError)}</p>}
                {taxiRouteResult && !fareCalculation && <div className="grid grid-cols-2 gap-2 rounded-xl bg-sky-50 p-3 text-sm" aria-live="polite"><p>{page('distance')}<br /><strong>{taxiRouteResult.distanceKm.toLocaleString(lang,{maximumFractionDigits:1})} km</strong></p><p>{page('duration')}<br /><strong>~{taxiRouteResult.durationMinutes} min</strong></p></div>}
                {taxiRouteResult && <details className="text-sm leading-relaxed text-slate-600"><summary className="min-h-11 cursor-pointer">{taxiDetailsCopy[lang][0]}</summary><p>{taxiCalculationMapNotice[lang]}</p></details>}
                {taxiRouteResult && fareCalculation && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 space-y-2">
                      <div className="reference-estimate-title"><span>{taxiEstimateCopy[lang][0]}</span><span aria-hidden="true">🚕</span></div>
                      <span className="text-3xl font-black text-slate-900">
                        {taxiDetailsCopy[lang][1]} ₺{(fareCalculation.hasRange?Math.floor(fareCalculation.amount):Math.round(fareCalculation.amount)).toLocaleString(lang)}{fareCalculation.hasRange?` – ₺${Math.ceil(fareCalculation.upper).toLocaleString(lang)}`:''}
                      </span>
                      <span className="text-[11px] text-slate-500 block">{taxiEstimateCopy[lang][1]}</span>
                      <details className="text-xs text-slate-500"><summary className="cursor-pointer min-h-8">{taxiDetailsCopy[lang][0]}</summary><p>{fareCalculation.source}</p>{fareCalculation.sourceUrls?.map((url)=><a key={url} className="block underline py-1" href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname} ↗</a>)}<p>{fareCalculation.verified?taxiDetailsCopy[lang][2]:taxiBudgetCopy[lang]}</p></details>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-200/60 text-[12px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{page('distance')}</span>
                          <span className="font-bold text-slate-800">{taxiRouteResult.distanceKm.toLocaleString(lang,{maximumFractionDigits:1})} km</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">{page('duration')}</span>
                          <span className="font-bold text-slate-800">~{taxiRouteResult.durationMinutes} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 h-[360px] sm:h-[480px] lg:h-auto">
                <Suspense fallback={<PageLoading lang={lang}/>}>
                <SafeRouteMap
                  title={dict[lang].taxi}
                  originCoords={taxiOriginCoords}
                  destCoords={taxiDestCoords}
                  geometry={taxiRouteResult ? taxiRouteResult.geometry : null}
                  color="#087FFF"
                />
                </Suspense>
              </div>
            </div>
            <aside className="catalog-editorial-note"><a className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#087FFF] px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700" href="https://www.bitaksi.com/home" target="_blank" rel="noopener noreferrer">🚕 {directoryText(lang, 3)} ↗</a><p className="mt-2">{directoryText(lang, 4)}</p></aside>

          </main>
        )}

        {/* ====================================================================
            PAGE 4: TOPLU TAŞIMA (TRANSIT - DÜZELTİLDİ VE AKTİF)
        ==================================================================== */}
        {activeTab === 'transit' && <Suspense fallback={<PageLoading lang={lang}/>}><TransitPlanner lang={lang} initialCity={selectedCityName} /></Suspense>}

        {/* ====================================================================
            PAGE 5: EXCHANGE (CANLI KURLAR + YAKINLARDAKİ DÖVİZCİLER - DÜZELTİLDİ)
        ==================================================================== */}
        {activeTab === 'currency' && (
          <main className="reference-page max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <h1 className="text-3xl font-extrabold text-slate-900">{({ es:'Divisas y casas de cambio', en: 'Currency and exchange bureaux', tr: 'Döviz ve döviz büroları', de: 'Wechselkurse und Wechselstuben', fr: 'Change et bureaux de change', ar: 'العملات ومكاتب الصرافة', ru: 'Валюта и обменные пункты', zh: '汇率与附近兑换点' } as Record<SupportedLang, string>)[lang]}</h1>
            <CurrencyRates lang={lang} />
            <NearbyPlaces kind="exchange" lang={lang} center={{ lat: currentCityInfo.lat, lng: currentCityInfo.lng }} cityName={currentCityInfo.name} />
          </main>
        )}

        {/* ====================================================================
            PAGE 6: CITIES & WEATHER
        ==================================================================== */}
        {activeTab === 'city' && (
          <main className="reference-page reference-city max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[...['İstanbul', 'Ankara', 'Cappadocia', 'Antalya', 'İzmir'],...cityGuides.map(city=>city.name)].map((cname) => (
                <button
                  key={cname}
                  onClick={() => navigateTo(cityPath(cname))}
                  className={`px-4 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all ${
                    selectedCityName === cname ? 'bg-[#087FFF] text-white shadow-sm' : 'bg-white border border-sky-100 text-slate-600 hover:bg-sky-50'
                  }`}
                >
                  {cityDisplayName(cname,lang)}
                </button>
              ))}
            </div>

            <div className="city-photo-banner relative rounded-3xl overflow-hidden shadow-md flex items-end p-6 text-white">
              <CityArtwork city={selectedCityName} lang={lang} hero className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="relative z-10">
                <h1 className="text-3xl font-black">{cityDisplayName(currentCityInfo.name,lang)}</h1>
                <p className="text-[13px] text-slate-200">{currentCityInfo.tagline}</p>
              </div>
            </div>

            <nav className="reference-city-nav" aria-label={currentCityInfo.name}>
 {([{tab:'experiences',label:tr('activities'),icon:'🎟️'},{tab:'stay',label:tr('hotels'),icon:'🛏️'},{tab:'food',label:tr('dining'),icon:'🍽️'},{tab:'tours',label:toursLabel(lang),icon:'🧭'},{tab:'transit',label:tr('transit'),icon:'🚇'},{tab:'safety',label:page('safety'),icon:'🛡️'}] as const).map(item=><button key={item.tab} onClick={()=>setActiveTab(item.tab)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
 </nav>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <WeatherCard lat={currentCityInfo.lat} lng={currentCityInfo.lng} cityName={currentCityInfo.name} lang={lang} />
              <div className="p-5 bg-white rounded-2xl border border-sky-100 shadow-sm space-y-3">
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">{page('cityTransport')}</span>
                <p className="text-sm text-slate-700">{cityTransportText(selectedCityName,lang,currentCityInfo.localTip)}</p>
                <p className="text-xs text-slate-500">{page('noTraffic')}</p>
                <button onClick={() => setActiveTab('transit')} className="px-4 py-2 bg-sky-50 text-sky-800 rounded-xl text-sm font-bold">{tr('transit')}</button>
              </div>
            </div>

            <section className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-[#087FFF]" />
                <h2 className="font-extrabold text-[16px] text-slate-900">{page('miss')} {currentCityInfo.name}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentCityInfo.highlights.map((highlight) => (
                  <article key={highlight.name} className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100">
                    <h3 className="text-[13px] font-extrabold text-slate-900">{highlight.name}</h3>
                    <p className="text-[11px] leading-relaxed text-slate-600 mt-1">{highlight.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <Suspense fallback={<PageLoading lang={lang}/>}><TransportCardGuide city={selectedCityName} lang={lang} /><FirstVisitPlan city={selectedCityName} lang={lang}/></Suspense>

          </main>
        )}

        {/* ====================================================================
            PAGE 7: OTELLER (HOTELS)
        ==================================================================== */}
        {activeTab === 'stay' && (
          <main className="travel-catalog">
            <h1 className="text-3xl font-extrabold text-slate-900">{page('hotelsTitle')}</h1>

            <NearbyPlaces key="hotels-discovery" kind="essential" fixedCategory="hotel" lang={lang} center={{lat:currentCityInfo.lat,lng:currentCityInfo.lng}} cityName={currentCityInfo.name} />
          </main>
        )}

        {/* ====================================================================
            PAGE 8: YEME & İÇME (DINING)
        ==================================================================== */}
        {activeTab === 'food' && (
          <main className="travel-catalog">
            <h1 className="text-3xl font-extrabold text-slate-900">{page('diningTitle')}</h1>
            <NearbyPlaces key="restaurants-discovery" kind="essential" fixedCategory="restaurant" lang={lang} center={{lat:currentCityInfo.lat,lng:currentCityInfo.lng}} cityName={currentCityInfo.name} />
          </main>
        )}

        {/* ====================================================================
            PAGE 9: AKTİVİTELER (ACTIVITIES)
        ==================================================================== */}
        {activeTab === 'experiences' && (
          <main className="travel-catalog">
            <div><h1 className="text-3xl font-extrabold text-slate-900">{page('activitiesTitle')}</h1><p className="mt-1 text-sm text-slate-600">{page('activitiesSub')}</p></div>

            <NearbyPlaces key="activities-discovery" kind="essential" fixedCategory="activity" initialCategory={activityCategory === 'Cinema' ? 'cinema' : activityCategory === 'Museum & Culture' ? 'museum' : activityCategory === 'Entertainment' ? 'entertainment' : 'activity'} lang={lang} center={{lat:currentCityInfo.lat,lng:currentCityInfo.lng}} cityName={currentCityInfo.name} />
          </main>
        )}

        {activeTab === 'tours' && <main className="travel-catalog"><Suspense fallback={<PageLoading lang={lang}/>}><ViatorTours key={`${lang}:${browserQuery}`} lang={lang} initialQuery={searchQuery} initialCity={publicCities.find(c=>c.slug===new URLSearchParams(browserQuery).get('city'))?.slug??publicCities.find(c=>c.name===selectedCityName)?.slug}/></Suspense></main>}

        {/* ====================================================================
            PAGE 10: NEAR ME
        ==================================================================== */}
        {activeTab === 'nearme' && (
          <main className="reference-page max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <h1 className="text-3xl font-extrabold text-slate-900">{tr('nearMe')}</h1>
            <NearbyPlaces kind="essential" lang={lang} center={{ lat: currentCityInfo.lat, lng: currentCityInfo.lng }} cityName={currentCityInfo.name} />
          </main>
        )}

        {/* ====================================================================
            PAGE 10B: SAFETY — SEPARATE FROM STAY / ACTIVITIES
        ==================================================================== */}
        {activeTab === 'safety' && (
          <main className="reference-page reference-safety max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">{page('safety')}</h1>
              <p className="text-[13px] text-slate-500">{page('safetySub')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '🚨', title: page('emergencyTitle'), detail: page('emergencyText'), action: '112', href: 'tel:112' },
                { icon: '🚕', title: tr('taxi'), detail: page('taxiSafety'), action: tr('taxi'), tab: 'taxi' },
                { icon: '📍', title: page('useful'), detail: page('usefulText'), action: tr('nearMe'), tab: 'nearme' }
              ].map((item) => (
                <article key={item.title} className="p-5 bg-white border border-sky-100 rounded-2xl shadow-sm space-y-3">
                  <span className="reference-emoji" aria-hidden="true">{item.icon}</span>
                  <h2 className="font-extrabold text-slate-900">{item.title}</h2>
                  <p className="text-[12px] leading-relaxed text-slate-600">{item.detail}</p>
                  {item.href ? <a href={item.href} className="inline-flex px-3 py-2 rounded-xl bg-red-600 text-white text-[12px] font-bold">{item.action}</a> : <button onClick={() => setActiveTab(item.tab as 'taxi' | 'nearme')} className="px-3 py-2 rounded-xl bg-[#087FFF] text-white text-[12px] font-bold cursor-pointer">{item.action}</button>}
                </article>
              ))}
            </div>
            <SafetyTips lang={lang} />
         </main>
        )}

        {/* ====================================================================
            PAGE 11: ROLE-PROTECTED ADMIN CMS
        ==================================================================== */}
        {activeTab === 'admin' && authLoading && <PageLoading lang={lang}/>}
        {activeTab === 'admin' && isStaff && <Suspense fallback={<PageLoading lang={lang}/>}><ContentAdmin role={role} onSignOut={signOut}/></Suspense>}
        {activeTab === 'admin' && !authLoading && !isStaff && <main className="max-w-xl mx-auto p-6 my-8 rounded-2xl bg-white border border-sky-100 space-y-4"><h1 className="text-xl font-bold">{authCopy[lang][0]}</h1><p>{authCopy[lang][session?8:1]}</p>{!session && <button onClick={() => setAuthModalOpen(true)} className="bg-sky-600 text-white rounded-xl px-5 py-3">{footerCopy[lang].signIn}</button>}</main>}

      </div>

      {authModalOpen && (
        <AccessibleDialog label={authCopy[lang][0]} onClose={()=>setAuthModalOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#087FFF] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-[17px] text-slate-900">{footerCopy[lang].signIn}</h3>
              <p className="text-[12px] text-slate-500">{authCopy[lang][1]}</p>
            </div>
            <input
              type="email" aria-label={authCopy[lang][2]} autoComplete="username" autoFocus value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder={authCopy[lang][2]}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-[#087FFF]"
            />
            <input type="password" aria-label={authCopy[lang][3]} autoComplete="current-password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder={authCopy[lang][3]} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-[#087FFF]" />
            {authError && <p className="text-[12px] text-red-600">{authError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setAuthModalOpen(false)} className="flex-1 h-11 bg-slate-100 text-slate-600 font-bold rounded-xl text-[12px]">{authCopy[lang][4]}</button>
              <button
                disabled={authBusy}
                onClick={async () => {
                  if (authBusy) return;
                  if (!supabaseConfigured) { setAuthError(authCopy[lang][6]); return; }
                  setAuthBusy(true); setAuthError(null);
                  try {
                  const result = await signIn(authEmail, authPassword);
                  if (result?.error) {
                    setAuthError(result.error.code==='invalid_credentials'?authCopy[lang][7]:authCopy[lang][6]);
                    return;
                  }
                  setAuthModalOpen(false); setAuthError(null);
                  setAuthPassword('');
                  } catch { setAuthError(authCopy[lang][6]); }
                  finally { setAuthBusy(false); }
                }}
                className="flex-1 h-11 bg-[#087FFF] hover:bg-[#0284C7] text-white font-bold rounded-xl text-[12px]"
              >
                {authBusy ? authCopy[lang][5] : footerCopy[lang].signIn}
              </button>
            </div>
          </div>
        </AccessibleDialog>
      )}

      {/* FOOTER */}
      <footer className="border-t border-sky-100 bg-white py-6 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-slate-500">
          <div className="space-y-0.5 text-center sm:text-left">
            <div className="font-bold text-[#0A2540] flex items-center gap-1.5 justify-center sm:justify-start">
              SafeInTürkiye 2026
              <button onClick={() => isStaff?setActiveTab('admin'):setAuthModalOpen(true)} title={isStaff?'CMS Studio':footerCopy[lang].signIn} className="text-slate-300 hover:text-[#087FFF] cursor-pointer">
                <Lock className="w-3 h-3" />
              </button>
            </div>
            <img src={siteLogo} alt="SafeInTürkiye" className="w-48 h-auto object-contain mx-auto sm:mx-0 my-3" />
            <p>{footerCopy[lang].source}</p><PhotoCredits lang={lang} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-[#0064b7]">
            <a href="/privacy" className="underline">{footerCopy[lang].privacy}</a>
            <span>•</span>
            <a href="/terms" className="underline">{footerCopy[lang].terms}</a>
            <a href="/about" className="underline">{siteInformation[lang].labels[2]}</a>
            <a href="/contact" className="underline">{siteInformation[lang].labels[3]}</a>
            <span>•</span>
            <span>{footerCopy[lang].rights}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
