import { Bus, ExternalLink } from 'lucide-react';

const copy: Record<string, [string, string, string]> = {
  tr: ['Metrobüs — metrodan farklı bir ulaşım türü', 'Metrobüs, İstanbul’un iki yakasını Beylikdüzü–Söğütlüçeşme koridorunda bağlayan hızlı otobüs sistemidir. Bineceğiniz aracın son durağını kontrol edin; her sefer bütün koridoru gitmez. İstanbulkart ve güncel ücret koşullarını yolculuktan önce kontrol edin.', 'İETT: duraklar, hat ve hareket saatleri'],
  en: ['Metrobüs — bus rapid transit, not a metro', 'Metrobüs links the two sides of İstanbul along the Beylikdüzü–Söğütlüçeşme corridor. Check the destination on the bus; not every service covers the whole corridor. Check İstanbulkart and current fare conditions before travelling.', 'İETT: stops, route and departures'],
  de: ['Metrobüs — Schnellbus, keine Metro', 'Der Metrobüs verbindet beide Seiten Istanbuls auf dem Korridor Beylikdüzü–Söğütlüçeşme. Prüfen Sie das Fahrtziel: Nicht jede Fahrt bedient die gesamte Strecke. Informieren Sie sich vorab über İstanbulkart und aktuelle Tarife.', 'İETT: Haltestellen, Strecke und Abfahrten'],
  fr: ['Metrobüs — bus rapide, pas un métro', 'Le Metrobüs relie les deux rives sur le corridor Beylikdüzü–Söğütlüçeşme. Vérifiez la destination du bus : tous les services ne parcourent pas toute la ligne. Consultez les conditions İstanbulkart et les tarifs actuels.', 'İETT : arrêts, itinéraire et départs'],
  ar: ['متروبوس — حافلات سريعة وليس مترو', 'يربط المتروبوس جانبي إسطنبول عبر محور بيليك دوزو–سوغوتلو تشيشمه. تحقق من وجهة الحافلة؛ لا تغطي كل الرحلات المسار بالكامل. راجع شروط إسطنبول كارت والتعرفة الحالية قبل الرحلة.', 'İETT: المحطات والمسار ومواعيد الانطلاق'],
  ru: ['Метробус — скоростной автобус, не метро', 'Метробус соединяет две стороны Стамбула по коридору Бейликдюзю–Сёгютлючешме. Проверяйте конечную остановку: не все рейсы проходят весь маршрут. До поездки уточните условия İstanbulkart и тарифы.', 'İETT: остановки, маршрут и отправления'],
  zh: ['Metrobüs — 快速公交，并非地铁', 'Metrobüs 沿 Beylikdüzü–Söğütlüçeşme 走廊连接伊斯坦布尔两岸。请确认车辆终点，并非每班车都行驶全程。出行前请查询 İstanbulkart 使用条件和最新票价。', 'İETT：车站、线路与发车时间'],
};

export default function MetrobusGuide({ lang }: { lang: string }) {
  const t = copy[lang.toLowerCase()] ?? copy.en;
  return <section className="rounded-2xl border border-sky-100 bg-white p-5 space-y-3">
    <h2 className="flex items-center gap-2 font-extrabold text-slate-900"><Bus aria-hidden="true" className="h-5 w-5 text-[#087FFF]" />{t[0]}</h2>
    <p className="text-sm leading-relaxed text-slate-600">{t[1]}</p>
    <a className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 underline" href="https://www.iett.istanbul/RouteDetail?hkod=34G" target="_blank" rel="noreferrer">{t[2]}<ExternalLink aria-hidden="true" className="h-4 w-4" /></a>
    <p className="text-xs text-slate-500">İETT · 2026-09-24 · <a className="underline" href="https://www.iett.istanbul/icerik/Metrobus" target="_blank" rel="noreferrer">Metrobüs</a> · <a className="underline" href="https://www.istanbulkart.istanbul/" target="_blank" rel="noreferrer">İstanbulkart</a></p>
  </section>;
}
