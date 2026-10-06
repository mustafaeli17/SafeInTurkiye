import { officialLinks, directoryText, sourcedActivities, cityPhotos } from './lib/visitorDirectory';
import { openDirectoryEntry, registerPublishedEntry, photoCuratedCatalog } from './lib/directory';
import { curatedDirectory as directoryRecords } from './lib/directory';
import cityGuides from './data/cityGuides.json';
import {cityPath} from './lib/publicRoutes';
import citiesZh from './data/citiesZh.json';
import cityImages from './lib/placePhotos.json';
import { findCityGuide, openCityGuide } from './lib/cityNavigation';
import HomeButton from './components/HomeButton';
import { getPublishedContent } from './repositories/contentRepository';
import { detailLabel, hotelSummary } from './lib/directoryLabels';
import { taxiCityFromAddress, taxiReferenceCity, taxiUnavailableText } from './lib/taxiCity';
import PlacePhoto, { PhotoCredits } from './components/PlacePhoto';
import { updateSectionSeo } from './lib/seo';
import SafetyTips from './components/SafetyTips';
import CatalogFilters from './components/CatalogFilters';
import { matchesCatalog, normalizeSearch, localDate } from './lib/catalog';
import { bookingText } from './lib/bookingCopy';
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import {
  Search,
  MapPin,
  Car,
  Coins,
  ShieldCheck,
  Compass,
  PhoneCall,
  X,
  Train,
  Check,
  Building2,
  Utensils,
  Navigation2,
  Bot,
  User,
  Pill,
  Shield,
  BookmarkPlus,
  Trash2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sun,
  Sparkles,
  Ticket,
  Send,
  Hotel,
  Coffee,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Plus,
  Edit3,
  Wind,
  Droplets,
  AlertTriangle,
  Clock,
  Lock,
  SlidersHorizontal,
  DollarSign,
  Image as ImageIcon,
  Calendar,
  Download,
  Share2,
  MessageSquare,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu
} from 'lucide-react';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { createBooking } from './repositories/bookingRepository';
import { getCurrentTaxiTariffs } from './repositories/tariffRepository';
import { routeFareRange } from './lib/taxiCalculation';
import { taxiBudgetRange } from './lib/taxiBudget';
import { taxiSearchUrl } from './lib/taxiSearch';
import { taxiEstimateCopy, taxiDetailsCopy, taxiBudgetCopy, taxiIntroCopy } from './lib/taxiCopy';
import { taxiErrorText, type TaxiErrorKey } from './lib/taxiErrors';
import { regionalDescription } from './lib/regionalDescription';
import { getAssistantReply } from './services/travelDataService';
import { supabaseConfigured } from './lib/supabase';
import { WeatherCard } from './components/WeatherCard';
import CurrencyRates from './components/CurrencyRates';
import NearbyPlaces from './components/NearbyPlaces';
const TransitPlanner = lazy(()=>import('./components/TransitPlanner'));
import TravelFaq, { TransportCardGuide } from './components/TravelFaq';
const ContentAdmin = lazy(()=>import('./components/ContentAdmin'));
import TravelHome from './components/TravelHome';
import { activityLabel, activityText, activityContent } from './lib/activityLabels';
import siteLogo from './assets/safeinturkiye-logo.png';

// ============================================================================
// 1. TİP TANIMLARI & 6 DİLLİ SÖZLÜK SİSTEMİ
// ============================================================================
type SupportedLang = 'en' | 'tr' | 'de' | 'fr' | 'ar' | 'ru' | 'zh';

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

interface TransitStep {
  type: 'walk' | 'metro' | 'marmaray' | 'tram' | 'bus' | 'ferry' | 'metrobus';
  lineName: string;
  instruction: string;
  durationMins: number;
  stopsCount?: number;
  frequency?: string;
  firstTrip?: string;
  lastTrip?: string;
}

interface TransitRouteOption {
  id: string;
  title: string;
  totalDurationMins: number;
  fareTRY: number;
  transfersCount: number;
  steps: TransitStep[];
  geometry: RouteGeometryPoint[];
}

interface CityInfo {
  name: string;
  tagline: string;
  coverImage: string;
  lat: number;
  lng: number;
  temp: string;
  weatherDesc: string;
  humidity: string;
  wind: string;
  localTip: string;
  highlights: { name: string; detail: string }[];
}


interface ExchangeQuote {
  pair: string;
  rate: number;
}

interface NearbyPlace {
  id: string;
  name: string;
  dist: string;
  addr: string;
  cat: string;
  phone: string;
  website?: string;
}

interface TaxiTariff {
  city: string;
  openingFare: number;
  pricePerKm: number;
  minimumFare: number;
  waitingFarePerHour: number;
  source: string;
  lastUpdated: string;
}


