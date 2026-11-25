import {CarFront, TrainFront} from 'lucide-react';
import {venueDestination,venueTravelHref,type PublicVenue} from '../lib/venueDestination';
import type {SearchLanguage} from '../lib/searchLocales';

const labels:Record<SearchLanguage,[string,string]>={
  en:['Estimate taxi fare','Find public transport'], tr:['Taksi ücretini hesapla','Toplu taşıma rotası bul'],
  de:['Taxipreis schätzen','ÖPNV-Verbindung finden'], fr:['Estimer le prix du taxi','Itinéraire en transports en commun'],
  es:['Estimar el precio del taxi','Buscar transporte público'], ar:['تقدير أجرة التاكسي','ابحث عن مسار بالنقل العام'],
  ru:['Рассчитать стоимость такси','Маршрут на общественном транспорте'], zh:['估算出租车费','查询公交路线'],
};

export default function PlaceTravelLinks({lang,city,fallbackCity,...venue}:PublicVenue & {lang:string;city?:string;fallbackCity?:string}) {
  const point=venueDestination(venue);
  if (!point) return null;
  const t=labels[lang as SearchLanguage]??labels.en;
  const style='inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-start text-sm font-semibold text-blue-800 hover:bg-sky-100 focus-visible:outline-blue-700';
  return <div data-place-travel="" className="my-3 flex flex-wrap gap-2">
    <a href={venueTravelHref('taxi',point,lang,city,fallbackCity)} className={style}><CarFront size={17} className="shrink-0" aria-hidden="true"/>{t[0]}</a>
    <a href={venueTravelHref('transit',point,lang,city,fallbackCity)} className={style}><TrainFront size={17} className="shrink-0" aria-hidden="true"/>{t[1]}</a>
  </div>;
}
