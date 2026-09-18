import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import TransitJourney from './TransitJourney';
import 'leaflet/dist/leaflet.css';
import { ArrowDownUp, ArrowRight, Info, MapPin, Train } from 'lucide-react';
import { getTransitGuide, guideStations } from '../services/transitGuide';
import type { GuideResult, GuideStation } from '../services/transitGuide';

const copy = {
  en: {
    title: 'Public Transport', subtitle: 'Plan a station-to-station connection in central İstanbul.',
    from: 'From station', to: 'To station', swap: 'Swap stations', submit: 'Show station guide',
    coverage: 'Guide coverage: Taksim–Kabataş (F1) and Kabataş–Beyazıt (T1). Select stations in this area.',
    notice: 'Live journey planning is not connected yet. This guide explains the published line connections; it cannot confirm departures, disruptions, journey time or fares.',
    map: 'Station locations', mapNote: 'Approximate station locations. No live vehicle or route trace.',
    result: 'Your station guide', transfer: 'Change at Kabataş and follow signs to the next line.',
    direction: 'Direction', source: 'Official line information', stops: 'Station sequence',
    checked: 'Line information checked 17 September 2026. Check the operator’s notices before travel.',
    unavailable: 'Departure times, travel time and fare: unavailable.',
    same: 'You selected the same station. Choose a different destination.',
    unsupported: 'This station pair is outside this guide. No route has been generated.',
    hint: 'Select your stations above to see the relevant line and any interchange.',
    mapFailed: 'Map tiles could not load. Station names and the guide are still available below.',
  },
  tr: {
    title: 'Toplu Taşıma', subtitle: 'İstanbul merkezinde istasyondan istasyona bağlantınızı bulun.',
    from: 'Başlangıç istasyonu', to: 'Varış istasyonu', swap: 'İstasyonları değiştir', submit: 'İstasyon rehberini göster',
    coverage: 'Rehber kapsamı: Taksim–Kabataş (F1) ve Kabataş–Beyazıt (T1). Bu bölgedeki istasyonlardan seçim yapın.',
    notice: 'Canlı yolculuk planlama hizmeti henüz bağlı değil. Bu rehber yayımlanmış hat bağlantılarını gösterir; kalkışları, kesintileri, yolculuk süresini veya ücreti doğrulayamaz.',
    map: 'İstasyon konumları', mapNote: 'Yaklaşık istasyon konumları. Canlı araç veya rota çizgisi gösterilmez.',
    result: 'İstasyon rehberiniz', transfer: 'Kabataş’ta aktarma yapın ve sonraki hattın tabelalarını izleyin.',
    direction: 'Yön', source: 'Resmî hat bilgisi', stops: 'İstasyon sırası',
    checked: 'Hat bilgisi 17 Eylül 2026 tarihinde kontrol edildi. Yola çıkmadan işletmenin duyurularını kontrol edin.',
    unavailable: 'Kalkış saati, yolculuk süresi ve ücret bilgisi mevcut değil.',
    same: 'Aynı istasyonu seçtiniz. Farklı bir varış istasyonu seçin.',
    unsupported: 'Bu istasyon çifti rehber kapsamı dışında. Rota oluşturulmadı.',
    hint: 'İlgili hat ve aktarmaları görmek için yukarıdan istasyonları seçin.',
    mapFailed: 'Harita yüklenemedi. İstasyon adları ve rehber aşağıda kullanılabilir.',
  },
  de: {
    title: 'Öffentliche Verkehrsmittel', subtitle: 'Verbindung zwischen Stationen im Zentrum Istanbuls.', from: 'Von Station', to: 'Zu Station', swap: 'Stationen tauschen', submit: 'Stationsführer anzeigen', coverage: 'Abdeckung: F1 Taksim–Kabataş und T1 Kabataş–Beyazıt.', notice: 'Live-Routenplanung ist noch nicht verbunden. Abfahrten, Störungen, Dauer und Preise können nicht bestätigt werden.', map: 'Stationsstandorte', mapNote: 'Ungefähre Standorte; keine Live-Fahrzeuge.', result: 'Ihr Stationsführer', transfer: 'In Kabataş umsteigen und den Schildern folgen.', direction: 'Richtung', source: 'Offizielle Linieninformation', stops: 'Stationsfolge', checked: 'Linieninformation am 17. September 2026 geprüft.', unavailable: 'Abfahrt, Dauer und Preis: nicht verfügbar.', same: 'Sie haben dieselbe Station gewählt.', unsupported: 'Dieses Stationspaar liegt außerhalb des Führers.', hint: 'Wählen Sie oben Ihre Stationen.', mapFailed: 'Kartenkacheln konnten nicht geladen werden.',
  },
  fr: {
    title: 'Transports publics', subtitle: 'Connexion entre stations dans le centre d’Istanbul.', from: 'Station de départ', to: 'Station d’arrivée', swap: 'Inverser', submit: 'Afficher le guide', coverage: 'Couverture : F1 Taksim–Kabataş et T1 Kabataş–Beyazıt.', notice: 'La planification en direct n’est pas connectée. Départs, incidents, durée et tarifs ne sont pas confirmés.', map: 'Stations', mapNote: 'Emplacements approximatifs, sans véhicule en direct.', result: 'Votre guide', transfer: 'Changez à Kabataş et suivez les panneaux.', direction: 'Direction', source: 'Information officielle', stops: 'Stations', checked: 'Informations vérifiées le 17 septembre 2026.', unavailable: 'Départ, durée et tarif : indisponibles.', same: 'Vous avez choisi la même station.', unsupported: 'Cette paire est hors du guide.', hint: 'Sélectionnez vos stations ci-dessus.', mapFailed: 'Les tuiles de carte ne sont pas disponibles.',
  },
  ar: {
    title: 'المواصلات العامة', subtitle: 'اتصال بين المحطات في وسط إسطنبول.', from: 'من محطة', to: 'إلى محطة', swap: 'تبديل المحطات', submit: 'عرض دليل المحطات', coverage: 'النطاق: F1 تقسيم–كاباتاش وT1 كاباتاش–بيازيد.', notice: 'التخطيط المباشر غير متصل بعد؛ لا يمكن تأكيد المغادرات أو الأعطال أو المدة أو الأسعار.', map: 'مواقع المحطات', mapNote: 'مواقع تقريبية وليست حركة مباشرة.', result: 'دليل محطتك', transfer: 'بدّل في كاباتاش واتبع اللوحات.', direction: 'الاتجاه', source: 'معلومات الخط الرسمية', stops: 'تسلسل المحطات', checked: 'تم التحقق من المعلومات في 17 سبتمبر 2026.', unavailable: 'المغادرة والمدة والسعر: غير متاح.', same: 'اخترت المحطة نفسها.', unsupported: 'هذا الزوج خارج نطاق الدليل.', hint: 'اختر المحطات أعلاه.', mapFailed: 'تعذر تحميل الخريطة.',
  },
  ru: {
    title: 'Общественный транспорт', subtitle: 'Соединение станций в центре Стамбула.', from: 'От станции', to: 'До станции', swap: 'Поменять станции', submit: 'Показать маршрут', coverage: 'Покрытие: F1 Таксим–Кабаташ и T1 Кабаташ–Беязыт.', notice: 'Планировщик в реальном времени не подключён. Отправления, сбои, время и цена не подтверждаются.', map: 'Станции', mapNote: 'Приблизительные места, без движения транспорта.', result: 'Ваш путеводитель', transfer: 'Пересядьте в Кабаташе и следуйте указателям.', direction: 'Направление', source: 'Официальная информация', stops: 'Станции', checked: 'Информация проверена 17 сентября 2026 г.', unavailable: 'Отправление, время и цена: недоступны.', same: 'Вы выбрали одну и ту же станцию.', unsupported: 'Пара вне этого справочника.', hint: 'Выберите станции выше.', mapFailed: 'Не удалось загрузить карту.',
  },
};