// Tam Çalışan Çeviri Sözlüğü
const dict: Record<SupportedLang, Record<string, string>> = {
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
  en: { more: 'More', safety: 'Safety guide', back: 'Back to home', taxiTitle: 'Taxi fare calculator', taxiSub: 'Estimate the fare with road distance and the dated official municipal tariff.', origin: 'From (origin)', destination: 'To (destination)', locate: 'Use current location', calculate: 'Calculate route & fare', estimate: 'Estimated fare range', distance: 'Road distance', duration: 'Estimated duration', miss: "Don't miss in", hotelsTitle: 'Hotels', night: 'night', book: 'Request stay', diningTitle: 'Restaurants in Türkiye', hours: 'Hours', average: 'Average', reserve: 'Request table', activitiesTitle: 'Activities & tours', activitiesSub: 'Browse museums, cinema, entertainment, summer and winter ideas separately.', details: 'Details / request', safetySub: 'Practical essentials for a safer, calmer trip.', emergencyTitle: 'Emergency', emergencyText: 'Call 112 for ambulance, fire and police emergencies in Türkiye.', taxiSafety: 'Ask for the meter to be used and keep your receipt.', useful: 'Useful places', usefulText: 'Find published pharmacies, police desks, ATMs and taxi ranks nearby.', cityTransport: 'Getting around', noTraffic: 'Live traffic data is not connected; no fixed traffic percentage is shown.' },
  tr: { more: 'Daha fazla', safety: 'Güvenlik rehberi', back: 'Ana sayfaya dön', taxiTitle: 'Taksi ücreti hesaplama', taxiSub: 'Yol mesafesi ve tarihli resmî belediye tarifesiyle tahmini ücret hesaplayın.', origin: 'Nereden', destination: 'Nereye', locate: 'Konumumu kullan', calculate: 'Rota ve ücreti hesapla', estimate: 'Tahmini ücret aralığı', distance: 'Yol mesafesi', duration: 'Tahmini süre', miss: 'Kaçırmayın:', hotelsTitle: 'Oteller', night: 'gece', book: 'Konaklama talebi', diningTitle: 'Türkiye’de restoranlar', hours: 'Saatler', average: 'Ortalama', reserve: 'Masa talebi', activitiesTitle: 'Aktiviteler ve turlar', activitiesSub: 'Müze, sinema, eğlence, yaz ve kış seçeneklerini ayrı inceleyin.', details: 'Bilgi / talep', safetySub: 'Daha güvenli ve sakin bir gezi için temel bilgiler.', emergencyTitle: 'Acil durum', emergencyText: 'Türkiye’de ambulans, itfaiye ve polis için 112’yi arayın.', taxiSafety: 'Taksimetrenin açılmasını isteyin ve fişinizi saklayın.', useful: 'Yararlı yerler', usefulText: 'Yakındaki kayıtlı eczane, polis noktası, ATM ve taksi duraklarını bulun.', cityTransport: 'Şehir içi ulaşım', noTraffic: 'Canlı trafik verisi bağlı değil; sabit trafik yüzdesi gösterilmiyor.' },
  de: { more: 'Mehr', safety: 'Sicherheit', back: 'Zur Startseite', taxiTitle: 'Taxipreis berechnen', taxiSub: 'Schätzung mit Straßenentfernung und datiertem amtlichem Tarif.', origin: 'Von', destination: 'Nach', locate: 'Standort verwenden', calculate: 'Route & Preis berechnen', estimate: 'Geschätzter Preis', distance: 'Straßenentfernung', duration: 'Geschätzte Dauer', miss: 'Nicht verpassen in', hotelsTitle: 'Hotels', night: 'Nacht', book: 'Unterkunft anfragen', diningTitle: 'Restaurants in Türkiye', hours: 'Öffnungszeiten', average: 'Durchschnitt', reserve: 'Tisch anfragen', activitiesTitle: 'Aktivitäten & Touren', activitiesSub: 'Museen, Kino, Unterhaltung sowie Sommer- und Winterideen.', details: 'Details / Anfrage', safetySub: 'Praktische Grundlagen für eine sichere Reise.', emergencyTitle: 'Notfall', emergencyText: 'Rufen Sie in Türkiye für Rettung, Feuerwehr und Polizei 112 an.', taxiSafety: 'Taxameter einschalten lassen und Beleg aufbewahren.', useful: 'Nützliche Orte', usefulText: 'Apotheken, Polizei, Geldautomaten und Taxistände in der Nähe finden.', cityTransport: 'Nahverkehr', noTraffic: 'Keine Live-Verkehrsdaten; es wird kein fester Prozentsatz angezeigt.' },
  fr: { more: 'Plus', safety: 'Sécurité', back: 'Retour à l’accueil', taxiTitle: 'Calcul du tarif taxi', taxiSub: 'Estimation selon la distance routière et le tarif municipal officiel daté.', origin: 'Départ', destination: 'Destination', locate: 'Utiliser ma position', calculate: 'Calculer trajet et tarif', estimate: 'Fourchette estimée', distance: 'Distance routière', duration: 'Durée estimée', miss: 'À ne pas manquer à', hotelsTitle: 'Hôtels', night: 'nuit', book: 'Demander un séjour', diningTitle: 'Restaurants en Türkiye', hours: 'Horaires', average: 'Moyenne', reserve: 'Demander une table', activitiesTitle: 'Activités et visites', activitiesSub: 'Musées, cinéma, loisirs et idées d’été ou d’hiver.', details: 'Détails / demande', safetySub: 'L’essentiel pour un voyage plus serein.', emergencyTitle: 'Urgence', emergencyText: 'Appelez le 112 pour ambulance, pompiers et police en Türkiye.', taxiSafety: 'Demandez le compteur et gardez le reçu.', useful: 'Lieux utiles', usefulText: 'Trouvez pharmacies, police, distributeurs et stations de taxi.', cityTransport: 'Se déplacer', noTraffic: 'Pas de trafic en direct ; aucun pourcentage fixe n’est affiché.' },
  ar: { more: 'المزيد', safety: 'دليل الأمان', back: 'العودة للرئيسية', taxiTitle: 'حاسبة أجرة التاكسي', taxiSub: 'تقدير حسب مسافة الطريق والتعرفة البلدية الرسمية المؤرخة.', origin: 'من', destination: 'إلى', locate: 'استخدم موقعي', calculate: 'احسب الطريق والأجرة', estimate: 'نطاق الأجرة التقديري', distance: 'مسافة الطريق', duration: 'المدة المقدرة', miss: 'لا تفوّت في', hotelsTitle: 'الفنادق', night: 'ليلة', book: 'طلب إقامة', diningTitle: 'مطاعم تركيا', hours: 'الساعات', average: 'المتوسط', reserve: 'طلب طاولة', activitiesTitle: 'الأنشطة والجولات', activitiesSub: 'المتاحف والسينما والترفيه وأنشطة الصيف والشتاء.', details: 'التفاصيل / طلب', safetySub: 'أساسيات عملية لرحلة أكثر أمانًا.', emergencyTitle: 'طوارئ', emergencyText: 'اتصل بـ112 للإسعاف والإطفاء والشرطة في تركيا.', taxiSafety: 'اطلب تشغيل العداد واحتفظ بالإيصال.', useful: 'أماكن مفيدة', usefulText: 'اعثر على الصيدليات والشرطة وأجهزة الصراف ومواقف التاكسي.', cityTransport: 'التنقل في المدينة', noTraffic: 'بيانات المرور المباشرة غير متصلة ولا نعرض نسبة ثابتة.' },
  ru: { more: 'Ещё', safety: 'Безопасность', back: 'На главную', taxiTitle: 'Расчёт стоимости такси', taxiSub: 'Оценка по дорожному расстоянию и датированному муниципальному тарифу.', origin: 'Откуда', destination: 'Куда', locate: 'Моё местоположение', calculate: 'Рассчитать маршрут и цену', estimate: 'Примерная стоимость', distance: 'Расстояние', duration: 'Примерное время', miss: 'Не пропустите в', hotelsTitle: 'Отели', night: 'ночь', book: 'Запросить проживание', diningTitle: 'Рестораны Турции', hours: 'Часы', average: 'Среднее', reserve: 'Запросить столик', activitiesTitle: 'Экскурсии и развлечения', activitiesSub: 'Музеи, кино, развлечения, летние и зимние идеи.', details: 'Подробнее / запрос', safetySub: 'Практические основы безопасной поездки.', emergencyTitle: 'Экстренная помощь', emergencyText: 'В Турции звоните 112 для скорой, пожарной и полиции.', taxiSafety: 'Попросите включить счётчик и сохраните чек.', useful: 'Полезные места', usefulText: 'Найдите аптеки, полицию, банкоматы и стоянки такси.', cityTransport: 'Транспорт', noTraffic: 'Онлайн-данные трафика не подключены; фиксированный процент не показывается.' },
  zh: { more: '更多', safety: '安全指南', back: '返回首页', taxiTitle: '出租车费用计算', taxiSub: '根据道路距离和注明日期的官方市政资费估算。', origin: '出发地', destination: '目的地', locate: '使用当前位置', calculate: '计算路线和费用', estimate: '预计费用范围', distance: '道路距离', duration: '预计时间', miss: '不可错过：', hotelsTitle: '酒店', night: '晚', book: '申请住宿', diningTitle: '土耳其餐厅', hours: '营业时间', average: '平均', reserve: '申请订桌', activitiesTitle: '活动与游览', activitiesSub: '分别浏览博物馆、影院、娱乐以及夏季和冬季活动。', details: '详情 / 申请', safetySub: '让旅程更安全从容的实用基础信息。', emergencyTitle: '紧急情况', emergencyText: '在土耳其需要救护车、消防或警察时拨打112。', taxiSafety: '请司机打表并保留收据。', useful: '实用地点', usefulText: '查找附近公开登记的药房、警察、ATM和出租车站。', cityTransport: '市内交通', noTraffic: '尚未接入实时交通数据，不显示固定拥堵百分比。' },
};

const footerCopy: Record<SupportedLang, { signIn: string; source: string; privacy: string; terms: string; rights: string }> = {
  en: { signIn: 'Sign in', source: 'Source-labelled taxi tariffs, transit guides, reference rates and city information.', privacy: 'Privacy policy', terms: 'Terms of service', rights: 'All rights reserved.' },
  tr: { signIn: 'Giriş yap', source: 'Kaynağı belirtilmiş taksi tarifeleri, ulaşım rehberleri, referans kurlar ve şehir bilgileri.', privacy: 'Gizlilik politikası', terms: 'Kullanım koşulları', rights: 'Tüm hakları saklıdır.' },
  de: { signIn: 'Anmelden', source: 'Taxitarife, Verkehrshinweise, Referenzkurse und Stadtinformationen mit Quellen.', privacy: 'Datenschutz', terms: 'Nutzungsbedingungen', rights: 'Alle Rechte vorbehalten.' },
  fr: { signIn: 'Se connecter', source: 'Tarifs taxi, guides de transport, cours de référence et informations urbaines avec sources.', privacy: 'Confidentialité', terms: 'Conditions d’utilisation', rights: 'Tous droits réservés.' },
  ar: { signIn: 'تسجيل الدخول', source: 'تعرفات تاكسي وأدلة مواصلات وأسعار مرجعية ومعلومات مدن موثقة بالمصادر.', privacy: 'سياسة الخصوصية', terms: 'شروط الاستخدام', rights: 'جميع الحقوق محفوظة.' },
  ru: { signIn: 'Войти', source: 'Тарифы такси, транспортные справочники, курсы и сведения о городах с указанием источников.', privacy: 'Конфиденциальность', terms: 'Условия использования', rights: 'Все права защищены.' },
  zh: { signIn: '登录', source: '提供标注来源的出租车资费、交通指南、参考汇率和城市信息。', privacy: '隐私政策', terms: '服务条款', rights: '保留所有权利。' },
};

