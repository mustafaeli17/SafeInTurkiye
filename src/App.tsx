import { useState, useEffect, useCallback, useRef } from 'react';
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
import { getAssistantReply } from './services/travelDataService';
import { supabaseConfigured } from './lib/supabase';
import { WeatherCard } from './components/WeatherCard';
import CurrencyRates from './components/CurrencyRates';
import NearbyPlaces from './components/NearbyPlaces';
import TransitPlanner from './components/TransitPlanner';
import TravelFaq, { TransportCardGuide } from './components/TravelFaq';
import ContentAdmin from './components/ContentAdmin';
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
  trafficIndex: string;
  trafficStatus: 'Low' | 'Moderate' | 'Heavy';
  localTip: string;
  highlights: { name: string; detail: string }[];
}

interface LiveWeather {
  temp: string;
  description: string;
  humidity: string;
  wind: string;
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

// Used only when the public tariff table is empty or the preview is running
// without Supabase. The figures are labelled as a dated reference estimate in
// the UI; a newer verified database row always takes precedence.
const istanbulReferenceTariff: TaxiTariff = {
  city: 'İstanbul',
  openingFare: 71.94,
  pricePerKm: 47.92,
  minimumFare: 230,
  waitingFarePerHour: 598.90,
  source: 'İBB/UKOME reference tariff · 20 Jul 2026',
  lastUpdated: '2026-07-20',
};

// Tam Çalışan Çeviri Sözlüğü
const dict: Record<SupportedLang, Record<string, string>> = {
  en: {
    heroTitle: 'Explore Türkiye with confidence',
    heroSub: 'Verified taxi tariffs, station guides, dated reference rates, and practical city information.',
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
  en: { more: 'More', safety: 'Safety guide', back: 'Back to home', taxiTitle: 'Taxi fare calculator', taxiSub: 'Estimate the fare with road distance and the dated official municipal tariff.', origin: 'From (origin)', destination: 'To (destination)', locate: 'Use current location', calculate: 'Calculate route & fare', estimate: 'Estimated fare range', distance: 'Road distance', duration: 'Estimated duration', miss: "Don't miss in", hotelsTitle: 'Hotels and cave stays', night: 'night', book: 'Request stay', diningTitle: 'Restaurants in Türkiye', hours: 'Hours', average: 'Average', reserve: 'Request table', activitiesTitle: 'Activities & tours', activitiesSub: 'Browse museums, cinema, entertainment, summer and winter ideas separately.', details: 'Details / request', safetySub: 'Practical essentials for a safer, calmer trip.', emergencyTitle: 'Emergency', emergencyText: 'Call 112 for ambulance, fire and police emergencies in Türkiye.', taxiSafety: 'Ask for the meter to be used and keep your receipt.', useful: 'Useful places', usefulText: 'Find published pharmacies, police desks, ATMs and taxi ranks nearby.', cityTransport: 'Getting around', noTraffic: 'Live traffic data is not connected; no fixed traffic percentage is shown.' },
  tr: { more: 'Daha fazla', safety: 'Güvenlik rehberi', back: 'Ana sayfaya dön', taxiTitle: 'Taksi ücreti hesaplama', taxiSub: 'Yol mesafesi ve tarihli resmî belediye tarifesiyle tahmini ücret hesaplayın.', origin: 'Nereden', destination: 'Nereye', locate: 'Konumumu kullan', calculate: 'Rota ve ücreti hesapla', estimate: 'Tahmini ücret aralığı', distance: 'Yol mesafesi', duration: 'Tahmini süre', miss: 'Kaçırmayın:', hotelsTitle: 'Oteller ve mağara konaklamaları', night: 'gece', book: 'Konaklama talebi', diningTitle: 'Türkiye’de restoranlar', hours: 'Saatler', average: 'Ortalama', reserve: 'Masa talebi', activitiesTitle: 'Aktiviteler ve turlar', activitiesSub: 'Müze, sinema, eğlence, yaz ve kış seçeneklerini ayrı inceleyin.', details: 'Bilgi / talep', safetySub: 'Daha güvenli ve sakin bir gezi için temel bilgiler.', emergencyTitle: 'Acil durum', emergencyText: 'Türkiye’de ambulans, itfaiye ve polis için 112’yi arayın.', taxiSafety: 'Taksimetrenin açılmasını isteyin ve fişinizi saklayın.', useful: 'Yararlı yerler', usefulText: 'Yakındaki kayıtlı eczane, polis noktası, ATM ve taksi duraklarını bulun.', cityTransport: 'Şehir içi ulaşım', noTraffic: 'Canlı trafik verisi bağlı değil; sabit trafik yüzdesi gösterilmiyor.' },
  de: { more: 'Mehr', safety: 'Sicherheit', back: 'Zur Startseite', taxiTitle: 'Taxipreis berechnen', taxiSub: 'Schätzung mit Straßenentfernung und datiertem amtlichem Tarif.', origin: 'Von', destination: 'Nach', locate: 'Standort verwenden', calculate: 'Route & Preis berechnen', estimate: 'Geschätzter Preis', distance: 'Straßenentfernung', duration: 'Geschätzte Dauer', miss: 'Nicht verpassen in', hotelsTitle: 'Hotels und Höhlenunterkünfte', night: 'Nacht', book: 'Unterkunft anfragen', diningTitle: 'Restaurants in Türkiye', hours: 'Öffnungszeiten', average: 'Durchschnitt', reserve: 'Tisch anfragen', activitiesTitle: 'Aktivitäten & Touren', activitiesSub: 'Museen, Kino, Unterhaltung sowie Sommer- und Winterideen.', details: 'Details / Anfrage', safetySub: 'Praktische Grundlagen für eine sichere Reise.', emergencyTitle: 'Notfall', emergencyText: 'Rufen Sie in Türkiye für Rettung, Feuerwehr und Polizei 112 an.', taxiSafety: 'Taxameter einschalten lassen und Beleg aufbewahren.', useful: 'Nützliche Orte', usefulText: 'Apotheken, Polizei, Geldautomaten und Taxistände in der Nähe finden.', cityTransport: 'Nahverkehr', noTraffic: 'Keine Live-Verkehrsdaten; es wird kein fester Prozentsatz angezeigt.' },
  fr: { more: 'Plus', safety: 'Sécurité', back: 'Retour à l’accueil', taxiTitle: 'Calcul du tarif taxi', taxiSub: 'Estimation selon la distance routière et le tarif municipal officiel daté.', origin: 'Départ', destination: 'Destination', locate: 'Utiliser ma position', calculate: 'Calculer trajet et tarif', estimate: 'Fourchette estimée', distance: 'Distance routière', duration: 'Durée estimée', miss: 'À ne pas manquer à', hotelsTitle: 'Hôtels et hébergements troglodytes', night: 'nuit', book: 'Demander un séjour', diningTitle: 'Restaurants en Türkiye', hours: 'Horaires', average: 'Moyenne', reserve: 'Demander une table', activitiesTitle: 'Activités et visites', activitiesSub: 'Musées, cinéma, loisirs et idées d’été ou d’hiver.', details: 'Détails / demande', safetySub: 'L’essentiel pour un voyage plus serein.', emergencyTitle: 'Urgence', emergencyText: 'Appelez le 112 pour ambulance, pompiers et police en Türkiye.', taxiSafety: 'Demandez le compteur et gardez le reçu.', useful: 'Lieux utiles', usefulText: 'Trouvez pharmacies, police, distributeurs et stations de taxi.', cityTransport: 'Se déplacer', noTraffic: 'Pas de trafic en direct ; aucun pourcentage fixe n’est affiché.' },
  ar: { more: 'المزيد', safety: 'دليل الأمان', back: 'العودة للرئيسية', taxiTitle: 'حاسبة أجرة التاكسي', taxiSub: 'تقدير حسب مسافة الطريق والتعرفة البلدية الرسمية المؤرخة.', origin: 'من', destination: 'إلى', locate: 'استخدم موقعي', calculate: 'احسب الطريق والأجرة', estimate: 'نطاق الأجرة التقديري', distance: 'مسافة الطريق', duration: 'المدة المقدرة', miss: 'لا تفوّت في', hotelsTitle: 'الفنادق والإقامات الكهفية', night: 'ليلة', book: 'طلب إقامة', diningTitle: 'مطاعم تركيا', hours: 'الساعات', average: 'المتوسط', reserve: 'طلب طاولة', activitiesTitle: 'الأنشطة والجولات', activitiesSub: 'المتاحف والسينما والترفيه وأنشطة الصيف والشتاء.', details: 'التفاصيل / طلب', safetySub: 'أساسيات عملية لرحلة أكثر أمانًا.', emergencyTitle: 'طوارئ', emergencyText: 'اتصل بـ112 للإسعاف والإطفاء والشرطة في تركيا.', taxiSafety: 'اطلب تشغيل العداد واحتفظ بالإيصال.', useful: 'أماكن مفيدة', usefulText: 'اعثر على الصيدليات والشرطة وأجهزة الصراف ومواقف التاكسي.', cityTransport: 'التنقل في المدينة', noTraffic: 'بيانات المرور المباشرة غير متصلة ولا نعرض نسبة ثابتة.' },
  ru: { more: 'Ещё', safety: 'Безопасность', back: 'На главную', taxiTitle: 'Расчёт стоимости такси', taxiSub: 'Оценка по дорожному расстоянию и датированному муниципальному тарифу.', origin: 'Откуда', destination: 'Куда', locate: 'Моё местоположение', calculate: 'Рассчитать маршрут и цену', estimate: 'Примерная стоимость', distance: 'Расстояние', duration: 'Примерное время', miss: 'Не пропустите в', hotelsTitle: 'Отели и пещерные гостиницы', night: 'ночь', book: 'Запросить проживание', diningTitle: 'Рестораны Турции', hours: 'Часы', average: 'Среднее', reserve: 'Запросить столик', activitiesTitle: 'Экскурсии и развлечения', activitiesSub: 'Музеи, кино, развлечения, летние и зимние идеи.', details: 'Подробнее / запрос', safetySub: 'Практические основы безопасной поездки.', emergencyTitle: 'Экстренная помощь', emergencyText: 'В Турции звоните 112 для скорой, пожарной и полиции.', taxiSafety: 'Попросите включить счётчик и сохраните чек.', useful: 'Полезные места', usefulText: 'Найдите аптеки, полицию, банкоматы и стоянки такси.', cityTransport: 'Транспорт', noTraffic: 'Онлайн-данные трафика не подключены; фиксированный процент не показывается.' },
  zh: { more: '更多', safety: '安全指南', back: '返回首页', taxiTitle: '出租车费用计算', taxiSub: '根据道路距离和注明日期的官方市政资费估算。', origin: '出发地', destination: '目的地', locate: '使用当前位置', calculate: '计算路线和费用', estimate: '预计费用范围', distance: '道路距离', duration: '预计时间', miss: '不可错过：', hotelsTitle: '酒店与洞穴住宿', night: '晚', book: '申请住宿', diningTitle: '土耳其餐厅', hours: '营业时间', average: '平均', reserve: '申请订桌', activitiesTitle: '活动与游览', activitiesSub: '分别浏览博物馆、影院、娱乐以及夏季和冬季活动。', details: '详情 / 申请', safetySub: '让旅程更安全从容的实用基础信息。', emergencyTitle: '紧急情况', emergencyText: '在土耳其需要救护车、消防或警察时拨打112。', taxiSafety: '请司机打表并保留收据。', useful: '实用地点', usefulText: '查找附近公开登记的药房、警察、ATM和出租车站。', cityTransport: '市内交通', noTraffic: '尚未接入实时交通数据，不显示固定拥堵百分比。' },
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
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Anitkabir_Ankara.jpg/1280px-Anitkabir_Ankara.jpg', lat: 39.9334, lng: 32.8597,
    temp: '', weatherDesc: '', humidity: '', wind: '', trafficIndex: '', trafficStatus: 'Low',
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
    trafficIndex: '68% (Heavy on Bridges)',
    trafficStatus: 'Heavy',
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
    trafficIndex: '12% (Smooth Open Roads)',
    trafficStatus: 'Low',
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
    coverImage: 'https://images.unsplash.com/photo-1657873882134-75e359b54a3b?auto=format&fit=crop&w=1200&q=80',
    lat: 36.8969, lng: 30.7133,
    temp: '30°C',
    weatherDesc: 'Warm & Sunny',
    humidity: '64%',
    wind: '12 km/h S',
    trafficIndex: '35% (Moderate Coastal Flow)',
    trafficStatus: 'Moderate',
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
    coverImage: 'https://image.arrivalguides.com/x/06/6f835a77a5b6bf807ad30ce5489da764.jpg',
    lat: 38.4237, lng: 27.1428,
    temp: '28°C',
    weatherDesc: 'Breezy & Sunny',
    humidity: '50%',
    wind: '22 km/h W',
    trafficIndex: '42% (Normal Flow)',
    trafficStatus: 'Moderate',
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
  color = '#00A3E0'
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
        html: `<div style="background-color:#00A3E0; width:16px; height:16px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>`,
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
          <Loader2 className="w-4 h-4 animate-spin text-[#00A3E0]" /> Harita modülü yükleniyor...
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />
    </div>
  );
}

// ============================================================================
// 4. ANA BİLEŞEN
// ============================================================================
export default function App() {
  const { session, isStaff, role, signIn, signOut } = useSupabaseAuth();
  const mockDataEnabled = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';
  const [activeTab, setActiveTab] = useState<'home' | 'city' | 'taxi' | 'transit' | 'currency' | 'nearme' | 'safety' | 'stay' | 'food' | 'experiences' | 'admin' | 'assistant'>('home');
  const [selectedCityName, setSelectedCityName] = useState<string>('İstanbul');
  const [lang, setLang] = useState<SupportedLang>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dil Metinleri Helper Fonksiyonu
  const tr = useCallback((k: string) => k === 'assistant' ? ({ en: 'Travel FAQ', tr: 'Sık Sorulan Sorular', de: 'Reisefragen', fr: 'Questions fréquentes', ar: 'الأسئلة الشائعة', zh: '常见问题', ru: 'Частые вопросы' }[lang]) : dict[lang]?.[k] || dict.en[k] || k, [lang]);
  const page = useCallback((key: string) => pageCopy[lang]?.[key] ?? pageCopy.en[key] ?? key, [lang]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
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
  const [liveWeather, setLiveWeather] = useState<LiveWeather | null>(null);

  const weatherDescription = (code: number) => {
    if (code === 0) return 'Clear sky';
    if ([1, 2, 3].includes(code)) return 'Partly cloudy';
    if ([45, 48].includes(code)) return 'Foggy';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain showers';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
    return 'Thunderstorms possible';
  };

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

  useEffect(() => {
    let cancelled = false;
    const loadQuotes = async () => {
      try {
        setExchangeError(null);
        const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=TRY,USD,GBP,CHF');
        if (!response.ok) throw new Error('Quote service unavailable');
        const data = await response.json();
        const eurTry = data.rates?.TRY;
        if (!eurTry) throw new Error('TRY reference unavailable');
        const makeQuote = (currency: string) => currency === 'EUR' ? eurTry : eurTry / data.rates[currency];
        if (!cancelled) {
          setExchangeQuotes(['EUR', 'USD', 'GBP', 'CHF'].map(currency => ({ pair: `${currency} / TRY`, rate: makeQuote(currency) })));
          setExchangeUpdatedAt(data.date || new Date().toISOString().slice(0, 10));
        }
      } catch {
        if (!cancelled) setExchangeError('Live reference rates are temporarily unavailable. No estimated rate is shown.');
      }
    };
    loadQuotes();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const city = citiesDetailedData[selectedCityName] || citiesDetailedData['İstanbul'];
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`)
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        if (!cancelled && data.current) {
          setLiveWeather({
            temp: `${Math.round(data.current.temperature_2m)}°C`,
            description: weatherDescription(data.current.weather_code),
            humidity: `${data.current.relative_humidity_2m}%`,
            wind: `${Math.round(data.current.wind_speed_10m)} km/h`
          });
        }
      })
      .catch(() => { if (!cancelled) setLiveWeather(null); });
    return () => { cancelled = true; };
  }, [selectedCityName]);

  // Soru Listesi Yatay Kaydırma
  const questionsScrollRef = useRef<HTMLDivElement>(null);
  const scrollQuestions = (direction: 'left' | 'right') => {
    if (questionsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      questionsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };


  const handleGlobalSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    const low = query.toLocaleLowerCase('tr-TR');
    const cityMatch = Object.keys(citiesDetailedData).find(city => city.toLocaleLowerCase('tr-TR') === low || city.toLowerCase().replace(/i̇/g, 'i') === query.toLowerCase());
    if (cityMatch) { setSelectedCityName(cityMatch); setActiveTab('city'); return; }
    if (/taksi|taxi|fare|ücret/.test(low)) setActiveTab('taxi');
    else if (/metro|otobüs|bus|tren|train|vapur|ferry|marmaray|ulaşım|transit|route|rota/.test(low)) setActiveTab('transit');
    else if (/döviz|kur|exchange|currency|euro|usd/.test(low)) setActiveTab('currency');
    else if (/yakın|near|eczane|pharmacy|hastane|hospital|atm|polis|police/.test(low)) setActiveTab('nearme');
    else if (/otel|hotel|konak|stay/.test(low)) setActiveTab('stay');
    else if (/restoran|restaurant|yemek|food|cafe|kafe/.test(low)) setActiveTab('food');
    else if (/aktiv|activity|etkinlik|museum|müze|gez/.test(low)) setActiveTab('experiences');
    else if (/güven|safety|acil|emergency/.test(low)) setActiveTab('safety');
    else {
      setActiveTab('assistant');
    }
  };

  // Rezervasyon Modal State & İsim Girmeme Hata Kontrolü
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [selectedBookingItem, setSelectedBookingItem] = useState<any>(null);
  const [selectedBookingType, setSelectedBookingType] = useState<'hotel' | 'restaurant' | 'activity'>('activity');
  const [guestFullName, setGuestFullName] = useState('');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);
  const [bookingRequest, setBookingRequest] = useState<{
    code: string;
    itemTitle: string;
    city: string;
    price: string;
    guest: string;
    date: string;
  } | null>(null);

  const handleOpenBooking = (item: any, listingType: 'hotel' | 'restaurant' | 'activity') => {
    setSelectedBookingItem(item);
    setSelectedBookingType(listingType);
    setBookingRequest(null);
    setGuestFullName('');
    setBookingErrorMsg(null);
    setReservationModalOpen(true);
  };

  const handleConfirmReservation = async () => {
    setBookingErrorMsg(null);
    if (!guestFullName.trim()) {
      setBookingErrorMsg('Please enter the lead guest name.');
      return;
    }
    if (!supabaseConfigured) { setBookingErrorMsg('Bu önizleme hesap hizmetine bağlı değil. Rezervasyon talebi şu anda gönderilemiyor.'); return; }
    if (!session?.user) { setBookingErrorMsg('Talebinizi göndermek için giriş yapın; sonra bu forma dönebilirsiniz.'); setAuthModalOpen(true); return; }
    try {
      const booking = await createBooking({
        listingType: selectedBookingType, listingName: selectedBookingItem.title || selectedBookingItem.name,
        guestName: guestFullName, guestEmail: session.user.email ?? '', visitDate: bookingDate, guestCount: 1,
      });
      setBookingRequest({ code: booking.reference_code, itemTitle: selectedBookingItem.title || selectedBookingItem.name, city: selectedBookingItem.city, price: selectedBookingItem.price || selectedBookingItem.avgPrice, guest: guestFullName, date: bookingDate });
    } catch (error) { setBookingErrorMsg(error instanceof Error ? error.message : 'Could not submit the booking request.'); }
  };

  // Taksi Durumları
  const [detectedTaxiCity, setDetectedTaxiCity] = useState<string>('İstanbul');
  const [taxiOriginText, setTaxiOriginText] = useState('');
  const [taxiDestText, setTaxiDestText] = useState('');
  const [taxiOriginCoords, setTaxiOriginCoords] = useState<Coordinates | null>(null);
  const [taxiDestCoords, setTaxiDestCoords] = useState<Coordinates | null>(null);
  const [taxiOriginSuggs, setTaxiOriginSuggs] = useState<GeocodedPlace[]>([]);
  const [taxiDestSuggs, setTaxiDestSuggs] = useState<GeocodedPlace[]>([]);
  const [taxiClass, setTaxiClass] = useState<'Yellow' | 'Turquoise' | 'Black'>('Yellow');

  const [isTaxiLocating, setIsTaxiLocating] = useState(false);
  const [isTaxiRouting, setIsTaxiRouting] = useState(false);
  const [taxiRouteError, setTaxiRouteError] = useState<string | null>(null);
  const [taxiTariffs, setTaxiTariffs] = useState<Record<string, TaxiTariff>>({});

  useEffect(() => {
    if (!supabaseConfigured) return;
    void getCurrentTaxiTariffs(detectedTaxiCity).then((tariffs) => {
      const next: Record<string, TaxiTariff> = {};
      for (const tariff of tariffs) next[tariff.vehicleClass] = { city: tariff.city, openingFare: tariff.openingFare, pricePerKm: tariff.perKm, minimumFare: tariff.minimumFare, waitingFarePerHour: tariff.waitingFare, source: 'Verified SafeInTürkiye data source', lastUpdated: tariff.effectiveFrom };
      setTaxiTariffs(next);
      if (Object.keys(next).length === 0 && detectedTaxiCity === 'İstanbul') setTaxiTariffs({ YELLOW: istanbulReferenceTariff });
    }).catch(() => setTaxiTariffs(detectedTaxiCity === 'İstanbul' ? { YELLOW: istanbulReferenceTariff } : {}));
  }, [detectedTaxiCity]);

  const [taxiRouteResult, setTaxiRouteResult] = useState<{
    distanceKm: number;
    durationMinutes: number;
    geometry: RouteGeometryPoint[];
    source: string;
  } | null>(null);

  const [fareCalculation, setFareCalculation] = useState<{ minFare: number; maxFare: number; disclaimer: string } | null>(null);

  const autoDetectCityFromCoords = (lat: number, lng: number): string => {
    if (lat >= 40.8 && lat <= 41.4 && lng >= 28.0 && lng <= 30.0) return 'İstanbul';
    if (lat >= 39.5 && lat <= 40.3 && lng >= 32.2 && lng <= 33.5) return 'Ankara';
    if (lat >= 38.0 && lat <= 38.8 && lng >= 26.5 && lng <= 27.6) return 'İzmir';
    if (lat >= 36.4 && lat <= 37.4 && lng >= 30.0 && lng <= 32.2) return 'Antalya';
    return 'İstanbul';
  };

  useEffect(() => {
    if (!taxiOriginText || taxiOriginCoords) {
      setTaxiOriginSuggs([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(taxiOriginText)}&limit=5&lat=41.0082&lon=28.9784`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.features) {
          setTaxiOriginSuggs(data.features.map((f: any) => ({
            label: [f.properties.name, f.properties.city, f.properties.country].filter(Boolean).join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            city: f.properties.city || f.properties.state
          })));
        }
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [taxiOriginText, taxiOriginCoords]);

  useEffect(() => {
    if (!taxiDestText || taxiDestCoords) {
      setTaxiDestSuggs([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(taxiDestText)}&limit=5&lat=41.0082&lon=28.9784`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.features) {
          setTaxiDestSuggs(data.features.map((f: any) => ({
            label: [f.properties.name, f.properties.city, f.properties.country].filter(Boolean).join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            city: f.properties.city || f.properties.state
          })));
        }
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [taxiDestText, taxiDestCoords]);

  const handleTaxiCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setTaxiRouteError('Geolocation is not supported by your browser.');
      return;
    }
    setIsTaxiLocating(true);
    setTaxiRouteError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsTaxiLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setTaxiOriginCoords(coords);
        setTaxiOriginText('Fetching address...');

        const detected = autoDetectCityFromCoords(coords.lat, coords.lng);
        setDetectedTaxiCity(detected);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=16`);
          if (res.ok) {
            const data = await res.json();
            setTaxiOriginText(data.display_name || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
          } else {
            setTaxiOriginText(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
          }
        } catch {
          setTaxiOriginText(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        }
      },
      () => {
        setIsTaxiLocating(false);
        setTaxiRouteError('Location access was denied.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCalculateTaxiRoute = async () => {
    setTaxiRouteError(null);
    setTaxiRouteResult(null);
    setFareCalculation(null);

    if (!taxiOriginCoords || !taxiDestCoords) {
      setTaxiRouteError('Please select both a valid origin and destination from suggestions or use Current Location.');
      return;
    }

    setIsTaxiRouting(true);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${taxiOriginCoords.lng},${taxiOriginCoords.lat};${taxiDestCoords.lng},${taxiDestCoords.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      setIsTaxiRouting(false);

      if (!res.ok) {
        setTaxiRouteError('Could not calculate route. Please try again.');
        return;
      }

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        setTaxiRouteError('No drivable route found between these locations.');
        return;
      }

      const primary = data.routes[0];
      const distanceKm = Number((primary.distance / 1000).toFixed(2));
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

      const tariff = taxiTariffs[taxiClass.toUpperCase()] ?? (detectedTaxiCity === 'İstanbul' ? istanbulReferenceTariff : undefined);
      if (!tariff) {
        setTaxiRouteError('Verified taxi tariffs are unavailable for this city. Configure Supabase and publish a current tariff before showing an estimate.');
        setIsTaxiRouting(false);
        return;
      }
      const classMult = taxiClass === 'Yellow' ? 1.0 : taxiClass === 'Turquoise' ? 1.15 : 1.70;

      const opening = tariff.openingFare * classMult;
      const perKm = tariff.pricePerKm * classMult;

      const baseFare = opening + (distanceKm * perKm);
      const minCalculated = Math.max(Math.round(baseFare), Math.round(tariff.minimumFare * classMult));
      const maxCalculated = Math.max(Math.round(baseFare * 1.15), minCalculated + 40);

      setFareCalculation({
        minFare: minCalculated,
        maxFare: maxCalculated,
        disclaimer: 'Estimated fare. Final taximeter fare may vary depending on actual waiting time at traffic lights and toll fees.'
      });
    } catch {
      setIsTaxiRouting(false);
      setTaxiRouteError('Routing service network error. Please check your internet connection.');
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
  const [hotelsList, setHotelsList] = useState([
    { id: 'h1', name: 'Kaleiçi Heritage Hotel & Spa', city: 'Antalya', area: 'Old Town', roomType: 'Deluxe Suite', price: '₺3,200', rating: '4.9', amenities: 'Pool, Spa, Marina Walk', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
    { id: 'h2', name: 'Göreme Valley Cave Suites', city: 'Cappadocia', area: 'Göreme', roomType: 'Fairy Chimney Cave', price: '₺5,800', rating: '5.0', amenities: 'Terrace, Balloon View', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80' },
    { id: 'h3', name: 'Bosphorus Palace Waterfront', city: 'İstanbul', area: 'Beşiktaş', roomType: 'Sea Front King', price: '₺7,400', rating: '4.8', amenities: 'Sea View, Fine Dining', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' }
  ]);

  const [restaurantsList, setRestaurantsList] = useState([
    { id: 'r1', name: 'Tarihi Sultanahmet Köftecisi (Est. 1920)', city: 'İstanbul', cuisine: 'Traditional Meatballs & Piyaz', avgPrice: '₺350 / person', openHours: '10:30 - 23:00', rating: '4.9', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
    { id: 'r2', name: 'Çiya Sofrası Anatolian Delights', city: 'İstanbul', cuisine: 'Regional Anatolian Herbs & Stews', avgPrice: '₺450 / person', openHours: '11:30 - 22:30', rating: '4.9', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80' },
    { id: 'r3', name: '7 Mehmet Mediterranean Cuisine', city: 'Antalya', cuisine: 'Fresh Seafood & Mediterranean', avgPrice: '₺800 / person', openHours: '12:00 - 00:00', rating: '4.8', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' }
  ]);

  const [activitiesList, setActivitiesList] = useState([
    { id: 'a1', title: 'Göreme Open-Air Museum', city: 'Cappadocia', category: 'Museum & Culture', duration: '2–3 Hours', price: 'Check official ticket', guideLang: 'Audio guide options', rating: '—', description: 'Rock-cut churches and frescoes; morning visits are usually calmer.', img: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=900&q=80' },
    { id: 'a2', title: 'Museum of Anatolian Civilizations', city: 'Ankara', category: 'Museum & Culture', duration: '2–3 Hours', price: 'Check official ticket', guideLang: 'Museum information', rating: '—', description: 'A practical introduction to Anatolia before exploring Ankara Castle.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Anadolu_Medeniyetleri_M%C3%BCzesi.jpg/960px-Anadolu_Medeniyetleri_M%C3%BCzesi.jpg' },
    { id: 'a3', title: 'Topkapı Palace & Historic Peninsula', city: 'İstanbul', category: 'Museum & Culture', duration: 'Half day', price: 'Check official ticket', guideLang: 'Audio guide options', rating: '—', description: 'Allow extra time for security queues and separate ticketed sections.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Topkapi_Palace%2C_Istanbul.jpg/960px-Topkapi_Palace%2C_Istanbul.jpg' },
    { id: 'a4', title: 'Cinema Night in Beyoğlu', city: 'İstanbul', category: 'Cinema', duration: 'Film schedule', price: 'Check programme', guideLang: 'Original/subtitled varies', rating: '—', description: 'Compare nearby cinema programmes and check the film language and subtitles before buying.', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80' },
    { id: 'a5', title: 'Independent Cinema Evening', city: 'Ankara', category: 'Cinema', duration: '2–3 Hours', price: 'Check programme', guideLang: 'Varies by screening', rating: '—', description: 'Compare the current programme and subtitle language before travelling.', img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80' },
    { id: 'a6', title: 'Bosphorus Public Ferry Sunset', city: 'İstanbul', category: 'Entertainment', duration: '1.5–2 Hours', price: 'Transit fare applies', guideLang: 'Self-guided', rating: '—', description: 'A useful low-cost alternative to an unverified private cruise offer.', img: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=900&q=80' },
    { id: 'a7', title: 'Kaleiçi Evening Walk', city: 'Antalya', category: 'Entertainment', duration: '2 Hours', price: 'Free', guideLang: 'Self-guided', rating: '—', description: 'Harbour views, old streets and restaurants; confirm venue closing times.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Kalei%C3%A7i.jpg/960px-Kalei%C3%A7i.jpg' },
    { id: 'a8', title: 'Kaş Sea Kayaking', city: 'Antalya', category: 'Summer', duration: 'Half day', price: 'Request current quote', guideLang: 'Operator dependent', rating: '—', description: 'Seasonal and weather-dependent. Confirm insurance, equipment and cancellation terms.', img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80' },
    { id: 'a9', title: 'Cappadocia Sunrise Viewpoints', city: 'Cappadocia', category: 'Summer', duration: '2–3 Hours', price: 'Viewpoints vary', guideLang: 'Self-guided', rating: '—', description: 'Balloon flights are weather-dependent; viewpoints do not guarantee a launch.', img: 'https://images.unsplash.com/photo-1557972359-152b6ebd3eb3?auto=format&fit=crop&w=900&q=80' },
    { id: 'a10', title: 'Erciyes Ski Day', city: 'Kayseri', category: 'Winter', duration: 'Full day', price: 'Seasonal', guideLang: 'Operator dependent', rating: '—', description: 'Check snow, lift status, equipment rental and return transport before leaving.', img: 'https://images.unsplash.com/photo-1486911278844-a81c5267e227?auto=format&fit=crop&w=900&q=80' },
    { id: 'a11', title: 'Uludağ Winter Day Trip', city: 'Bursa', category: 'Winter', duration: 'Full day', price: 'Seasonal', guideLang: 'Self-guided/operator', rating: '—', description: 'Cable-car and road access can change with weather; verify on the travel day.', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Uluda%C4%9F_Kayak_Merkezi-_Uludag_Ski_Center.jpg/960px-Uluda%C4%9F_Kayak_Merkezi-_Uludag_Ski_Center.jpg' }
  ]);
  const [activityCategory, setActivityCategory] = useState('All');

  const [nearbyPlacesList, setNearbyPlacesList] = useState([
    { id: 'n1', name: 'Nöbetçi Eczane (24/7 Duty Pharmacy)', dist: '180m', addr: 'Sıraselviler Cad. No:24, Taksim', cat: 'Pharmacy', phone: '+90 212 244 10 10', is247: true },
    { id: 'n2', name: 'Taksim Tourist Police Desk', dist: '320m', addr: 'Taksim Square Subway Entrance', cat: 'Police', phone: '+90 212 527 45 03', is247: true },
    { id: 'n3', name: 'Ziraat & Garanti Contactless Multi-ATM', dist: '90m', addr: 'İstiklal Cad. No:45', cat: 'ATM', phone: '112', is247: true },
    { id: 'n4', name: 'Taksim Gümüşsuyu Taxi Stand', dist: '140m', addr: 'Gümüşsuyu Cad. Taksim', cat: 'Taxi', phone: '+90 212 249 05 05', is247: true }
  ]);


  const currentCityInfo = citiesDetailedData[selectedCityName] || citiesDetailedData['İstanbul'];

  if (!supabaseConfigured && !mockDataEnabled) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <section className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
          <ShieldCheck className="w-10 h-10 text-[#00A3E0] mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900">SafeInTürkiye is not configured</h1>
          <p className="mt-3 text-sm text-slate-600">Set the public Supabase URL and anon key to show verified content. Demo data is disabled by default.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F7FB] text-[#0A2540] font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-between">
      
      {/* ====================================================================
          NAVBAR (TAŞMAYI ÖNLEYEN & TÜM SAYFALARI DESTEKLEYEN YAPI)
      ==================================================================== */}
      <div>
        <header className="sticky top-0 z-40 bg-white border-b border-sky-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <div onClick={() => setActiveTab('home')} className="flex items-center cursor-pointer shrink-0" aria-label="SafeInTürkiye home">
              <img src={siteLogo} alt="SafeInTürkiye" className="h-9 w-auto max-w-[150px] object-contain sm:h-10 sm:max-w-[185px]" />
            </div>

            {/* Menü Butonları */}
            <nav className="hidden lg:flex items-center gap-1.5 text-[13px] font-bold text-slate-600">
              <button 
                onClick={() => setActiveTab('home')} 
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'home' ? 'text-[#00A3E0] bg-sky-50 font-extrabold' : 'hover:text-[#00A3E0] hover:bg-slate-50'
                }`}
              >
                {tr('explore')}
              </button>
              
              <button 
                onClick={() => setActiveTab('assistant')} 
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-extrabold ${
                  activeTab === 'assistant' ? 'bg-[#00A3E0] text-white shadow-sm shadow-sky-500/20' : 'bg-sky-50 text-[#00A3E0] hover:bg-sky-100'
                }`}
              >
                <Bot className="w-4 h-4" /> {tr('assistant')}
              </button>
              
              <button 
                onClick={() => setActiveTab('taxi')} 
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'taxi' ? 'text-[#00A3E0] bg-sky-50 font-extrabold' : 'hover:text-[#00A3E0] hover:bg-slate-50'
                }`}
              >
                {tr('taxi')}
              </button>
              
              <button 
                onClick={() => setActiveTab('transit')} 
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'transit' ? 'text-[#00A3E0] bg-sky-50 font-extrabold' : 'hover:text-[#00A3E0] hover:bg-slate-50'
                }`}
              >
                {tr('transit')}
              </button>
              
              <button 
                onClick={() => setActiveTab('currency')} 
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'currency' ? 'text-[#00A3E0] bg-sky-50 font-extrabold' : 'hover:text-[#00A3E0] hover:bg-slate-50'
                }`}
              >
                {tr('currency')}
              </button>
              
              <button 
                onClick={() => { setSelectedCityName('İstanbul'); setActiveTab('city'); }} 
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'city' ? 'text-[#00A3E0] bg-sky-50 font-extrabold' : 'hover:text-[#00A3E0] hover:bg-slate-50'
                }`}
              >
                {tr('cityWeather')}
              </button>

              {/* Sığmayanlar için "More" Açılır Menüsü */}
              <div className="relative">
                <button
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    ['stay', 'food', 'experiences', 'nearme', 'safety'].includes(activeTab) ? 'text-[#00A3E0] bg-sky-50 font-extrabold' : 'hover:text-[#00A3E0] hover:bg-slate-50'
                  }`}
                >
                  <span>{page('more')}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {moreDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 flex flex-col space-y-0.5 text-[12px]">
                    <button onClick={() => { setActiveTab('stay'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Hotel className="w-4 h-4 text-[#00A3E0]" /> {tr('hotels')}
                    </button>
                    <button onClick={() => { setActiveTab('food'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-[#00A3E0]" /> {tr('dining')}
                    </button>
                    <button onClick={() => { setActiveTab('experiences'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#00A3E0]" /> {tr('activities')}
                    </button>
                    <button onClick={() => { setActiveTab('nearme'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Navigation2 className="w-4 h-4 text-[#00A3E0]" /> {tr('nearMe')}
                    </button>
                    <button onClick={() => { setActiveTab('safety'); setMoreDropdownOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-slate-700 font-bold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#00A3E0]" /> {page('safety')}
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
            <div className="flex items-center gap-2.5 shrink-0">
              <button type="button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(value => !value)} className="lg:hidden w-9 h-9 rounded-xl bg-sky-50 text-[#00A3E0] flex items-center justify-center">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as SupportedLang)}
                className="h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 focus:outline-none cursor-pointer hover:bg-sky-50"
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
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-extrabold shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tr('emergency')}</span>
              </a>
            </div>
          </div>
          {mobileMenuOpen && <nav className="lg:hidden border-t border-sky-100 bg-white px-4 py-3 grid grid-cols-2 gap-2 text-[12px] font-bold">
            {([
              ['assistant', tr('assistant')], ['taxi', tr('taxi')], ['transit', tr('transit')], ['currency', tr('currency')], ['city', tr('cityWeather')], ['nearme', tr('nearMe')], ['stay', tr('hotels')], ['food', tr('dining')], ['experiences', tr('activities')], ['safety', page('safety')],
            ] as const).map(([tab, label]) => <button key={tab} type="button" onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }} className={`rounded-xl px-3 py-2 text-left ${activeTab === tab ? 'bg-sky-50 text-[#00A3E0]' : 'bg-slate-50 text-slate-700'}`}>{label}</button>)}
            {isStaff && <button type="button" onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }} className="rounded-xl px-3 py-2 text-left bg-slate-900 text-white">CMS Studio</button>}
          </nav>}
        </header>

        {/* ====================================================================
            PAGE 1: EXPLORE
        ==================================================================== */}
        {activeTab === 'home' && (
          <main className="space-y-12 pb-24">
            <section className="relative h-[380px] sm:h-[420px] flex items-center justify-center text-center px-4 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1920&q=80"
                alt="Istanbul Ortakoy" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/45" />

              <div className="relative z-10 max-w-2xl space-y-3">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">
                  {tr('heroTitle')}
                </h1>
                <p className="text-xs sm:text-sm text-white/95 font-medium max-w-md mx-auto">
                  {tr('heroSub')}
                </p>

                <div className="pt-2 max-w-lg mx-auto">
                  <div className="flex items-center bg-white rounded-xl shadow-xl px-4 py-1 border border-sky-100 focus-within:ring-2 focus-within:ring-[#00A3E0]">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={tr('searchPlaceholder')}
                      onKeyDown={(event) => { if (event.key === 'Enter') handleGlobalSearch(); }}
                      className="w-full h-11 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                    />
                    <button 
                      onClick={handleGlobalSearch}
                      className="text-[#00A3E0] hover:text-[#0284C7] p-1.5 cursor-pointer"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 8'li Araç Kutusu */}
            <section className="max-w-6xl mx-auto px-6 -mt-14 relative z-20">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
                {[
                  { name: tr('assistant'), sub: lang === 'tr' ? 'Pratik seyahat rehberi' : 'Practical travel guide', icon: Bot, action: () => setActiveTab('assistant') },
                  { name: tr('taxi'), sub: 'UKOME tariff & route', icon: Car, action: () => setActiveTab('taxi') },
                  { name: tr('transit'), sub: 'Metro & Ferry Routes', icon: Train, action: () => setActiveTab('transit') },
                  { name: tr('currency'), sub: 'Reference rates & nearby bureaux', icon: Coins, action: () => setActiveTab('currency') },
                  { name: tr('cityWeather'), sub: 'Weather, museums & city tips', icon: Compass, action: () => setActiveTab('city') },
                  { name: tr('hotels'), sub: 'Verified Stays', icon: Building2, action: () => setActiveTab('stay') },
                  { name: tr('dining'), sub: 'Historic Kitchens', icon: Utensils, action: () => setActiveTab('food') },
                  { name: ({tr:'Aktiviteler',en:'Activities',de:'Aktivitäten',fr:'Activités',ar:'الأنشطة',zh:'活动',ru:'Развлечения'})[lang], sub: lang === 'tr' ? 'Turlar ve deneyimler' : 'Tours & experiences', icon: Ticket, action: () => setActiveTab('experiences') },
                  { name: tr('nearMe'), sub: 'Pharmacy, Police, ATM', icon: Navigation2, action: () => setActiveTab('nearme') }
                ].map((tool, idx) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={idx}
                      onClick={tool.action}
                      className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-sm hover:shadow-md hover:border-[#00A3E0] transition-all flex flex-col items-center text-center group cursor-pointer active:scale-95"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 bg-sky-50 text-[#00A3E0]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-800 leading-tight">{tool.name}</span>
                      <span className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">{tool.sub}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="max-w-6xl mx-auto px-6 pt-2">
              <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{tr('popCities')}</h2>
                  <p className="text-[12px] text-slate-500 mt-1">{tr('popCitiesSub')}</p>
                </div>
                <button onClick={() => setActiveTab('city')} className="text-[12px] font-bold text-[#00A3E0] hover:underline">{tr('viewAll')}</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['İstanbul', 'Ankara', 'Cappadocia', 'Antalya', 'İzmir'] as const).map((cityName) => {
                  const city = citiesDetailedData[cityName];
                  return <button key={cityName} onClick={() => { setSelectedCityName(cityName); setActiveTab('city'); }} className="group text-left bg-white rounded-2xl border border-sky-100 overflow-hidden shadow-sm hover:shadow-md hover:border-[#00A3E0] transition-all cursor-pointer">
                    {city.coverImage ? <img src={city.coverImage} alt={city.name} className="w-full h-28 sm:h-36 object-cover group-hover:scale-[1.02] transition-transform" /> : <div className="h-28 sm:h-36 bg-sky-100 flex items-center justify-center text-sky-800 font-bold">Ankara</div>}
                    <span className="block px-3 py-2.5 text-[13px] font-extrabold text-slate-900">{city.name}</span>
                  </button>;
                })}
              </div>
            </section>
          </main>
        )}

        {/* ====================================================================
            PAGE 2: AI TRAVEL ASSISTANT
        ==================================================================== */}
        {activeTab === 'assistant' && <TravelFaq lang={lang} initialQuery={searchQuery} />}

        {/* ====================================================================
            PAGE 3: TAKİ HESAPLAYICI
        ==================================================================== */}
        {activeTab === 'taxi' && (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 font-bold text-[#00A3E0] hover:underline cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> {page('back')}
              </button>
              <span>/</span>
              <span className="text-slate-800 font-bold">{page('taxiTitle')}</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{page('taxiTitle')}</h1>
              <p className="text-[13px] text-slate-500">{page('taxiSub')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-sky-100 shadow-sm space-y-4">
                <div className="p-3 bg-sky-50 border border-sky-200/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#00A3E0]" />
                    <span className="text-[12px] text-slate-600">Active Tariff:</span>
                  </div>
                  <span className="font-extrabold text-[12px] text-[#00A3E0] bg-white px-2 py-0.5 rounded-md border border-sky-200">
                    {detectedTaxiCity} ({taxiTariffs[taxiClass.toUpperCase()]?.source ?? (detectedTaxiCity === 'İstanbul' ? istanbulReferenceTariff.source : 'current tariff unavailable')})
                  </span>
                </div>

                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[12px] font-bold text-slate-700">{page('origin')}</label>
                    <button
                      type="button"
                      onClick={handleTaxiCurrentLocation}
                      disabled={isTaxiLocating}
                      className="text-[11px] font-bold text-[#00A3E0] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isTaxiLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation2 className="w-3 h-3" />}
                      {page('locate')}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={taxiOriginText}
                    onChange={(e) => {
                      setTaxiOriginText(e.target.value);
                      setTaxiOriginCoords(null);
                    }}
                    placeholder="Search departure place (e.g. Taksim, IST Airport)..."
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A3E0]"
                  />
                  {taxiOriginSuggs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {taxiOriginSuggs.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setTaxiOriginText(s.label);
                            setTaxiOriginCoords({ lat: s.lat, lng: s.lng });
                            setTaxiOriginSuggs([]);
                            const detected = autoDetectCityFromCoords(s.lat, s.lng);
                            setDetectedTaxiCity(detected);
                          }}
                          className="p-2.5 hover:bg-sky-50 cursor-pointer text-[12px] text-slate-700 border-b border-slate-100 last:border-none"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#00A3E0] inline mr-1.5" />
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="text-[12px] font-bold text-slate-700 block mb-1">{page('destination')}</label>
                  <input
                    type="text"
                    value={taxiDestText}
                    onChange={(e) => {
                      setTaxiDestText(e.target.value);
                      setTaxiDestCoords(null);
                    }}
                    placeholder="Search destination (e.g. Kadıköy, Sultanahmet)..."
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A3E0]"
                  />
                  {taxiDestSuggs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {taxiDestSuggs.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setTaxiDestText(s.label);
                            setTaxiDestCoords({ lat: s.lat, lng: s.lng });
                            setTaxiDestSuggs([]);
                          }}
                          className="p-2.5 hover:bg-sky-50 cursor-pointer text-[12px] text-slate-700 border-b border-slate-100 last:border-none"
                        >
                          <MapPin className="w-3.5 h-3.5 text-red-500 inline mr-1.5" />
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCalculateTaxiRoute}
                  disabled={isTaxiRouting}
                  className="w-full h-11 bg-[#00A3E0] hover:bg-[#0284C7] text-white font-bold rounded-xl text-[13px] shadow-sm cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  {isTaxiRouting ? <Loader2 className="w-4 h-4 animate-spin" /> : page('calculate')}
                </button>

                {taxiRouteResult && fareCalculation && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 space-y-2">
                      <span className="text-[11px] text-slate-500 font-semibold block">{page('estimate')}</span>
                      <span className="text-3xl font-black text-slate-900">
                        ₺{fareCalculation.minFare} – ₺{fareCalculation.maxFare}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{taxiTariffs[taxiClass.toUpperCase()]?.source ?? istanbulReferenceTariff.source}. Estimate only; meter and traffic can change the final amount.</span>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-200/60 text-[12px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{page('distance')}</span>
                          <span className="font-bold text-slate-800">{taxiRouteResult.distanceKm} km</span>
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
                  color="#00A3E0"
                />
              </div>
            </div>
          </main>
        )}

        {/* ====================================================================
            PAGE 4: TOPLU TAŞIMA (TRANSIT - DÜZELTİLDİ VE AKTİF)
        ==================================================================== */}
        {activeTab === 'transit' && <TransitPlanner lang={lang} />}

        {/* ====================================================================
            PAGE 5: EXCHANGE (CANLI KURLAR + YAKINLARDAKİ DÖVİZCİLER - DÜZELTİLDİ)
        ==================================================================== */}
        {activeTab === 'currency' && (
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <h1 className="text-3xl font-extrabold text-slate-900">{({ en: 'Currency and exchange bureaux', tr: 'Döviz ve döviz büroları', de: 'Wechselkurse und Wechselstuben', fr: 'Change et bureaux de change', ar: 'العملات ومكاتب الصرافة', ru: 'Валюта и обменные пункты', zh: '汇率与附近兑换点' } as Record<SupportedLang, string>)[lang]}</h1>
            <CurrencyRates lang={lang} />
            <NearbyPlaces kind="exchange" lang={lang} center={{ lat: currentCityInfo.lat, lng: currentCityInfo.lng }} cityName={currentCityInfo.name} />
          </main>
        )}

        {/* ====================================================================
            PAGE 6: CITIES & WEATHER
        ==================================================================== */}
        {activeTab === 'city' && (
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['İstanbul', 'Ankara', 'Cappadocia', 'Antalya', 'İzmir'].map((cname) => (
                <button
                  key={cname}
                  onClick={() => setSelectedCityName(cname)}
                  className={`px-4 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all ${
                    selectedCityName === cname ? 'bg-[#00A3E0] text-white shadow-sm' : 'bg-white border border-sky-100 text-slate-600 hover:bg-sky-50'
                  }`}
                >
                  {cname}
                </button>
              ))}
            </div>

            <div className="relative h-64 rounded-3xl overflow-hidden shadow-md flex items-end p-6 text-white">
              {currentCityInfo.coverImage && <img src={currentCityInfo.coverImage} alt={currentCityInfo.name} className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="relative z-10">
                <h1 className="text-3xl font-black">{currentCityInfo.name}</h1>
                <p className="text-[13px] text-slate-200">{currentCityInfo.tagline}</p>
              </div>
            </div>

            {selectedCityName === 'Ankara' && <p className="text-xs text-slate-500">Anıtkabir: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Anitkabir_Ankara.jpg" target="_blank" rel="noreferrer">Lethiciasouza / Wikimedia Commons</a> · <a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a> · {lang === 'tr' ? 'Görünüm için kırpılmıştır.' : 'Cropped for display.'}</p>}
            <TransportCardGuide city={selectedCityName} lang={lang} />
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
                <Building2 className="w-5 h-5 text-[#00A3E0]" />
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

          </main>
        )}

        {/* ====================================================================
            PAGE 7: OTELLER (HOTELS)
        ==================================================================== */}
        {activeTab === 'stay' && (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <h1 className="text-3xl font-extrabold text-slate-900">{page('hotelsTitle')}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {hotelsList.map(h => (
                <div key={h.id} className="bg-white rounded-2xl border border-sky-100 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="h-44 w-full relative">
                    <img src={h.img} alt={h.name} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-bold">{h.city}</span>
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#00A3E0] text-white rounded text-[10px] font-bold">★ {h.rating}</span>
                  </div>
                  <div className="p-4 space-y-1">
                    <strong className="text-[14px] text-slate-900 block">{h.name}</strong>
                    <span className="text-[12px] text-[#00A3E0] font-semibold">{h.roomType}</span>
                    <p className="text-[11px] text-slate-500">{h.amenities}</p>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-[#00A3E0]">{h.price} / {page('night')}</span>
                    <button 
                      onClick={() => handleOpenBooking(h, 'hotel')}
                      className="px-4 py-1.5 bg-[#00A3E0] hover:bg-[#0284C7] text-white rounded-xl text-[12px] font-bold cursor-pointer"
                    >
                      {page('book')}
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
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <h1 className="text-3xl font-extrabold text-slate-900">{page('diningTitle')}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {restaurantsList.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-sky-100 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="h-44 w-full relative">
                    <img src={r.img} alt={r.name} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-bold">{r.city}</span>
                  </div>
                  <div className="p-4 space-y-1">
                    <strong className="text-[14px] text-slate-900 block">{r.name}</strong>
                    <span className="text-[12px] text-[#00A3E0] font-semibold">{r.cuisine}</span>
                    <span className="text-[11px] text-slate-400 block">{page('hours')}: {r.openHours}</span>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-600">{page('average')}: {r.avgPrice}</span>
                    <button 
                      onClick={() => handleOpenBooking(r, 'restaurant')}
                      className="px-4 py-1.5 bg-[#00A3E0] hover:bg-[#0284C7] text-white rounded-xl text-[12px] font-bold cursor-pointer"
                    >
                      {page('reserve')}
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
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <div><h1 className="text-3xl font-extrabold text-slate-900">{page('activitiesTitle')}</h1><p className="mt-1 text-sm text-slate-600">{page('activitiesSub')}</p></div>
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label={lang === 'tr' ? 'Aktivite kategorisi' : 'Activity category'}>
              {['All', 'Museum & Culture', 'Cinema', 'Entertainment', 'Summer', 'Winter'].map(category => <button type="button" key={category} aria-pressed={activityCategory === category} onClick={() => setActivityCategory(category)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold ${activityCategory === category ? 'border-[#00A3E0] bg-[#00A3E0] text-white' : 'border-sky-100 bg-white text-slate-700 hover:bg-sky-50'}`}>{lang === 'tr' ? ({ All: 'Tümü', 'Museum & Culture': 'Müze & Kültür', Cinema: 'Sinema', Entertainment: 'Eğlence', Summer: 'Yaz', Winter: 'Kış' } as Record<string, string>)[category] : category}</button>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {activitiesList.filter(activity => activityCategory === 'All' || activity.category === activityCategory).map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-sky-100 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="h-44 w-full relative">
                    <img src={a.img} alt={a.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-bold">{a.category} • {a.city}</span>
                  </div>
                  <div className="p-4 space-y-1">
                    <strong className="text-[14px] text-slate-900 block">{a.title}</strong>
                    <span className="text-[11px] text-slate-400">Duration: {a.duration} | Guide: {a.guideLang}</span>
                    <p className="pt-2 text-[12px] leading-relaxed text-slate-600">{a.description}</p>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <strong className="text-[12px] font-bold text-[#007EAD]">{a.price}</strong>
                    <button 
                      onClick={() => handleOpenBooking(a, 'activity')}
                      className="px-4 py-1.5 bg-[#00A3E0] hover:bg-[#0284C7] text-white rounded-xl text-[12px] font-bold cursor-pointer"
                    >
                      {page('details')}
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
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <h1 className="text-3xl font-extrabold text-slate-900">{tr('nearMe')}</h1>
            <NearbyPlaces kind="essential" lang={lang} center={{ lat: currentCityInfo.lat, lng: currentCityInfo.lng }} cityName={currentCityInfo.name} />
          </main>
        )}

        {/* ====================================================================
            PAGE 10B: SAFETY — SEPARATE FROM STAY / ACTIVITIES
        ==================================================================== */}
        {activeTab === 'safety' && (
          <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">{page('safety')}</h1>
              <p className="text-[13px] text-slate-500">{page('safetySub')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: page('emergencyTitle'), detail: page('emergencyText'), action: '112', href: 'tel:112' },
                { title: tr('taxi'), detail: page('taxiSafety'), action: tr('taxi'), tab: 'taxi' },
                { title: page('useful'), detail: page('usefulText'), action: tr('nearMe'), tab: 'nearme' }
              ].map((item) => (
                <article key={item.title} className="p-5 bg-white border border-sky-100 rounded-2xl shadow-sm space-y-3">
                  <ShieldCheck className="w-7 h-7 text-[#00A3E0]" />
                  <h2 className="font-extrabold text-slate-900">{item.title}</h2>
                  <p className="text-[12px] leading-relaxed text-slate-600">{item.detail}</p>
                  {item.href ? <a href={item.href} className="inline-flex px-3 py-2 rounded-xl bg-red-600 text-white text-[12px] font-bold">{item.action}</a> : <button onClick={() => setActiveTab(item.tab as 'taxi' | 'nearme')} className="px-3 py-2 rounded-xl bg-[#00A3E0] text-white text-[12px] font-bold cursor-pointer">{item.action}</button>}
                </article>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              Photo credits: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Anadolu_Medeniyetleri_M%C3%BCzesi.jpg" target="_blank" rel="noreferrer">José Luis Filpo Cabana / CC BY 3.0</a>{' · '}
              <a className="underline" href="https://commons.wikimedia.org/wiki/File:Topkapi_Palace,_Istanbul.jpg" target="_blank" rel="noreferrer">Rraj89 / CC BY-SA 4.0</a>. Other editorial images are from Unsplash; CC0/public-domain images are identified at their source.
            </p>
          </main>
        )}

        {/* ====================================================================
            PAGE 11: ROLE-PROTECTED ADMIN CMS
        ==================================================================== */}
        {activeTab === 'admin' && isStaff && <ContentAdmin role={role} />}
        {activeTab === 'admin' && !isStaff && <main className="max-w-xl mx-auto p-6 my-8 rounded-2xl bg-white border border-sky-100 space-y-4"><h1 className="text-xl font-bold">Yönetici girişi</h1><p>{session ? 'Hesabınızın içerik yönetimi yetkisi kontrol ediliyor. Yetki verilmemişse bu bölüm açılamaz.' : 'Yönetim panelini açmak için yetkili hesabınızla giriş yapın.'}</p>{!session && <button onClick={() => setAuthModalOpen(true)} className="bg-sky-600 text-white rounded-xl px-5 py-3">Giriş yap</button>}</main>}

      </div>

      {/* ====================================================================
          LÜKS DİJİTAL REZERVASYON KUPONU (BOARDING PASS / VOUCHER MODAL)
      ==================================================================== */}
      {reservationModalOpen && selectedBookingItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl space-y-4">
            <div className="bg-gradient-to-r from-[#00A3E0] to-[#0284C7] p-5 text-white flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-100 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> SafeInTürkiye Verified Pass
                </span>
                <h3 className="text-xl font-extrabold mt-1">
                  {bookingRequest ? 'Booking request submitted' : 'Request a booking (No Advance Fee)'}
                </h3>
              </div>
              <button onClick={() => setReservationModalOpen(false)} className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!bookingRequest ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl flex items-center gap-3">
                    <img src={selectedBookingItem.img} alt="" className="w-14 h-14 object-cover rounded-xl shadow-sm" />
                    <div>
                      <strong className="text-[14px] text-slate-900 block">{selectedBookingItem.title || selectedBookingItem.name}</strong>
                      <span className="text-[12px] font-bold text-[#00A3E0]">{selectedBookingItem.price || selectedBookingItem.avgPrice}</span>
                      <span className="text-[11px] text-slate-400 block">{selectedBookingItem.city}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-700 block mb-1">Lead Guest Full Name (Ad Soyad)</label>
                    <input
                      type="text"
                      value={guestFullName}
                      onChange={(e) => setGuestFullName(e.target.value)}
                      placeholder="e.g. John Doe / Mustafa..."
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A3E0]"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-700 block mb-1">Date of Visit (Ziyaret Tarihi)</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A3E0]"
                    />
                  </div>

                  {/* DÜZELTİLMİŞ ŞIK HATA MESAJI */}
                  {bookingErrorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 flex items-center gap-2 animate-shake">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{bookingErrorMsg}</span>
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50 border border-emerald-200/70 rounded-xl text-[11px] text-emerald-900 space-y-0.5">
                    <strong>Zero Upfront Payment Policy:</strong>
                    <p>Ödeme doğrudan otele/restorana/rehbere varışta yapılır. Kredi kartı gerekmez.</p>
                  </div>

                  <button
                    onClick={handleConfirmReservation}
                    className="w-full h-12 bg-[#00A3E0] hover:bg-[#0284C7] text-white font-extrabold rounded-xl text-[13px] shadow-md shadow-sky-400/20 cursor-pointer"
                  >
                    Submit booking request
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* GÜZELLEŞTİRİLMİŞ BOARDING PASS / VOUCHER GÖRÜNÜMÜ */}
                  <div className="border-2 border-dashed border-sky-300 bg-gradient-to-b from-sky-50/50 to-white rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-inner">
                    <div className="flex justify-between items-start border-b border-sky-200/60 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Reference Code</span>
                        <span className="text-xl font-black text-[#00A3E0] tracking-wider">{bookingRequest.code}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Pending confirmation
                      </span>
                    </div>

                    <div className="space-y-2 text-[12px]">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Venue / Experience:</span>
                        <strong className="text-slate-900 font-bold text-[14px]">{bookingRequest.itemTitle}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Primary Guest:</span>
                          <strong className="text-slate-800">{bookingRequest.guest}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Scheduled Date:</span>
                          <strong className="text-slate-800">{bookingRequest.date}</strong>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Total Due on Site:</span>
                          <strong className="text-lg font-black text-[#00A3E0]">{bookingRequest.price}</strong>
                        </div>
                        <div className="w-16 h-8 bg-slate-900 rounded flex items-center justify-center text-[8px] text-white font-mono tracking-tighter">
                          ||||| | ||||
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-sky-200/60 text-[10px] text-slate-500 italic flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00A3E0] shrink-0" />
                      Request received. Await confirmation from the business before travelling.
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => alert('Voucher saved successfully as PDF/Pass!')} className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[12px] flex items-center justify-center gap-1.5 cursor-pointer">
                      <Download className="w-4 h-4" /> Save Pass
                    </button>
                    <button onClick={() => setReservationModalOpen(false)} className="flex-1 h-11 bg-[#00A3E0] hover:bg-[#0284C7] text-white font-bold rounded-xl text-[12px] cursor-pointer">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {authModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#00A3E0] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-[17px] text-slate-900">{footerCopy[lang].signIn}</h3>
              <p className="text-[12px] text-slate-500">CMS access is granted only by your Supabase role.</p>
            </div>
            <input
              type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email"
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-[#00A3E0]"
            />
            <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password" className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-[#00A3E0]" />
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
                className="flex-1 h-10 bg-[#00A3E0] hover:bg-[#0284C7] text-white font-bold rounded-xl text-[12px]"
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
              <button onClick={() => setAuthModalOpen(true)} title={footerCopy[lang].signIn} className="text-slate-300 hover:text-[#00A3E0] cursor-pointer">
                <Lock className="w-3 h-3" />
              </button>
            </div>
            <p>{footerCopy[lang].source}</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-[#00A3E0]">
            <a href="#" className="hover:underline">{footerCopy[lang].privacy}</a>
            <span>•</span>
            <a href="#" className="hover:underline">{footerCopy[lang].terms}</a>
            <span>•</span>
            <span>{footerCopy[lang].rights}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
