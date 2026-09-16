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
  ExternalLink,
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
  ChevronDown
} from 'lucide-react';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { createBooking } from './repositories/bookingRepository';
import { getCurrentTaxiTariffs } from './repositories/tariffRepository';
import { supabaseConfigured } from './lib/supabase';

// ============================================================================
// 1. TİP TANIMLARI & 6 DİLLİ SÖZLÜK SİSTEMİ
// ============================================================================
type SupportedLang = 'en' | 'tr' | 'de' | 'fr' | 'ar' | 'ru';

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
  temp: string;
  weatherDesc: string;
  humidity: string;
  wind: string;
  trafficIndex: string;
  trafficStatus: 'Low' | 'Moderate' | 'Heavy';
  localTip: string;
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
    heroSub: 'Real-time UKOME taxi meters, transit navigation, currency exchange, and 24/7 tourist assistance.',
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
  }
};

// ============================================================================
// 2. RESMİ TARİFELER & DÖVİZ
// ============================================================================
const liveExchangeQuotes = [
  { pair: 'EUR / TRY', rate: 55.90, change: '+0.42%', isUp: true, buy: 55.70, sell: 56.10 },
  { pair: 'USD / TRY', rate: 48.25, change: '+0.15%', isUp: true, buy: 48.10, sell: 48.40 },
  { pair: 'GBP / TRY', rate: 65.00, change: '-0.08%', isUp: false, buy: 64.75, sell: 65.25 },
  { pair: 'CHF / TRY', rate: 57.20, change: '+0.30%', isUp: true, buy: 56.90, sell: 57.50 },
  { pair: 'SAR / TRY', rate: 12.85, change: '0.00%', isUp: true, buy: 12.75, sell: 12.95 }
];

const nearbyBureausList = [
  { id: 'b1', name: 'Sembol Döviz & Altın (Grand Bazaar)', dist: '240m away', spread: '0.3% (Best Rate)', addr: 'Kapalıçarşı Kalpakçılar No:14', verified: true },
  { id: 'b2', name: 'Tahtakale Merkez Döviz', dist: '350m away', spread: '0.4% (Zero Commission)', addr: 'Tahtakale Cad. No:8', verified: true },
  { id: 'b3', name: 'Taksim Meydan Exchange Desk', dist: '1.2km away', spread: '0.8%', addr: 'Sıraselviler Cad. No:4', verified: true },
  { id: 'b4', name: 'Kadıköy Rıhtım Döviz', dist: '4.8km away', spread: '0.6%', addr: 'Rıhtım Cad. Kadıköy', verified: true }
];