function offlineAssistantReply(prompt: string, language: SupportedLang): string {
  const low = prompt.toLowerCase();
  if (language === 'tr') {
    if (low.includes('taksi') || low.includes('ücret')) return 'Taksi Ücreti sayfasında başlangıç ve varış noktalarını seçip yol mesafesine göre tahmini aralığı görebilirsin. Son tutar taksimetre ve trafiğe göre değişebilir.';
    if (low.includes('metro') || low.includes('ulaşım') || low.includes('vapur')) return 'Toplu Taşıma sayfasında desteklenen istasyonlar için F1 ve T1 bağlantısını görebilirsin. Canlı sefer ve arıza bilgisi için henüz bir ulaşım veri kaynağı bağlı değil.';
    if (low.includes('döviz') || low.includes('euro') || low.includes('kur')) return 'Exchange sayfasında tarihli referans kurları ve çevirici var. Döviz bürosu alış/satış kuru yalnızca kaynak sağlanırsa gösterilir.';
    if (low.includes('yakın') || low.includes('eczane') || low.includes('restoran') || low.includes('otel')) return 'Yakınımda sayfasında şehir merkezini veya konumunu seçerek adres, telefon ve yayımlanmış çalışma saatlerini arayabilirsin.';
    if (low.includes('hava') || low.includes('istanbul') || low.includes('antalya') || low.includes('kapadokya') || low.includes('izmir')) return 'Cities & Weather sayfasında seçtiğin şehir için güncel hava, şehir notları ve görülmesi gereken yerler bulunur.';
    if (low.includes('güven') || low.includes('acil')) return 'Safety sayfasında 112 ve temel güvenlik önerileri var. Acil durumda doğrudan 112’yi ara.';
    if (low.includes('aktiv') || low.includes('müze') || low.includes('gez')) return 'Activities ve şehir sayfalarında etkinlik ve müze önerilerini inceleyebilirsin; rezervasyon için işletmenin kendi onayı gerekir.';
    return 'Bu konuda şehir, taksi, toplu taşıma, hava durumu veya döviz sayfalarındaki kaynaklı bilgileri kontrol edebilirim.';
  }
  const replies: Record<SupportedLang, string> = {
    en: 'I can help with the Taxi Fare, Transit Navigator, Exchange and Cities & Weather pages. Live departures, traffic percentages and bureau quotes are shown only when a connected source provides them.',
    tr: 'Taksi Ücreti, Toplu Taşıma, Döviz ve Şehirler & Hava sayfalarında yardımcı olabilirim. Canlı sefer, trafik ve büro kurları yalnızca bağlı bir kaynak varsa gösterilir.',
    de: 'Ich helfe bei Taxi, öffentlichem Verkehr, Wechselkursen und Städten. Live-Daten werden nur angezeigt, wenn eine Quelle verbunden ist.',
    fr: 'Je peux aider avec les pages taxi, transports, change et villes. Les données en direct ne sont affichées que lorsqu’une source est connectée.',
    ar: 'يمكنني المساعدة في صفحات سيارات الأجرة والمواصلات والصرافة والمدن. لا تظهر البيانات المباشرة إلا عند توفر مصدر متصل.',
    ru: 'Я помогу со страницами такси, транспорта, обмена валют и городов. Данные в реальном времени показываются только при подключённом источнике.',
    zh: '我可以帮助你使用出租车、公共交通、汇率和城市页面。只有连接了数据源，才会显示实时信息。',
  };
  if (language === 'en') {
    if (low.includes('taxi') || low.includes('fare') || low.includes('price')) return 'Open Taxi Fare, choose both places from the address suggestions, then calculate. The estimate uses the dated Istanbul reference tariff and road distance; the meter can differ.';
    if (low.includes('metro') || low.includes('train') || low.includes('bus') || low.includes('transit') || low.includes('route')) return 'Open Transit Navigator and choose different stations. The guide changes its F1/T1 connection for the selected pair. Live departures, bus times and fares need a connected municipal feed and are not invented.';
    if (low.includes('near') || low.includes('pharmacy') || low.includes('restaurant') || low.includes('hotel')) return 'Open Near Me, choose city centre or your location, then wait for the published place directory. Cards show only sourced address, phone and hours.';
    if (low.includes('weather') || low.includes('istanbul') || low.includes('antalya') || low.includes('cappadocia') || low.includes('izmir')) return 'Open Cities & Weather and select a city for current weather, practical city notes and places worth seeing.';
    if (low.includes('activity') || low.includes('museum') || low.includes('visit')) return 'Open Activities or a city page for suggestions. A booking is only confirmed after the business or booking provider accepts it.';
  }
  return replies[language];
}