function StationMap({ stations, title, note, failure }: { stations: GuideStation[]; title: string; note: string; failure: string }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current, { scrollWheelZoom: false }).setView([41.024, 28.983], 13);
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(instance);
    tiles.on('tileerror', () => setTileError(true));
    map.current = instance;
    markers.current = L.layerGroup().addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(element.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
      markers.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();
    for (const station of stations) {
      L.circleMarker([station.lat, station.lng], {
        radius: 8, color: '#ffffff', fillColor: '#00A3E0', fillOpacity: 1, weight: 3,
      }).bindTooltip(station.name, { permanent: false }).addTo(markers.current);
    }
    if (stations.length > 1) {
      map.current.fitBounds(L.latLngBounds(stations.map(station => [station.lat, station.lng])), { padding: [35, 35], maxZoom: 15 });
    } else if (stations[0]) {
      map.current.setView([stations[0].lat, stations[0].lng], 15);
    }
  }, [stations]);

  return <div className="bg-white border border-sky-100 rounded-2xl shadow-sm overflow-hidden h-full">
    <div ref={element} role="region" aria-label={title} className="h-[280px] sm:h-[320px] relative z-0" />
    <p className="p-3 text-[11px] text-slate-600">{tileError ? failure : note}</p>
  </div>;
}