const citiesDetailedData: Record<string, CityInfo> = {
  'İstanbul': {
    name: 'İstanbul',
    tagline: 'Bridging continents with vibrant history, ferries and culture',
    coverImage: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
    temp: '25°C',
    weatherDesc: 'Sunny & Pleasant',
    humidity: '58%',
    wind: '18 km/h NE',
    trafficIndex: '68% (Heavy on Bridges)',
    trafficStatus: 'Heavy',
    localTip: 'During 17:30 - 20:00, prefer Marmaray or Bosphorus ferries to avoid bridge gridlock.'
  },
  'Cappadocia': {
    name: 'Cappadocia (Kapadokya)',
    tagline: 'Fairy chimneys, volcanic valleys and sunrise balloon corridors',
    coverImage: 'https://images.unsplash.com/photo-1608755728617-aefab37d45f6?auto=format&fit=crop&w=1200&q=80',
    temp: '22°C',
    weatherDesc: 'Clear Sky & Calm',
    humidity: '34%',
    wind: '7 km/h SW',
    trafficIndex: '12% (Smooth Open Roads)',
    trafficStatus: 'Low',
    localTip: 'Early dawn balloon flights depend on Civil Aviation wind approval checked at 05:00.'
  },
  'Antalya': {
    name: 'Antalya',
    tagline: 'Turquoise Mediterranean shores, waterfalls and Roman ruins',
    coverImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80',
    temp: '30°C',
    weatherDesc: 'Warm & Sunny',
    humidity: '64%',
    wind: '12 km/h S',
    trafficIndex: '35% (Moderate Coastal Flow)',
    trafficStatus: 'Moderate',
    localTip: 'Use AntRay tramway from the airport directly to Hadrian Gate in Kaleiçi.'
  },
  'İzmir': {
    name: 'İzmir',
    tagline: 'Aegean breeze, Kordon promenade, and lively bazaar alleys',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    temp: '28°C',
    weatherDesc: 'Breezy & Sunny',
    humidity: '50%',
    wind: '22 km/h W',
    trafficIndex: '42% (Normal Flow)',
    trafficStatus: 'Moderate',
    localTip: 'Enjoy the sunset ferry from Alsancak to Karşıyaka with contactless credit card tap.'
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

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, [leafletReady, originCoords, destCoords, geometry, color]);

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
  const [activeTab, setActiveTab] = useState<'home' | 'city' | 'taxi' | 'transit' | 'currency' | 'nearme' | 'stay' | 'food' | 'experiences' | 'admin' | 'assistant'>('home');
  const [selectedCityName, setSelectedCityName] = useState<string>('İstanbul');
  const [lang, setLang] = useState<SupportedLang>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  // Dil Metinleri Helper Fonksiyonu
  const tr = useCallback((k: string) => dict[lang]?.[k] || dict.en[k] || k, [lang]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Soru Listesi Yatay Kaydırma
  const questionsScrollRef = useRef<HTMLDivElement>(null);
  const scrollQuestions = (direction: 'left' | 'right') => {
    if (questionsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      questionsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // AI Asistan State
  const [aiLoading, setAiLoading] = useState(false);
  const [chatLog, setChatLog] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your SafeInTürkiye Personal Travel Assistant. I am connected directly to official UKOME taxi tariffs, M11 airport metros, Marmaray schedules, TCMB exchange rates, and verified safe venues. How can I assist your trip today?',
      time: '12:00'
    }
  ]);
  const [aiInputText, setAiInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, aiLoading]);

  const handleAiSend = (customPrompt?: string) => {
    const promptToSend = customPrompt || aiInputText;
    if (!promptToSend.trim() || aiLoading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLog(prev => [...prev, { sender: 'user', text: promptToSend, time: currentTime }]);
    if (!customPrompt) setAiInputText('');
    setAiLoading(true);

    setTimeout(() => {
      const low = promptToSend.toLowerCase();
      let ans = '';

      if (low.includes('taxi') || low.includes('taksi') || low.includes('airport') || low.includes('havalimanı') || low.includes('ücret')) {
        ans = `According to official 2026 UKOME regulations in Istanbul:
• Opening flagfall: ₺71.94
• Rate per km: ₺47.92
• Short distance minimum: ₺230.00
Estimated ride from Istanbul Airport (IST) to Taksim (~41 km) is between ₺1,950 and ₺2,400 depending on bridge tolls and traffic.
By law, every taxi must run on the digital meter. Report violations to 153.`;
      } else if (low.includes('transit') || low.includes('metro') || low.includes('ferry') || low.includes('vapur') || low.includes('marmaray')) {
        ans = `Official Public Transit Guide for 2026:
1. No Istanbulkart Required: Foreign contactless bank cards (Visa/Mastercard) and Apple Pay tap directly at turnstiles (₺65 flat).
2. Istanbul Airport (IST): Take the M11 Express Metro to Gayrettepe in 29 mins (₺46.20), then transfer to M2 into Taksim.
3. Crossing Continents: The fastest way is Marmaray (8 mins under the Bosphorus from Sirkeci to Kadıköy).`;
      } else if (low.includes('money') || low.includes('exchange') || low.includes('döviz') || low.includes('euro')) {
        ans = `TCMB Reference Rates:
• 1 EUR ≈ 55.90 TRY | 1 USD ≈ 48.25 TRY
Lowest exchange spreads (<0.4%) are in Grand Bazaar (Tahtakale). Avoid airport kiosks.`;
      } else {
        ans = `Regarding "${promptToSend}": SafeInTürkiye recommends checking our live UKOME taxi rates, transit step-by-step connections, and current exchange desks across the platform.`;
      }

      setChatLog(prev => [...prev, { sender: 'bot', text: ans, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setAiLoading(false);
    }, 450);
  };

  // Rezervasyon Modal State & İsim Girmeme Hata Kontrolü
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [selectedBookingItem, setSelectedBookingItem] = useState<any>(null);
  const [guestFullName, setGuestFullName] = useState('');
  const [bookingDate, setBookingDate] = useState('2026-09-12');
  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);
  const [bookingRequest, setBookingRequest] = useState<{
    code: string;
    itemTitle: string;
    city: string;
    price: string;
    guest: string;
    date: string;
  } | null>(null);

  const handleOpenBooking = (item: any) => {
    setSelectedBookingItem(item);
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
    if (!session?.user) { setBookingErrorMsg('Please sign in before submitting a booking request.'); return; }
    try {
      const booking = await createBooking({
        listingType: 'activity', listingName: selectedBookingItem.title || selectedBookingItem.name,
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
    }).catch(() => setTaxiTariffs({}));
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

      const tariff = taxiTariffs[taxiClass.toUpperCase()];
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
    { id: 'a1', title: 'Sunrise Hot Air Balloon Flight', city: 'Cappadocia', category: 'Aviation', duration: '3.5 Hours', price: '₺7,500', guideLang: 'English & Turkish', rating: '5.0', img: 'https://images.unsplash.com/photo-1608755728617-aefab37d45f6?auto=format&fit=crop&w=600&q=80' },
    { id: 'a2', title: 'Private Sunset Bosphorus Yacht Cruise', city: 'İstanbul', category: 'Marine', duration: '2.0 Hours', price: '₺1,950', guideLang: 'Audio Guide & Captain', rating: '4.9', img: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80' },
    { id: 'a3', title: 'Kaş Sunken City Sea Kayaking', city: 'Antalya', category: 'Water Sports', duration: '4.0 Hours', price: '₺2,400', guideLang: 'English Instructor', rating: '4.9', img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' }
  ]);

  const [nearbyPlacesList, setNearbyPlacesList] = useState([
    { id: 'n1', name: 'Nöbetçi Eczane (24/7 Duty Pharmacy)', dist: '180m', addr: 'Sıraselviler Cad. No:24, Taksim', cat: 'Pharmacy', phone: '+90 212 244 10 10', is247: true },
    { id: 'n2', name: 'Taksim Tourist Police Desk', dist: '320m', addr: 'Taksim Square Subway Entrance', cat: 'Police', phone: '+90 212 527 45 03', is247: true },
    { id: 'n3', name: 'Ziraat & Garanti Contactless Multi-ATM', dist: '90m', addr: 'İstiklal Cad. No:45', cat: 'ATM', phone: '112', is247: true },
    { id: 'n4', name: 'Taksim Gümüşsuyu Taxi Stand', dist: '140m', addr: 'Gümüşsuyu Cad. Taksim', cat: 'Taxi', phone: '+90 212 249 05 05', is247: true }
  ]);

  // Admin CMS State & Düzenleme
  const [adminSection, setAdminSection] = useState<'hotels' | 'restaurants' | 'activities' | 'nearme'>('hotels');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formCity, setFormCity] = useState('İstanbul');
  const [formPrice, setFormPrice] = useState('');
  const [formSub, setFormSub] = useState('');
  const [formImg, setFormImg] = useState('');

  const handleStartEdit = (item: any, sec: any) => {
    setEditingItemId(item.id);
    setFormTitle(item.title || item.name);
    setFormCity(item.city || 'İstanbul');
    setFormPrice(item.price || item.avgPrice || '');
    setFormSub(item.roomType || item.cuisine || item.category || item.cat || '');
    setFormImg(item.img || '');
    setAdminSection(sec);
  };

  const handleSaveItem = () => {
    if (!formTitle.trim()) return;
    const defaultImg = formImg || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=600&q=80';

    if (adminSection === 'hotels') {
      if (editingItemId) {
        setHotelsList(hotelsList.map(h => h.id === editingItemId ? { ...h, name: formTitle, city: formCity, price: formPrice, roomType: formSub, img: defaultImg } : h));
      } else {
        setHotelsList([{ id: Date.now().toString(), name: formTitle, city: formCity, area: 'Central', roomType: formSub || 'Suite', price: formPrice || '₺3,500', rating: '5.0', amenities: 'WiFi, Spa', img: defaultImg }, ...hotelsList]);
      }
    } else if (adminSection === 'restaurants') {
      if (editingItemId) {
        setRestaurantsList(restaurantsList.map(r => r.id === editingItemId ? { ...r, name: formTitle, city: formCity, avgPrice: formPrice, cuisine: formSub, img: defaultImg } : r));
      } else {
        setRestaurantsList([{ id: Date.now().toString(), name: formTitle, city: formCity, cuisine: formSub || 'Authentic', avgPrice: formPrice || '₺400', openHours: '11:00 - 23:00', rating: '4.9', img: defaultImg }, ...restaurantsList]);
      }
    } else if (adminSection === 'activities') {
      if (editingItemId) {
        setActivitiesList(activitiesList.map(a => a.id === editingItemId ? { ...a, title: formTitle, city: formCity, price: formPrice, category: formSub, img: defaultImg } : a));
      } else {
        setActivitiesList([{ id: Date.now().toString(), title: formTitle, city: formCity, category: formSub || 'Tour', duration: '2 Hours', price: formPrice || '₺2,000', guideLang: 'English', rating: '5.0', img: defaultImg }, ...activitiesList]);
      }
    } else {
      if (editingItemId) {
        setNearbyPlacesList(nearbyPlacesList.map(n => n.id === editingItemId ? { ...n, name: formTitle, cat: formSub } : n));
      } else {
        setNearbyPlacesList([{ id: Date.now().toString(), name: formTitle, dist: '120m', addr: formCity + ' Center', cat: formSub || 'Service', phone: '112', is247: true }, ...nearbyPlacesList]);
      }
    }

    setEditingItemId(null);
    setFormTitle('');
    setFormPrice('');
    setFormSub('');
    setFormImg('');
    alert('Entry saved and published to public view!');
  };

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
            <div onClick={() => setActiveTab('home')} className="flex items-center gap-2.5 cursor-pointer shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#00A3E0] flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[19px] font-black tracking-tight text-[#00A3E0]">
                  Safe<span className="text-[#0A2540]">InTürkiye</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">Verified Travel</span>
              </div>
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
                    ['stay', 'food', 'experiences', 'nearme'].includes(activeTab) ? 'text-[#00A3E0] bg-sky-50 font-extrabold' : 'hover:text-[#00A3E0] hover:bg-slate-50'
                  }`}
                >
                  <span>More</span>
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
        </header>

        {/* ====================================================================
            PAGE 1: EXPLORE
        ==================================================================== */}
        {activeTab === 'home' && (
          <main className="space-y-12 pb-24">
            <section className="relative h-[380px] sm:h-[420px] flex items-center justify-center text-center px-4 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1920&q=80" 
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
                      className="w-full h-11 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                    />
                    <button 
                      onClick={() => {
                        const low = searchQuery.toLowerCase();
                        if (low.includes('taxi') || low.includes('taksi')) setActiveTab('taxi');
                        else if (low.includes('transit') || low.includes('metro')) setActiveTab('transit');
                        else if (low.includes('hotel')) setActiveTab('stay');
                        else setActiveTab('experiences');
                      }} 
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
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                {[
                  { name: tr('assistant'), sub: '24/7 Live Advisor', icon: Bot, action: () => setActiveTab('assistant') },
                  { name: tr('taxi'), sub: 'Live Map & UKOME', icon: Car, action: () => setActiveTab('taxi') },
                  { name: tr('transit'), sub: 'Metro & Ferry Routes', icon: Train, action: () => setActiveTab('transit') },
                  { name: tr('currency'), sub: 'TCMB & Best Bureaus', icon: Coins, action: () => setActiveTab('currency') },
                  { name: tr('cityWeather'), sub: 'Live City Traffic', icon: Compass, action: () => setActiveTab('city') },
                  { name: tr('hotels'), sub: 'Verified Stays', icon: Building2, action: () => setActiveTab('stay') },
                  { name: tr('dining'), sub: 'Historic Kitchens', icon: Utensils, action: () => setActiveTab('food') },
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
          </main>
        )}

        {/* ====================================================================
            PAGE 2: AI TRAVEL ASSISTANT
        ==================================================================== */}
        {activeTab === 'assistant' && (
          <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4 pb-24">
            <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00A3E0] to-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-400/25 shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-[17px] sm:text-[19px] font-black text-slate-900 tracking-tight">
                      SafeInTürkiye AI Travel Companion
                    </h1>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Online
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5 font-medium">
                    Verified guidance on UKOME 2026 taxi fares, TCMB benchmark rates, and municipal transit routes.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setChatLog([{ sender: 'bot', text: 'Chat reset. How may I help you explore Türkiye today?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])}
                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0"
                title="Reset conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* DÜZELTİLMİŞ "TRY ASKING" BÖLÜMÜ */}
            <div className="relative bg-white/70 p-2 rounded-2xl border border-sky-100/80 shadow-xs flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-400 pl-2 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#00A3E0]" />
                <span className="hidden sm:inline">Try asking:</span>
              </div>

              <button
                onClick={() => scrollQuestions('left')}
                className="w-7 h-7 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 hover:text-[#00A3E0] hover:border-[#00A3E0] shrink-0 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={questionsScrollRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth py-1 px-1 flex-1"
                style={{ maskImage: 'linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent)' }}
              >
                {[
                  'How much is a taxi from Istanbul Airport to Taksim?',
                  'How do I use metro without Istanbulkart?',
                  'Where is the best currency exchange in Istanbul?',
                  'Are hot air balloons in Cappadocia running today?',
                  'Find a 24/7 duty pharmacy near Taksim',
                  'Is water taxi available in Bosphorus?',
                  'What is the ticket fare for Marmaray?'
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAiSend(q)}
                    className="px-3.5 py-1.5 bg-white border border-sky-100 rounded-xl text-[11px] font-semibold text-slate-700 hover:border-[#00A3E0] hover:text-[#00A3E0] hover:bg-sky-50/50 shrink-0 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <button
                onClick={() => scrollQuestions('right')}
                className="w-7 h-7 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 hover:text-[#00A3E0] hover:border-[#00A3E0] shrink-0 cursor-pointer transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sohbet Kutusu */}
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm flex flex-col h-[520px] overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-[13px]">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl leading-relaxed whitespace-pre-line shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#00A3E0] text-white rounded-tr-none'
                          : 'bg-sky-50/70 border border-sky-100/70 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex items-center gap-2 p-3 bg-sky-50 text-slate-500 rounded-2xl w-fit text-[12px] border border-sky-100">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00A3E0]" />
                    Analyzing official UKOME & TCMB databases...
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                  placeholder="Ask anything (e.g. taxi meter rules, airport transfer, currency)..."
                  className="flex-1 h-12 px-4 bg-white border border-slate-200 rounded-2xl text-[13px] font-medium focus:outline-none focus:border-[#00A3E0] shadow-xs"
                />
                <button
                  onClick={() => handleAiSend()}
                  disabled={aiLoading}
                  className="w-12 h-12 bg-[#00A3E0] hover:bg-[#0284C7] text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-md shadow-sky-400/20 disabled:opacity-50 transition-all shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

          </main>
        )}

        {/* ====================================================================
            PAGE 3: TAKİ HESAPLAYICI
        ==================================================================== */}
        {activeTab === 'taxi' && (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 font-bold text-[#00A3E0] hover:underline cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
              <span>/</span>
              <span className="text-slate-800 font-bold">Official Taxi Fare Calculator</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Official Taxi Fare Calculator</h1>
              <p className="text-[13px] text-slate-500">Calculated using real road distance & official municipal UKOME tariffs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-sky-100 shadow-sm space-y-4">
                <div className="p-3 bg-sky-50 border border-sky-200/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#00A3E0]" />
                    <span className="text-[12px] text-slate-600">Active Tariff:</span>
                  </div>
                  <span className="font-extrabold text-[12px] text-[#00A3E0] bg-white px-2 py-0.5 rounded-md border border-sky-200">
                    {detectedTaxiCity} ({supabaseConfigured ? 'verified database tariff required' : 'database not configured'})
                  </span>
                </div>

                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[12px] font-bold text-slate-700">From (Origin)</label>
                    <button
                      type="button"
                      onClick={handleTaxiCurrentLocation}
                      disabled={isTaxiLocating}
                      className="text-[11px] font-bold text-[#00A3E0] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isTaxiLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation2 className="w-3 h-3" />}
                      Use Current Location
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
                  <label className="text-[12px] font-bold text-slate-700 block mb-1">To (Destination)</label>
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
                  {isTaxiRouting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Calculate Route & Fare'}
                </button>

                {taxiOriginCoords && taxiDestCoords && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 block">External Live Navigation:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${taxiOriginCoords.lat},${taxiOriginCoords.lng}&destination=${taxiDestCoords.lat},${taxiDestCoords.lng}&travelmode=driving`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-50 hover:bg-sky-50 text-slate-800 rounded-xl border border-slate-200 text-center font-bold text-[11px] flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#00A3E0]" /> Google Maps
                      </a>
                      <a
                        href={`https://maps.apple.com/?saddr=${taxiOriginCoords.lat},${taxiOriginCoords.lng}&daddr=${taxiDestCoords.lat},${taxiDestCoords.lng}&dirflg=d`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-50 hover:bg-sky-50 text-slate-800 rounded-xl border border-slate-200 text-center font-bold text-[11px] flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#00A3E0]" /> Apple Maps
                      </a>
                    </div>
                  </div>
                )}

                {taxiRouteResult && fareCalculation && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 space-y-2">
                      <span className="text-[11px] text-slate-500 font-semibold block">Estimated Fare Range</span>
                      <span className="text-3xl font-black text-slate-900">
                        ₺{fareCalculation.minFare} – ₺{fareCalculation.maxFare}
                      </span>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-200/60 text-[12px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Real Road Distance</span>
                          <span className="font-bold text-slate-800">{taxiRouteResult.distanceKm} km</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Estimated Duration</span>
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
        {activeTab === 'transit' && (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Public Transit Step-by-Step Navigator</h1>
              <p className="text-[13px] text-slate-500">Live GPS origin, exact stations, line schedules and official UKOME ticket fares.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-4">
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[12px] font-bold text-slate-700">From</label>
                    <button
                      type="button"
                      onClick={handleTransitCurrentLocation}
                      disabled={isTransitLocating}
                      className="text-[11px] font-bold text-[#00A3E0] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isTransitLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation2 className="w-3 h-3" />}
                      Use Current Location
                    </button>
                  </div>
                  <input
                    type="text"
                    value={transitOriginText}
                    onChange={(e) => {
                      setTransitOriginText(e.target.value);
                      setTransitOriginCoords(null);
                    }}
                    placeholder="Search origin..."
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium"
                  />
                </div>

                <div className="relative">
                  <label className="text-[12px] font-bold text-slate-700 block mb-1">To</label>
                  <input
                    type="text"
                    value={transitDestText}
                    onChange={(e) => {
                      setTransitDestText(e.target.value);
                      setTransitDestCoords(null);
                    }}
                    placeholder="Search destination..."
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium"
                  />
                </div>

                <button
                  onClick={handleCalculateTransitRoute}
                  disabled={isTransitRouting}
                  className="w-full h-11 bg-[#00A3E0] hover:bg-[#0284C7] text-white font-bold rounded-xl text-[13px] shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {isTransitRouting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Train className="w-4 h-4" />}
                  Find Transit Route & Stations
                </button>
              </div>

              <div className="lg:col-span-7 h-[360px] lg:h-auto">
                <SafeRouteMap
                  originCoords={transitOriginCoords}
                  destCoords={transitDestCoords}
                  geometry={transitRouteResults && transitRouteResults[0] ? transitRouteResults[0].geometry : null}
                  color="#00A3E0"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-xl font-black text-slate-900">Recommended Route Options</h2>
              {transitRouteResults && transitRouteResults.map((opt) => (
                <div key={opt.id} className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h3 className="font-extrabold text-[16px] text-slate-900">{opt.title}</h3>
                      <span className="text-[12px] text-slate-500">{opt.transfersCount} Transfer(s) | Real UKOME Tariff Calculation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-[#00A3E0]">~{opt.totalDurationMins} min</span>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[13px] rounded-xl border border-emerald-200">
                        ₺{opt.fareTRY.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {opt.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-[13px]">
                        <div className="w-7 h-7 rounded-full bg-sky-50 text-[#00A3E0] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-sky-200">
                          {idx + 1}
                        </div>
                        <div className="flex-1 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900">{step.lineName}</strong>
                            <span className="text-[11px] font-semibold text-slate-500">{step.durationMins} mins</span>
                          </div>
                          <p className="text-slate-600 text-[12px] mt-1">{step.instruction}</p>
                          {step.frequency && (
                            <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-2 mt-2 border-t border-slate-200/60">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#00A3E0]" /> Frequency: {step.frequency}</span>
                              {step.firstTrip && <span>First: {step.firstTrip} | Last: {step.lastTrip}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* ====================================================================
            PAGE 5: EXCHANGE (CANLI KURLAR + YAKINLARDAKİ DÖVİZCİLER - DÜZELTİLDİ)
        ==================================================================== */}
        {activeTab === 'currency' && (
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Exchange (Currency & Nearby Desks)</h1>
              <p className="text-[13px] text-slate-500">Official Central Bank of Türkiye (TCMB) indicative quotes & zero-commission Grand Bazaar desks.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {liveExchangeQuotes.map((q, i) => (
                <div key={i} className="p-4 bg-white rounded-2xl border border-sky-100 shadow-sm space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 block">{q.pair}</span>
                  <strong className="text-[20px] font-black text-slate-900 block">{q.rate.toFixed(2)} ₺</strong>
                  <span className={`text-[11px] font-bold ${q.isUp ? 'text-emerald-600' : 'text-red-500'}`}>{q.change}</span>
                </div>
              ))}
            </div>

            {/* YAKINLARDAKİ DÖVİZCİLER BÖLÜMÜ */}
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-3">
              <h3 className="font-extrabold text-[15px] text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#00A3E0]" />
                Lowest-Spread Exchange Bureaus Near You (En Yakın Komisyonsuz Bürolar)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nearbyBureausList.map(b => (
                  <div key={b.id} className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-100 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-[13px] text-slate-900">{b.name}</strong>
                        {b.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A3E0]" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{b.addr}</p>
                      <span className="text-[11px] font-bold text-emerald-700 mt-1 block">Spread: {b.spread}</span>
                    </div>
                    <span className="text-[12px] font-bold text-[#00A3E0]">{b.dist}</span>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* ====================================================================
            PAGE 6: CITIES & WEATHER
        ==================================================================== */}
        {activeTab === 'city' && (
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['İstanbul', 'Cappadocia', 'Antalya', 'İzmir'].map((cname) => (
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
              <img src={currentCityInfo.coverImage} alt={currentCityInfo.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="relative z-10">
                <h1 className="text-3xl font-black">{currentCityInfo.name}</h1>
                <p className="text-[13px] text-slate-200">{currentCityInfo.tagline}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-sky-100 shadow-sm space-y-3">
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Live Weather</span>
                <div className="flex items-center gap-3">
                  <Sun className="w-10 h-10 text-amber-500" />
                  <div>
                    <span className="text-3xl font-black text-slate-900">{currentCityInfo.temp}</span>
                    <span className="text-[12px] text-slate-500 block">{currentCityInfo.weatherDesc}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[12px]">
                  <div className="flex items-center gap-1.5 text-slate-600"><Droplets className="w-4 h-4 text-sky-500" /> Humidity: {currentCityInfo.humidity}</div>
                  <div className="flex items-center gap-1.5 text-slate-600"><Wind className="w-4 h-4 text-teal-500" /> Wind: {currentCityInfo.wind}</div>
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-sky-100 shadow-sm space-y-3">
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Live Traffic Index</span>
                <div className="flex items-center justify-between">
                  <strong className="text-2xl font-black text-slate-900">{currentCityInfo.trafficIndex}</strong>
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    currentCityInfo.trafficStatus === 'Heavy' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {currentCityInfo.trafficStatus} Congestion
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50 border border-amber-200/60 rounded-xl text-[11px] text-amber-900">
                  <strong>Local Tip:</strong> {currentCityInfo.localTip}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ====================================================================
            PAGE 7: OTELLER (HOTELS)
        ==================================================================== */}
        {activeTab === 'stay' && (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <h1 className="text-3xl font-extrabold text-slate-900">Verified Hotels & Cave Stays</h1>
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
                    <span className="font-bold text-[#00A3E0]">{h.price} / night</span>
                    <button 
                      onClick={() => handleOpenBooking(h)}
                      className="px-4 py-1.5 bg-[#00A3E0] hover:bg-[#0284C7] text-white rounded-xl text-[12px] font-bold cursor-pointer"
                    >
                      Book Stay
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
            <h1 className="text-3xl font-extrabold text-slate-900">Authentic Dining Guide</h1>
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
                    <span className="text-[11px] text-slate-400 block">Hours: {r.openHours}</span>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-600">Avg: {r.avgPrice}</span>
                    <button 
                      onClick={() => handleOpenBooking(r)}
                      className="px-4 py-1.5 bg-[#00A3E0] hover:bg-[#0284C7] text-white rounded-xl text-[12px] font-bold cursor-pointer"
                    >
                      Reserve Table
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
            <h1 className="text-3xl font-extrabold text-slate-900">Verified Activities & Excursions</h1>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {activitiesList.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-sky-100 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="h-44 w-full relative">
                    <img src={a.img} alt={a.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-bold">{a.category} • {a.city}</span>
                  </div>
                  <div className="p-4 space-y-1">
                    <strong className="text-[14px] text-slate-900 block">{a.title}</strong>
                    <span className="text-[11px] text-slate-400">Duration: {a.duration} | Guide: {a.guideLang}</span>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <strong className="text-[15px] font-black text-[#00A3E0]">{a.price}</strong>
                    <button 
                      onClick={() => handleOpenBooking(a)}
                      className="px-4 py-1.5 bg-[#00A3E0] hover:bg-[#0284C7] text-white rounded-xl text-[12px] font-bold cursor-pointer"
                    >
                      Reserve Spot
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
          <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <h1 className="text-3xl font-extrabold text-slate-900">Near Me (Vital Assistance)</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nearbyPlacesList.map(p => (
                <div key={p.id} className="p-4 bg-white rounded-2xl border border-sky-100 shadow-sm flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#00A3E0] uppercase">{p.cat}</span>
                    <strong className="text-[14px] text-slate-900 block mt-0.5">{p.name}</strong>
                    <span className="text-[11px] text-slate-500 block">{p.addr}</span>
                    <span className="text-[11px] font-bold text-slate-700 mt-1 block">Tel: {p.phone}</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#00A3E0]">{p.dist}</span>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* ====================================================================
            PAGE 11: ROLE-PROTECTED ADMIN CMS
        ==================================================================== */}
        {activeTab === 'admin' && isStaff && (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
            <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-2xl shadow-md">
              <div>
                <h1 className="text-2xl font-black flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-[#00A3E0]" /> SafeInTürkiye Studio CMS (Photo & Content Editor)
                </h1>
                <p className="text-[12px] text-slate-400">In-place live editor. Edit photos, titles and rates on the fly.</p>
              </div>
              <button 
                onClick={() => { void signOut(); setActiveTab('home'); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[12px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-red-400" /> Lock & Exit
              </button>
            </div>

            <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              {[
                { id: 'hotels', label: `Hotels (${hotelsList.length})` },
                { id: 'restaurants', label: `Dining (${restaurantsList.length})` },
                { id: 'activities', label: `Activities (${activitiesList.length})` },
                { id: 'nearme', label: `Near Me (${nearbyPlacesList.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setAdminSection(tab.id as any); setEditingItemId(null); }}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                    adminSection === tab.id ? 'bg-[#00A3E0] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-[15px] text-slate-900">
                  {editingItemId ? `✏️ Editing Entry #${editingItemId}` : `➕ Add New ${adminSection.toUpperCase()}`}
                </h3>
                {editingItemId && (
                  <button onClick={() => setEditingItemId(null)} className="text-[11px] text-red-600 hover:underline">
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Title or Place Name..."
                  className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px]"
                />
                <select
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-[#00A3E0]"
                >
                  <option value="İstanbul">İstanbul</option>
                  <option value="Cappadocia">Cappadocia</option>
                  <option value="Antalya">Antalya</option>
                  <option value="İzmir">İzmir</option>
                </select>
                <input
                  type="text"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="Price / Cost (e.g. ₺4,500)..."
                  className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px]"
                />
                <input
                  type="text"
                  value={formSub}
                  onChange={(e) => setFormSub(e.target.value)}
                  placeholder="Subcategory / Room / Cuisine..."
                  className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px]"
                />
                <input
                  type="text"
                  value={formImg}
                  onChange={(e) => setFormImg(e.target.value)}
                  placeholder="Photo URL (Unsplash or direct image link)..."
                  className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] sm:col-span-2"
                />
              </div>

              {formImg && (
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 w-fit">
                  <span className="text-[11px] font-bold text-slate-500">Image Preview:</span>
                  <img src={formImg} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                </div>
              )}

              <button
                onClick={handleSaveItem}
                className="px-5 py-2.5 bg-[#00A3E0] hover:bg-[#0284C7] text-white font-bold rounded-xl text-[13px] flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" /> {editingItemId ? 'Save Changes & Update Live' : 'Publish to Live Portal'}
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-3">
              <h3 className="font-extrabold text-[15px] text-slate-900">Current Items in {adminSection.toUpperCase()}</h3>
              <div className="space-y-2">
                {adminSection === 'hotels' && hotelsList.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-[12px] hover:border hover:border-sky-200">
                    <div className="flex items-center gap-3">
                      <img src={item.img} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      <div>
                        <strong>{item.name}</strong> — {item.city} ({item.price})
                        <span className="text-slate-400 block text-[11px]">{item.roomType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStartEdit(item, 'hotels')} className="px-2.5 py-1 bg-sky-100 text-[#00A3E0] font-bold rounded-lg hover:bg-sky-200">Edit Photo/Info</button>
                      <button onClick={() => setHotelsList(hotelsList.filter(h => h.id !== item.id))} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {adminSection === 'restaurants' && restaurantsList.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-[12px] hover:border hover:border-sky-200">
                    <div className="flex items-center gap-3">
                      <img src={item.img} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      <div>
                        <strong>{item.name}</strong> — {item.city} ({item.avgPrice})
                        <span className="text-slate-400 block text-[11px]">{item.cuisine}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStartEdit(item, 'restaurants')} className="px-2.5 py-1 bg-sky-100 text-[#00A3E0] font-bold rounded-lg hover:bg-sky-200">Edit Photo/Info</button>
                      <button onClick={() => setRestaurantsList(restaurantsList.filter(r => r.id !== item.id))} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {adminSection === 'activities' && activitiesList.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-[12px] hover:border hover:border-sky-200">
                    <div className="flex items-center gap-3">
                      <img src={item.img} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      <div>
                        <strong>{item.title}</strong> — {item.city} ({item.price})
                        <span className="text-slate-400 block text-[11px]">{item.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStartEdit(item, 'activities')} className="px-2.5 py-1 bg-sky-100 text-[#00A3E0] font-bold rounded-lg hover:bg-sky-200">Edit Photo/Info</button>
                      <button onClick={() => setActivitiesList(activitiesList.filter(a => a.id !== item.id))} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {adminSection === 'nearme' && nearbyPlacesList.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-[12px]">
                    <div>
                      <strong>{item.name}</strong> — {item.cat} ({item.dist})
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setNearbyPlacesList(nearbyPlacesList.filter(n => n.id !== item.id))} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

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
                      Show this digital pass upon arrival. Guaranteed booking held.
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
              <h3 className="font-extrabold text-[17px] text-slate-900">Sign in</h3>
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
                onClick={async () => {
                  if (!signIn) { setAuthError('Supabase is not configured.'); return; }
                  const result = await signIn(authEmail, authPassword);
                  if (result?.error) { setAuthError(result.error.message); return; }
                  setAuthModalOpen(false); setAuthError(null);
                }}
                className="flex-1 h-10 bg-[#00A3E0] hover:bg-[#0284C7] text-white font-bold rounded-xl text-[12px]"
              >
                Sign in
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
              SafeInTürkiye 2026 Platform
              <button onClick={() => setAuthModalOpen(true)} title="Sign in" className="text-slate-300 hover:text-[#00A3E0] cursor-pointer">
                <Lock className="w-3 h-3" />
              </button>
            </div>
            <p>Official UKOME public transit tariffs, Transit Map Navigator & TCMB rates.</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-[#00A3E0]">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:underline">Terms of Service</a>
            <span>•</span>
            <span>All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