// ============================================================================
// 2. RESMİ TARİFELER & DÖVİZ
// ============================================================================
const citiesDetailedData: Record<string, CityInfo> = {
  'Ankara': {
    name: 'Ankara', tagline: 'Türkiye’s capital: museums, historic streets and parks',
    coverImage: '/photos/ankara.jpg', lat: 39.9334, lng: 32.8597,
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
    coverImage: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
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
    coverImage: 'https://images.unsplash.com/photo-1557972359-152b6ebd3eb3?auto=format&fit=crop&w=1200&q=80',
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
    coverImage: cityImages.antalya.src,
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
    coverImage: cityPhotos.izmir,
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
function SafeRouteMap({
  originCoords,
  destCoords,
  geometry,
  color = '#087FFF'
}: {
  originCoords: Coordinates | null;
  destCoords: Coordinates | null;
  geometry: RouteGeometryPoint[] | null;
  color?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const googleBrowserKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY?.trim();

  useEffect(() => {
    if (googleBrowserKey) return;
    if ((window as any).L) {
      setLeafletReady(true);
      return;
    }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletReady(true);
      document.body.appendChild(script);
    }
  }, [googleBrowserKey]);

  useEffect(() => {
    if (googleBrowserKey) return;
    const L = (window as any).L;
    if (!leafletReady || !L || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const container = mapContainerRef.current;
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    const map = L.map(container).setView([41.0082, 28.9784], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    const bounds: any[] = [];

    if (originCoords) {
      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color:#087FFF; width:16px; height:16px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([originCoords.lat, originCoords.lng], { icon }).addTo(map);
      bounds.push([originCoords.lat, originCoords.lng]);
    }

    if (destCoords) {
      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color:#EF4444; width:16px; height:16px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([destCoords.lat, destCoords.lng], { icon }).addTo(map);
      bounds.push([destCoords.lat, destCoords.lng]);
    }

    if (geometry && geometry.length > 0) {
      const latlngs = geometry.map(p => [p.lat, p.lng]);
      L.polyline(latlngs, {
        color: color,
        weight: 5,
        opacity: 0.85,
        lineCap: 'round'
      }).addTo(map);
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletReady, originCoords, destCoords, geometry, color, googleBrowserKey]);

  if (googleBrowserKey && originCoords && destCoords) {
    const mapParams = new URLSearchParams({
      key: googleBrowserKey,
      origin: `${originCoords.lat},${originCoords.lng}`,
      destination: `${destCoords.lat},${destCoords.lng}`,
      mode: 'driving',
      language: document.documentElement.lang || 'en',
      region: 'TR'
    });
    return (
      <div className="w-full h-full min-h-[360px] rounded-2xl overflow-hidden border border-sky-100 shadow-sm bg-slate-100">
        <iframe title="Google Maps taxi route" src={`https://www.google.com/maps/embed/v1/directions?${mapParams.toString()}`} className="w-full h-full min-h-[360px] sm:min-h-[480px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[360px] rounded-2xl overflow-hidden border border-sky-100 shadow-sm relative z-0 bg-slate-100 flex items-center justify-center">
      {!leafletReady && (
        <div className="text-[12px] text-slate-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#087FFF]" /> Harita modülü yükleniyor...
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />
    </div>
  );
}

// ============================================================================
// 4. ANA BİLEŞEN
// ============================================================================
export default function App({initialCity,initialLanguage}:{initialCity?:string;initialLanguage?:string} = {}) {
  const { session, isStaff, role, signIn, signOut } = useSupabaseAuth();
  const mockDataEnabled = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';
  const [activeTab, setActiveTab] = useState<'home' | 'city' | 'taxi' | 'transit' | 'currency' | 'nearme' | 'safety' | 'stay' | 'food' | 'experiences' | 'admin' | 'assistant'>(initialCity?'city':'home');
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [activeTab]);
  const [selectedCityName, setSelectedCityName] = useState<string>(initialCity??'İstanbul');
  useEffect(() => {
    updateSectionSeo(activeTab, selectedCityName);
    // State-only sections must not retain a detail/city schema or language
    // alternates left by the server document they were opened from.
    if(activeTab!=='city')document.getElementById('public-page-schema')?.remove();
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link=>link.remove());
    const path=activeTab==='city'?cityPath(selectedCityName):'/';
    if(activeTab==='city'){
      let schema=document.getElementById('public-page-schema');
      if(!schema){schema=document.createElement('script');schema.id='public-page-schema';schema.setAttribute('type','application/ld+json');document.head.appendChild(schema);}
      schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'TouristDestination',name:selectedCityName,url:`https://www.safeinturkiye.com${path}`});
    }
    if(initialCity)window.history.replaceState({},'',path);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href',`https://www.safeinturkiye.com${path}`);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content',`https://www.safeinturkiye.com${path}`);
  }, [activeTab, selectedCityName,initialCity]);
  const [lang, setLang] = useState<SupportedLang>(() => {
    const candidate = initialLanguage || localStorage.getItem('safeinturkiye-language') || 'en';
    return ['en','tr','de','fr','ar','ru','zh'].includes(candidate) ? candidate as SupportedLang : 'en';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dil Metinleri Helper Fonksiyonu
  const tr = useCallback((k: string) => k === 'assistant' ? ({ en: 'Travel FAQ', tr: 'Sık Sorulan Sorular', de: 'Reisefragen', fr: 'Questions fréquentes', ar: 'الأسئلة الشائعة', zh: '常见问题', ru: 'Частые вопросы' }[lang]) : dict[lang]?.[k] || dict.en[k] || k, [lang]);
  const page = useCallback((key: string) => pageCopy[lang]?.[key] ?? pageCopy.en[key] ?? key, [lang]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('safeinturkiye-language',lang);
  }, [lang]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  useEffect(() => {
    const openAdmin = () => {
      if (window.location.hash === '#admin') {
        setActiveTab('admin');
        if (!session) setAuthModalOpen(true);
      }
    };
    openAdmin();
    window.addEventListener('hashchange', openAdmin);
    return () => window.removeEventListener('hashchange', openAdmin);
  }, [session]);
  const [exchangeQuotes, setExchangeQuotes] = useState<ExchangeQuote[]>([]);
  const [exchangeUpdatedAt, setExchangeUpdatedAt] = useState<string | null>(null);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [nearbyBureaus, setNearbyBureaus] = useState<NearbyPlace[]>([]);
  const [nearbyExchangeStatus, setNearbyExchangeStatus] = useState<string | null>(null);
  const [nearbyLivePlaces, setNearbyLivePlaces] = useState<NearbyPlace[]>([]);
  const [nearbySearchStatus, setNearbySearchStatus] = useState<string | null>(null);

  const distanceLabel = (from: Coordinates, lat: number, lng: number) => {
    const radiusKm = 6371;
    const dLat = ((lat - from.lat) * Math.PI) / 180;
    const dLng = ((lng - from.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((from.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const km = radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return km < 1 ? `${Math.max(1, Math.round(km * 1000))} m` : `${km.toFixed(1)} km`;
  };

  const findNearby = (kind: 'exchange' | 'essential') => {
    if (!navigator.geolocation) {
      const message = 'This browser does not support location search.';
      if (kind === 'exchange') setNearbyExchangeStatus(message); else setNearbySearchStatus(message);
      return;
    }

    const setStatus = kind === 'exchange' ? setNearbyExchangeStatus : setNearbySearchStatus;
    setStatus('Requesting your location…');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const origin = { lat: position.coords.latitude, lng: position.coords.longitude };
      const filters = kind === 'exchange'
        ? '["amenity"="bureau_de_change"]'
        : '["amenity"~"pharmacy|police|atm|taxi"]';
      const query = `[out:json][timeout:20];(node(around:3500,${origin.lat},${origin.lng})${filters};way(around:3500,${origin.lat},${origin.lng})${filters};);out center tags;`;
      try {
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Place service unavailable');
        const data = await response.json();
        const places: NearbyPlace[] = (data.elements || []).map((item: any) => {
          const tags = item.tags || {};
          const lat = item.lat ?? item.center?.lat;
          const lng = item.lon ?? item.center?.lon;
          const address = [tags['addr:street'], tags['addr:housenumber'], tags['addr:district'], tags['addr:city']].filter(Boolean).join(', ');
          return {
            id: `${item.type}-${item.id}`,
            name: tags.name || (kind === 'exchange' ? 'Exchange bureau' : tags.amenity || 'Local service'),
            dist: typeof lat === 'number' && typeof lng === 'number' ? distanceLabel(origin, lat, lng) : 'Distance unavailable',
            addr: address || 'Address not published in OpenStreetMap',
            cat: kind === 'exchange' ? 'Exchange bureau' : (tags.amenity || 'Service'),
            phone: tags.phone || tags['contact:phone'] || 'Phone not published',
            website: tags.website || tags['contact:website']
          };
        }).sort((a: NearbyPlace, b: NearbyPlace) => parseFloat(a.dist) - parseFloat(b.dist)).slice(0, 8);
        if (kind === 'exchange') setNearbyBureaus(places); else setNearbyLivePlaces(places);
        setStatus(places.length ? `Showing ${places.length} places from OpenStreetMap near your location.` : 'No matching places were published within 3.5 km of your location.');
      } catch {
        setStatus('Could not reach the place directory. Please try again in a moment.');
      }
    }, () => setStatus('Location permission was not granted. No location was stored.'), { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  };


  // Soru Listesi Yatay Kaydırma
  const questionsScrollRef = useRef<HTMLDivElement>(null);
  const scrollQuestions = (direction: 'left' | 'right') => {
    if (questionsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      questionsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };


  const handleGlobalSearch = (input = searchQuery) => {
    const query = input.trim();
    if (!query) return;
    const newCity=findCityGuide(query);
    if(newCity){openCityGuide(newCity.slug,lang);return;}
    const low = query.toLocaleLowerCase('tr-TR');
    const normalized = normalizeSearch(query);
    const mentionedCity = Object.keys(citiesDetailedData).find(city => normalized.includes(normalizeSearch(city)));
    setCatalogCity(mentionedCity ?? '');
    setCatalogQuery('');
    setActivityCategory('All');
    const cityMatch = Object.keys(citiesDetailedData).find(city => city.toLocaleLowerCase('tr-TR') === low || city.toLowerCase().replace(/i̇/g, 'i') === query.toLowerCase());
    if (cityMatch) { setSelectedCityName(cityMatch); setActiveTab('city'); return; }
    if (/taksi|taxi|fare|ücret|такси|تاكسي|出租车/.test(low)) setActiveTab('taxi');
    else if (/metro|métro|otobüs|bus|tren|train|vapur|ferry|marmaray|ulaşım|transit|route|rota|bahn|transport|транспорт|метро|автобус|مواصلات|مترو|حافل|地铁|公交|交通|火车/.test(low)) setActiveTab('transit');
    else if (/döviz|kur|exchange|currency|euro|usd|wechsel|change|валют|обмен|صرف|صراف|汇率|换汇/.test(low)) setActiveTab('currency');
    else if (/yakın|near|eczane|pharmacy|hastane|hospital|atm|polis|police|nähe|apotheke|proximité|pharmacie|рядом|аптек|قريب|صيدلي|附近|药房/.test(low)) setActiveTab('nearme');
    else if (/otel|hotel|hôtel|konak|stay|отел|гостиниц|فندق|فنادق|酒店|住宿/.test(low)) setActiveTab('stay');
    else if (/restoran|restaurant|yemek|food|cafe|kafe|ресторан|مطعم|مطاعم|餐厅|餐饮/.test(low)) setActiveTab('food');
    else if (/aktiv|activit|etkinlik|museum|musée|müze|gez|cinema|cinéma|музе|кино|متحف|أنشط|سينما|活动|博物馆|影院/.test(low)) setActiveTab('experiences');
    else if (/güven|safety|acil|emergency|sicher|sécurité|безопас|أمان|طوارئ|安全|紧急/.test(low)) setActiveTab('safety');
    else {
      const hotel = hotelsList.find(item => matchesCatalog(item, query, ''));
      const restaurant = restaurantsList.find(item => matchesCatalog(item, query, ''));
      const activity = activitiesList.find(item => matchesCatalog(activityContent(item, lang), query, ''));
      if (hotel || restaurant || activity) {
        setCatalogQuery(query);
        setActiveTab(hotel ? 'stay' : restaurant ? 'food' : 'experiences');
      } else setActiveTab('assistant');
    }
  };

  // Referral-only: never submit booking requests from the public directory.
  const handleOpenBooking = (item: {id: string}, _listingType: string) => {
    localStorage.setItem('safeinturkiye-language', lang);
    openDirectoryEntry(item.id);
  };

  // Taksi Durumları
  const [detectedTaxiCity, setDetectedTaxiCity] = useState<string>('');
  const [taxiOriginText, setTaxiOriginText] = useState('');
  const [taxiDestText, setTaxiDestText] = useState('');
  const [taxiOriginCoords, setTaxiOriginCoords] = useState<Coordinates | null>(null);
  const [taxiDestCoords, setTaxiDestCoords] = useState<Coordinates | null>(null);
  const [taxiOriginSuggs, setTaxiOriginSuggs] = useState<GeocodedPlace[]>([]);
  const [taxiDestSuggs, setTaxiDestSuggs] = useState<GeocodedPlace[]>([]);
  const [taxiClass, setTaxiClass] = useState<'Yellow' | 'Turquoise' | 'Black'>('Yellow');

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
      for (const tariff of tariffs) next[tariff.vehicleClass] = { city: tariff.city, openingFare: tariff.openingFare, pricePerKm: tariff.perKm, minimumFare: tariff.minimumFare, waitingFarePerHour: tariff.waitingFare, source: tariff.sourceName + ' · ' + tariff.effectiveFrom, lastUpdated: tariff.lastVerified };
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

  const [fareCalculation, setFareCalculation] = useState<{ amount: number; upper:number; hasRange:boolean; source: string; sourceUrls?:string[] } | null>(null);
  const taxiRequest = useRef(0);
  useEffect(() => {
    taxiRequest.current++;
    setFareCalculation(null);
    setTaxiRouteResult(null);
    setIsTaxiRouting(false);
  }, [taxiOriginCoords, taxiDestCoords, taxiClass, detectedTaxiCity]);

  const taxiOriginLookupId = useRef(0);

  useEffect(() => {
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
        const budget=taxiBudgetRange(referenceTaxiCity,data.routes.filter((route:{distance:number})=>Number.isFinite(route.distance)&&route.distance>0).map((route:{distance:number})=>route.distance/1000),taxiClass.toUpperCase());
        if(budget){setFareCalculation(budget);setTaxiRouteError(null);setIsTaxiRouting(false);return;}
        setFareCalculation(null);
        setTaxiRouteError('unavailable');
        setIsTaxiRouting(false);
        return;
      }
      setFareCalculation({
        ...routeFareRange(data.routes.filter((route:{distance:number})=>Number.isFinite(route.distance)&&route.distance>0).map((route:{distance:number})=>route.distance/1000), tariff.openingFare, tariff.pricePerKm, tariff.minimumFare),
        source: tariff.city+' · '+taxiClass+' · '+tariff.source,
      });
    } catch {
      if (request !== taxiRequest.current) return;
      setIsTaxiRouting(false);
      setTaxiRouteError('network');
    }
  };

  // Toplu Taşıma Durumları ve Rota Hesaplama (Düzeltildi)
  const [transitOriginText, setTransitOriginText] = useState('Taksim Square');
  const [transitDestText, setTransitDestText] = useState('Sultanahmet (Old City)');
  const [transitOriginCoords, setTransitOriginCoords] = useState<Coordinates | null>({ lat: 41.0369, lng: 28.9850 });
  const [transitDestCoords, setTransitDestCoords] = useState<Coordinates | null>({ lat: 41.0054, lng: 28.9768 });
  const [isTransitLocating, setIsTransitLocating] = useState(false);
  const [isTransitRouting, setIsTransitRouting] = useState(false);
  const [transitRouteResults, setTransitRouteResults] = useState<TransitRouteOption[] | null>(null);

  const handleCalculateTransitRoute = async () => {
    if (!transitOriginCoords || !transitDestCoords) return;
    setIsTransitRouting(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${transitOriginCoords.lng},${transitOriginCoords.lat};${transitDestCoords.lng},${transitDestCoords.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      let realGeo: RouteGeometryPoint[] = [];
      if (res.ok) {
        const d = await res.json();
        if (d.routes && d.routes.length > 0) {
          realGeo = d.routes[0].geometry.coordinates.map((coord: [number, number]) => ({ lat: coord[1], lng: coord[0] }));
        }
      }

      setTransitRouteResults([
        {
          id: 'tr-opt-4',
          title: 'F1 Funicular + T1 Historic Peninsula Tram',
          totalDurationMins: 18,
          fareTRY: 46.20 + 34.40,
          transfersCount: 1,
          geometry: realGeo,
          steps: [
            { type: 'walk', lineName: 'Walk', instruction: 'Enter Taksim underground station', durationMins: 2 },
            { type: 'metro', lineName: 'F1 Funicular', instruction: 'F1 down to Kabataş waterfront', durationMins: 3, stopsCount: 1, frequency: 'Every 5 mins' },
            { type: 'tram', lineName: 'T1 Tram', instruction: 'Board T1 towards Bağcılar. Get off at Sultanahmet (Hagia Sophia)', durationMins: 11, stopsCount: 5, frequency: 'Every 3 mins', firstTrip: '06:00', lastTrip: '00:00' },
            { type: 'walk', lineName: 'Walk', instruction: 'Walk 2 mins to Sultanahmet square', durationMins: 2 }
          ]
        }
      ]);
    } catch {} finally {
      setIsTransitRouting(false);
    }
  };

  useEffect(() => {
    handleCalculateTransitRoute();
  }, []);

  const handleTransitCurrentLocation = () => {
    if (!('geolocation' in navigator)) return;
    setIsTransitLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsTransitLocating(false);
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setTransitOriginCoords(c);
        setTransitOriginText('Fetching address...');
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.lat}&lon=${c.lng}&zoom=16`);
          if (res.ok) {
            const data = await res.json();
            setTransitOriginText(data.display_name || `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`);
          } else {
            setTransitOriginText(`${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`);
          }
        } catch {
          setTransitOriginText(`${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`);
        }
      },
      () => setIsTransitLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // CMS Listeleri
  const [hotelsList, setHotelsList] = useState(()=>directoryRecords.filter(entry=>entry.kind==='hotels').map(entry=>({id:entry.id,name:entry.name,city:entry.city,area:'',roomType:'',price:'',rating:'',amenities:'',img:''})));

  const [restaurantsList, setRestaurantsList] = useState(()=>directoryRecords.filter(entry=>entry.kind==='restaurants').map(entry=>({id:entry.id,name:entry.name,city:entry.city,cuisine:'',avgPrice:'',openHours:'openingHours' in entry ? entry.openingHours??'':'',rating:'',img:''})));

  const [activitiesList, setActivitiesList] = useState(()=>directoryRecords.filter(entry=>entry.kind==='activities').map(entry=>({id:entry.id,title:entry.name,city:entry.city,category:entry.category??(entry.id==='erciyes'?'Winter':'Museum & Culture'),duration:'',price:'',guideLang:'',rating:'',description:entry.description[lang]??entry.description.en,img:''})));
  const [activityCategory, setActivityCategory] = useState('All');
  const [catalogError, setCatalogError] = useState(false);
  useEffect(() => {
    if (photoCuratedCatalog || !supabaseConfigured || !['stay','food','experiences','city'].includes(activeTab)) return;
    let cancelled=false;
    setCatalogError(false);
    setHotelsList([]); setRestaurantsList([]); setActivitiesList([]);
    void Promise.all(['hotels','restaurants','activities'].map(async table => {
      const rows=await getPublishedContent(table as 'hotels'|'restaurants'|'activities');
      if(cancelled) return;
      for(const row of rows)registerPublishedEntry(row,table);
      if(table==='hotels')setHotelsList(rows.map(row=>({id:row.id,name:row.name,city:row.city?.name??'',area:'',roomType:'',price:'',rating:'',amenities:'',img:''})));
      if(table==='restaurants')setRestaurantsList(rows.map(row=>({id:row.id,name:row.name,city:row.city?.name??'',cuisine:'',avgPrice:'',openHours:'',rating:'',img:''})));
      if(table==='activities')setActivitiesList(rows.map(row=>({id:row.id,title:row.name,city:row.city?.name??'',category:'',duration:'',price:'',guideLang:'',rating:'',description:row.description??'',img:''})));
    })).catch(()=>{ if(!cancelled)setCatalogError(true); });
    return()=>{cancelled=true;};
  },[activeTab]);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogCity, setCatalogCity] = useState('');
  const filteredHotels = hotelsList.filter(item => matchesCatalog(item, catalogQuery, catalogCity));
  const filteredRestaurants = restaurantsList.filter(item => matchesCatalog(item, catalogQuery, catalogCity));
  const filteredActivities = activitiesList.filter(item=>directoryRecords.some(entry=>entry.id===item.id)).map(item => activityContent(item, lang)).filter(item => (activityCategory === 'All' || item.category === activityCategory) && matchesCatalog(item, catalogQuery, catalogCity));
  const resetCatalog = () => { setCatalogQuery(''); setCatalogCity(''); setActivityCategory('All'); };
  const catalogFilters = (items: {city: string}[], count: number) => <>{catalogError && <p role="alert">{lang==='tr'?'İçerik yüklenemedi. Lütfen sayfayı yenileyerek tekrar deneyin.':'Content could not be loaded. Please refresh to retry.'}</p>}<CatalogFilters lang={lang} query={catalogQuery} city={catalogCity} cities={[...new Set([...items.map(item => item.city), ...(catalogCity ? [catalogCity] : [])])]} count={count} onQuery={setCatalogQuery} onCity={setCatalogCity} onReset={resetCatalog} /></>;




  const regionalCity=cityGuides.find(city=>city.name===selectedCityName);
  const baseCityInfo = regionalCity ? {
    name:regionalCity.name,tagline:regionalCity.focus,
    coverImage:cityImages[regionalCity.slug as keyof typeof cityImages].src,
    lat:regionalCity.lat,lng:regionalCity.lng,
    localTip:regionalDescription(regionalCity, lang),
    highlights:regionalCity.places.map(name=>({name,detail:''})),
  } : citiesDetailedData[selectedCityName] || citiesDetailedData['İstanbul'];
  const currentCityInfo=lang==='zh'?{...baseCityInfo,...citiesZh[selectedCityName as keyof typeof citiesZh]}:baseCityInfo;

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
            <div onClick={() => setActiveTab('home')} className="flex items-center cursor-pointer shrink-0" aria-label="SafeInTürkiye home">
              <img src={siteLogo} alt="SafeInTürkiye" className="h-7 w-auto max-w-[100px] object-contain sm:h-10 sm:max-w-[185px]" />
            </div>

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
                onClick={() => { setSelectedCityName('İstanbul'); setActiveTab('city'); }}
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
              </select>

              <a
                href="tel:112"
                className="flex items-center justify-center gap-1.5 w-9 sm:w-auto sm:px-3.5 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-extrabold shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tr('emergency')}</span>
              </a>
            </div>
          </div>
          {mobileMenuOpen && <nav className="lg:hidden border-t border-sky-100 bg-white px-4 py-3 grid grid-cols-2 gap-2 text-[12px] font-bold">
            {([
              ['assistant', tr('assistant')], ['taxi', tr('taxi')], ['transit', tr('transit')], ['currency', tr('currency')], ['city', tr('cityWeather')], ['nearme', tr('nearMe')], ['stay', tr('hotels')], ['food', tr('dining')], ['experiences', tr('activities')], ['safety', page('safety')],
            ] as const).map(([tab, label]) => <button key={tab} type="button" onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }} className={`rounded-xl px-3 py-2 text-left ${activeTab === tab ? 'bg-sky-50 text-[#087FFF]' : 'bg-slate-50 text-slate-700'}`}>{label}</button>)}
            {isStaff && <button type="button" onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }} className="rounded-xl px-3 py-2 text-left bg-slate-900 text-white">CMS Studio</button>}
          </nav>}
        </header>
        {activeTab!=='home' && <div className="max-w-6xl mx-auto px-4 pt-3"><HomeButton lang={lang} onClick={()=>{window.history.replaceState({},'','/');setActiveTab('home');setMobileMenuOpen(false);window.scrollTo(0,0);}}/></div>}

        {/* ====================================================================
            PAGE 1: EXPLORE
        ==================================================================== */}
        {activeTab === 'home' && <TravelHome
          lang={lang}
          cities={[...['İstanbul', 'Antalya', 'Cappadocia', 'Ankara', 'İzmir'].map(key => ({ key, name: citiesDetailedData[key].name, coverImage: key==='Antalya'?cityImages.antalya.thumbnail:citiesDetailedData[key].coverImage })),...cityGuides.map(city=>{const photo=cityImages[city.slug as keyof typeof cityImages];return {key:city.name,name:city.name,coverImage:'thumbnail' in photo?photo.thumbnail:photo.src};})]}
          onNavigate={setActiveTab}
          onCity={city => { window.history.pushState({},'',cityPath(city));window.dispatchEvent(new PopStateEvent('popstate')); }}
          onSearch={query => { setSearchQuery(query); handleGlobalSearch(query); }}
          onCategory={category => { setActivityCategory(category); setActiveTab('experiences'); }}
        />}

        {/* ====================================================================
            PAGE 2: AI TRAVEL ASSISTANT
        ==================================================================== */}
        {activeTab === 'assistant' && <TravelFaq lang={lang} initialQuery={searchQuery} />}

        {/* ====================================================================
            PAGE 3: TAKİ HESAPLAYICI
        ==================================================================== */}
        {activeTab === 'taxi' && (
          <main className="reference-page reference-taxi max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 font-bold text-[#087FFF] hover:underline cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> {page('back')}
              </button>
              <span>/</span>
              <span className="text-slate-800 font-bold">{page('taxiTitle')}</span>
            </div>

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
                    placeholder="Search departure place (e.g. Taksim, IST Airport)..."
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
                    placeholder="Search destination (e.g. Kadıköy, Sultanahmet)..."
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
                {taxiRouteResult && fareCalculation && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 space-y-2">
                      <div className="reference-estimate-title"><span>{taxiEstimateCopy[lang][0]}</span><span aria-hidden="true">🚕</span></div>
                      <span className="text-3xl font-black text-slate-900">
                        {taxiDetailsCopy[lang][1]} ₺{(fareCalculation.hasRange?Math.floor(fareCalculation.amount):Math.round(fareCalculation.amount)).toLocaleString(lang)}{fareCalculation.hasRange?` – ₺${Math.ceil(fareCalculation.upper).toLocaleString(lang)}`:''}
                      </span>
                      <span className="text-[11px] text-slate-500 block">{taxiEstimateCopy[lang][1]}</span>
                      <details className="text-xs text-slate-500"><summary className="cursor-pointer min-h-8">{taxiDetailsCopy[lang][0]}</summary><p>{fareCalculation.source}</p>{fareCalculation.sourceUrls?.map((url)=><a key={url} className="block underline py-1" href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname} ↗</a>)}<p>{fareCalculation.sourceUrls?taxiBudgetCopy[lang]:taxiDetailsCopy[lang][2]}</p></details>
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
                <SafeRouteMap
                  originCoords={taxiOriginCoords}
                  destCoords={taxiDestCoords}
                  geometry={taxiRouteResult ? taxiRouteResult.geometry : null}
                  color="#087FFF"
                />
              </div>
            </div>
            <aside className="catalog-editorial-note"><a className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#087FFF] px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700" href="https://www.bitaksi.com/home" target="_blank" rel="noopener noreferrer">🚕 {directoryText(lang, 3)} ↗</a><p className="mt-2">{directoryText(lang, 4)}</p></aside>

          </main>
        )}

        {/* ====================================================================
            PAGE 4: TOPLU TAŞIMA (TRANSIT - DÜZELTİLDİ VE AKTİF)
        ==================================================================== */}
        {activeTab === 'transit' && <Suspense fallback={<main aria-busy="true" className="p-8">SafeInTürkiye…</main>}><TransitPlanner lang={lang} /></Suspense>}

        {/* ====================================================================
            PAGE 5: EXCHANGE (CANLI KURLAR + YAKINLARDAKİ DÖVİZCİLER - DÜZELTİLDİ)
        ==================================================================== */}
        {activeTab === 'currency' && (
          <main className="reference-page max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <h1 className="text-3xl font-extrabold text-slate-900">{({ en: 'Currency and exchange bureaux', tr: 'Döviz ve döviz büroları', de: 'Wechselkurse und Wechselstuben', fr: 'Change et bureaux de change', ar: 'العملات ومكاتب الصرافة', ru: 'Валюта и обменные пункты', zh: '汇率与附近兑换点' } as Record<SupportedLang, string>)[lang]}</h1>
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
                  onClick={() => {const guide=findCityGuide(cname);if(guide)openCityGuide(guide.slug,lang);else setSelectedCityName(cname);}}
                  className={`px-4 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all ${
                    selectedCityName === cname ? 'bg-[#087FFF] text-white shadow-sm' : 'bg-white border border-sky-100 text-slate-600 hover:bg-sky-50'
                  }`}
                >
                  {cname}
                </button>
              ))}
            </div>

            <div className="city-photo-banner relative rounded-3xl overflow-hidden shadow-md flex items-end p-6 text-white">
              {currentCityInfo.coverImage && <img src={currentCityInfo.coverImage} alt={currentCityInfo.name} className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="relative z-10">
                <h1 className="text-3xl font-black">{currentCityInfo.name}</h1>
                <p className="text-[13px] text-slate-200">{currentCityInfo.tagline}</p>
              </div>
            </div>

            <nav className="reference-city-nav" aria-label={currentCityInfo.name}>
 {([{tab:'experiences',label:tr('activities'),icon:'🎟️'},{tab:'stay',label:tr('hotels'),icon:'🛏️'},{tab:'food',label:tr('dining'),icon:'🍽️'},{tab:'transit',label:tr('transit'),icon:'🚇'},{tab:'safety',label:page('safety'),icon:'🛡️'}] as const).map(item=><button key={item.tab} onClick={()=>setActiveTab(item.tab)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
 </nav>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <WeatherCard lat={currentCityInfo.lat} lng={currentCityInfo.lng} cityName={currentCityInfo.name} lang={lang} />
              <div className="p-5 bg-white rounded-2xl border border-sky-100 shadow-sm space-y-3">
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">{page('cityTransport')}</span>
                <p className="text-sm text-slate-700">{currentCityInfo.localTip}</p>
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

            {activitiesList.some(item => item.city === selectedCityName) && <section className="reference-photo-section">
              <h2>{tr('activities')}</h2>
              <div className="reference-photo-grid">{activitiesList.filter(item => item.city === selectedCityName).slice(0,4).map(item => { const activity = activityContent(item, lang); return <button key={item.id} onClick={() => handleOpenBooking(activity, 'activity')}><PlacePhoto id={item.id} name={activity.title} lang={lang} /><strong>{activity.title}</strong><span>{directoryText(lang, 0)} →</span></button>; })}</div>
            </section>}
            <section className="reference-photo-section">
              <h2>{tr('hotels')}</h2>
              <div className="reference-photo-grid">{hotelsList.filter(item => item.city === selectedCityName).map(item => <button key={item.id} onClick={() => handleOpenBooking(item, 'hotel')}><PlacePhoto id={item.id} name={item.name} lang={lang} /><strong>{item.name}</strong><span>{directoryText(lang, 0)} →</span></button>)}</div>
              <button className="reference-outline-action" onClick={() => setActiveTab('stay')}>{page('hotelsTitle')} →</button>
            </section>
            <TransportCardGuide city={selectedCityName} lang={lang} />

          </main>
        )}

        {/* ====================================================================
            PAGE 7: OTELLER (HOTELS)
        ==================================================================== */}
        {activeTab === 'stay' && (
          <main className="travel-catalog">
            <h1 className="text-3xl font-extrabold text-slate-900">{page('hotelsTitle')}</h1>
            {catalogFilters(hotelsList, filteredHotels.length)}
            <p className="catalog-editorial-note">{directoryText(lang, 2)}</p>
            <div className="travel-catalog-list">
              {filteredHotels.map(h => (
                <div key={h.id} className="travel-catalog-row">
                  <div className="travel-catalog-photo">
                    <PlacePhoto id={h.id} name={h.name} lang={lang} />
                  </div>
                  <div className="travel-catalog-info">
                    <span className="travel-catalog-label">{h.city}</span>
                    <strong className="text-[14px] text-slate-900 block">{h.name}</strong><p>{hotelSummary(lang)}</p>
                    <span className="text-[12px] text-[#087FFF] font-semibold">{h.roomType}</span>
                    <p className="text-[11px] text-slate-500">{h.amenities}</p>
                  </div>
                  <div className="travel-catalog-action">
                    <span className="font-bold text-[#087FFF]">{bookingText(lang, 0)}</span>
                    <button
                      onClick={() => handleOpenBooking(h, 'hotel')}
                      className="px-4 py-1.5 bg-[#087FFF] hover:bg-[#0284C7] text-white rounded-xl text-[12px] font-bold cursor-pointer"
                    >
                      {detailLabel(lang)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* ====================================================================
            PAGE 8: YEME & İÇME (DINING)
        ==================================================================== */}
        {activeTab === 'food' && (
          <main className="travel-catalog">
            <h1 className="text-3xl font-extrabold text-slate-900">{page('diningTitle')}</h1>
            {catalogFilters(restaurantsList, filteredRestaurants.length)}
            <p className="catalog-editorial-note">{directoryText(lang, 2)}</p>
            <div className="travel-catalog-list">
              {filteredRestaurants.map(r => (
                <div key={r.id} className="travel-catalog-row">
                  <div className="travel-catalog-photo">
                    <PlacePhoto id={r.id} name={r.name} lang={lang} />
                  </div>
                  <div className="travel-catalog-info">
                    <span className="travel-catalog-label">{r.city}</span>
                    <strong className="text-[14px] text-slate-900 block">{r.name}</strong>
                    <span className="text-[12px] text-[#087FFF] font-semibold">{r.cuisine}</span>
                    <span className="text-[11px] text-slate-400 block">{r.city}</span>
                  </div>
                  <div className="travel-catalog-action">
                    <span className="text-[12px] font-bold text-slate-600">{bookingText(lang, 0)}</span>
                    <button
                      onClick={() => handleOpenBooking(r, 'restaurant')}
                      className="px-4 py-1.5 bg-[#087FFF] hover:bg-[#0284C7] text-white rounded-xl text-[12px] font-bold cursor-pointer"
                    >
                      {detailLabel(lang)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* ====================================================================
            PAGE 9: AKTİVİTELER (ACTIVITIES)
        ==================================================================== */}
        {activeTab === 'experiences' && (
          <main className="travel-catalog">
            <div><h1 className="text-3xl font-extrabold text-slate-900">{page('activitiesTitle')}</h1><p className="mt-1 text-sm text-slate-600">{page('activitiesSub')}</p></div>
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label={lang === 'tr' ? 'Aktivite kategorisi' : 'Activity category'}>
              {['All', 'Museum & Culture', 'Cinema', 'Entertainment', 'Summer', 'Winter'].map(category => <button type="button" key={category} aria-pressed={activityCategory === category} onClick={() => setActivityCategory(category)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold ${activityCategory === category ? 'border-[#087FFF] bg-[#087FFF] text-white' : 'border-sky-100 bg-white text-slate-700 hover:bg-sky-50'}`}>{activityLabel(category, lang)}</button>)}
            </div>
            {catalogFilters(activitiesList, filteredActivities.length)}
            <p className="catalog-editorial-note">{directoryText(lang, 2)}</p>
            <div className="travel-catalog-list">
              {filteredActivities.map(a => (
                <div key={a.id} className="travel-catalog-row">
                  <div className="travel-catalog-photo">
                    <PlacePhoto id={a.id} name={a.title} lang={lang} />
                  </div>
                  <div className="travel-catalog-info">
                    <span className="travel-catalog-label">{activityLabel(a.category, lang)} • {a.city}</span>
                    <strong className="text-[14px] text-slate-900 block">{a.title}</strong>
                    <span className="text-[11px] text-slate-500">{directoryText(lang, 5)}</span>
                    <p className="pt-2 text-[12px] leading-relaxed text-slate-600">{a.description || directoryText(lang, 1)}</p>
                  </div>
                  <div className="travel-catalog-action">
                    <strong className="text-[12px] font-bold text-[#007EAD]">{activityText(a.price, lang)}</strong>
                    <button
                      onClick={() => handleOpenBooking(a, 'activity')}
                      className="px-4 py-1.5 bg-[#087FFF] hover:bg-[#0284C7] text-white rounded-xl text-[12px] font-bold cursor-pointer"
                    >
                      {detailLabel(lang)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

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
            <section className="reference-safety-banner">
              <div><h2>{page('safety')}</h2><p><span aria-hidden="true">✅</span> {page('taxiSafety')}</p><p><span aria-hidden="true">✅</span> {page('usefulText')}</p><a href="tel:112"><span aria-hidden="true">🚨</span> {page('emergencyTitle')} · 112</a></div>
              <img src={citiesDetailedData['Antalya'].coverImage} alt={citiesDetailedData['Antalya'].name} loading="lazy" />
            </section>
            <p className="text-[10px] text-slate-400">
              Photo credits: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Anadolu_Medeniyetleri_M%C3%BCzesi.jpg" target="_blank" rel="noreferrer">José Luis Filpo Cabana / CC BY 3.0</a>{' · '}
              <a className="underline" href="https://commons.wikimedia.org/wiki/File:Topkapi_Palace,_Istanbul.jpg" target="_blank" rel="noreferrer">Rraj89 / CC BY-SA 4.0</a>. Other editorial images are from Unsplash; CC0/public-domain images are identified at their source.
            </p>
          </main>
        )}

        {/* ====================================================================
            PAGE 11: ROLE-PROTECTED ADMIN CMS
        ==================================================================== */}
        {activeTab === 'admin' && isStaff && <Suspense fallback={<main aria-busy="true" className="p-8">SafeInTürkiye…</main>}><ContentAdmin role={role} /></Suspense>}
        {activeTab === 'admin' && !isStaff && <main className="max-w-xl mx-auto p-6 my-8 rounded-2xl bg-white border border-sky-100 space-y-4"><h1 className="text-xl font-bold">Yönetici girişi</h1><p>{session ? 'Hesabınızın içerik yönetimi yetkisi kontrol ediliyor. Yetki verilmemişse bu bölüm açılamaz.' : 'Yönetim panelini açmak için yetkili hesabınızla giriş yapın.'}</p>{!session && <button onClick={() => setAuthModalOpen(true)} className="bg-sky-600 text-white rounded-xl px-5 py-3">Giriş yap</button>}</main>}

      </div>

      {authModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#087FFF] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-[17px] text-slate-900">{footerCopy[lang].signIn}</h3>
              <p className="text-[12px] text-slate-500">CMS access is granted only by your Supabase role.</p>
            </div>
            <input
              type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email"
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-[#087FFF]"
            />
            <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password" className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-[#087FFF]" />
            {authError && <p className="text-[12px] text-red-600">{authError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setAuthModalOpen(false)} className="flex-1 h-10 bg-slate-100 text-slate-600 font-bold rounded-xl text-[12px]">Cancel</button>
              <button
                disabled={authBusy}
                onClick={async () => {
                  if (authBusy) return;
                  if (!supabaseConfigured) { setAuthError('Bu yerel önizleme Supabase hesabına bağlı değil. Giriş için geçerli Publishable/anon anahtarı yerel ortamda yapılandırılmalı.'); return; }
                  setAuthBusy(true); setAuthError(null);
                  try {
                  const result = await signIn(authEmail, authPassword);
                  if (result?.error) {
                    const raw = result.error.message || '';
                    setAuthError(/invalid api key|apikey/i.test(raw)
                      ? 'Supabase bağlantısı geçersiz. Vercel Production ortamındaki URL ve Publishable/anon key aynı Supabase projesine ait olmalı.'
                      : raw);
                    return;
                  }
                  setAuthModalOpen(false); setAuthError(null);
                  setAuthPassword('');
                  } catch { setAuthError('Giriş hizmetine ulaşılamadı. Lütfen yeniden deneyin.'); }
                  finally { setAuthBusy(false); }
                }}
                className="flex-1 h-10 bg-[#087FFF] hover:bg-[#0284C7] text-white font-bold rounded-xl text-[12px]"
              >
                {authBusy ? (lang === 'tr' ? 'Giriş yapılıyor…' : 'Please wait…') : footerCopy[lang].signIn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-sky-100 bg-white py-6 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-slate-500">
          <div className="space-y-0.5 text-center sm:text-left">
            <div className="font-bold text-[#0A2540] flex items-center gap-1.5 justify-center sm:justify-start">
              SafeInTürkiye 2026
              <button onClick={() => setAuthModalOpen(true)} title={footerCopy[lang].signIn} className="text-slate-300 hover:text-[#087FFF] cursor-pointer">
                <Lock className="w-3 h-3" />
              </button>
            </div>
            <img src={siteLogo} alt="SafeInTürkiye" className="w-48 h-auto object-contain mx-auto sm:mx-0 my-3" />
            <p>{footerCopy[lang].source}</p><PhotoCredits lang={lang} />
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-[#087FFF]">
            <span aria-disabled="true">{footerCopy[lang].privacy}</span>
            <span>•</span>
            <span aria-disabled="true">{footerCopy[lang].terms}</span>
            <span>•</span>
            <span>{footerCopy[lang].rights}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