export default function TransitPlanner({ lang }: { lang: string }) {
  const t = copy[lang.toLowerCase() as keyof typeof copy] ?? copy.en;
  const [originId, setOriginId] = useState('taksim');
  const [destinationId, setDestinationId] = useState('sultanahmet');
  const [result, setResult] = useState<GuideResult | null>(null);
  const points = guideStations.filter(station => station.id === originId || station.id === destinationId || (result?.status === 'guide' && result.legs.length > 1 && station.id === 'kabatas'));
  const reset = (setter: (value: string) => void, value: string) => { setter(value); setResult(null); };

  return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
    <TransitJourney lang={lang} />
    <div><h1 className="text-3xl font-extrabold text-slate-900">{t.title}</h1><p className="text-[13px] text-slate-600 mt-1">{t.subtitle}</p></div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form className="lg:col-span-5 bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-4" onSubmit={event => { event.preventDefault(); setResult(getTransitGuide(originId, destinationId)); }}>
        <label className="text-[12px] font-bold text-slate-700 block" htmlFor="transit-origin">{t.from}</label>
        <select id="transit-origin" value={originId} onChange={event => reset(setOriginId, event.target.value)} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900">
          {guideStations.map(station => <option key={station.id} value={station.id}>{station.name}</option>)}
        </select>
        <div className="flex items-center justify-between"><label className="text-[12px] font-bold text-slate-700" htmlFor="transit-destination">{t.to}</label><button type="button" onClick={() => { setOriginId(destinationId); setDestinationId(originId); setResult(null); }} aria-label={t.swap} className="p-2 rounded-lg bg-sky-50 text-sky-700"><ArrowDownUp size={16} /></button></div>
        <select id="transit-destination" value={destinationId} onChange={event => reset(setDestinationId, event.target.value)} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900">
          {guideStations.map(station => <option key={station.id} value={station.id}>{station.name}</option>)}
        </select>
        <button type="submit" className="w-full min-h-11 px-3 py-2 bg-[#00A3E0] hover:bg-[#0284C7] text-white font-bold rounded-xl text-[13px] shadow-sm cursor-pointer flex items-center justify-center gap-2"><Train size={17} />{t.submit}</button>
        <p className="text-[12px] text-slate-600 leading-relaxed">{t.coverage}</p>
      </form>
      <div className="lg:col-span-7 min-w-0"><StationMap stations={points} title={t.map} note={t.mapNote} failure={t.mapFailed} /></div>
    </div>
    <div className="flex gap-3 p-4 rounded-xl bg-sky-50 border border-sky-100 text-[13px] text-slate-700 leading-relaxed"><Info size={19} className="shrink-0 mt-0.5 text-sky-700" /><p>{t.notice}</p></div>
    <section aria-live="polite" className="space-y-4">
      <h2 className="text-xl font-extrabold text-slate-900">{t.result}</h2>
      {!result && <p className="text-[13px] text-slate-600">{t.hint}</p>}
      {result?.status === 'same-station' && <p className="p-4 rounded-xl bg-amber-50 text-amber-900 text-sm">{t.same}</p>}
      {result?.status === 'unsupported' && <p className="p-4 rounded-xl bg-amber-50 text-amber-900 text-sm">{t.unsupported}</p>}
      {result?.status === 'guide' && <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-4">
        {result.legs.map((leg, index) => <div key={`${leg.line}-${index}`}>
          {index > 0 && <p className="flex items-center gap-2 my-4 text-[13px] font-semibold text-sky-700"><MapPin size={16} />{t.transfer}</p>}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-2">
            <div className="flex items-center gap-3"><span className="rounded-lg bg-[#00A3E0] text-white px-2.5 py-1 text-sm font-extrabold">{leg.line}</span><h3 className="flex flex-wrap items-center gap-2 font-bold text-slate-900 text-sm">{leg.stations[0].name}<ArrowRight size={16} />{leg.stations.at(-1)?.name}</h3></div>
            <p className="text-[12px] text-slate-700">{t.direction}: {leg.direction}</p>
            <p className="text-[12px] text-slate-600 leading-relaxed"><span className="font-semibold">{t.stops}: </span>{leg.stations.map(station => station.name).join(' → ')}</p>
            <a className="inline-block text-[12px] font-semibold text-sky-700 underline underline-offset-2" href={leg.sourceUrl} target="_blank" rel="noopener noreferrer">Metro İstanbul · {leg.line} · {t.source}</a>
          </div>
        </div>)}
        <p className="text-[12px] text-slate-700">{t.unavailable}</p>
        <p className="text-[11px] text-slate-500">{t.checked}</p>
      </div>}
    </section>
  </main>;
}
