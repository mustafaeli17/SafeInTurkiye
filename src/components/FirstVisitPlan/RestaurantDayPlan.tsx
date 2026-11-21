import {useState} from 'react';
import {Check, ListPlus} from 'lucide-react';
import {cityPath} from '../../lib/publicRoutes';
import {localizePath} from '../../lib/searchLocales';
import {cityDisplayName} from '../../lib/cityLocale';
import type {NearbyPlaceRecord} from '../../services/nearbyPlaces';
import {appendStops, restaurantStop, type PlanCity} from './plan';
import {mentionedSearchCity} from '../../services/searchCities';
import {dayPlanCopy} from './copy';
import {useDayPlan} from './useDayPlan';

type Props = {lang: string; place: NearbyPlaceRecord};
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-blue-200 bg-sky-50 px-4 py-2 text-sm font-bold text-blue-800';

function SaveAction({city, lang, place}: Props & {city: PlanCity}) {
  const {stops, update, saveFailed} = useDayPlan(city);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const t = dayPlanCopy(lang);
  const saved = stops.some(item => item.id === place.id);
  const stop = restaurantStop(place, nickname);
  if (!stop) return null;
  const save = () => update(current => appendStops(current, [stop]));
  const cityName = cityDisplayName(city, lang);
  return <>
    {saved ? <a href={localizePath(cityPath(city) + '#day-plan', lang)}><Check size={18} aria-hidden="true"/>{t.view} · {cityName}</a> :
      editing ? <form className="flex w-full flex-wrap items-end gap-2 text-sm" onSubmit={event => {event.preventDefault(); void save();}}>
        <label className="grid gap-1">{t.nickname}<input autoFocus autoComplete="off" maxLength={100} value={nickname}
          onChange={event => setNickname(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3"/></label>
        <button type="submit" className={buttonClass}>{t.add} · {cityName}</button>
        <button type="button" className="min-h-11 px-2 underline" onClick={() => setEditing(false)}>{t.cancel}</button>
      </form> : <button type="button" className={buttonClass} onClick={() => stop.kind === 'google' ? setEditing(true) : void save()}>
        <ListPlus size={18} aria-hidden="true"/>{t.add} · {cityName}
      </button>}
    {saveFailed && <p className="w-full text-sm" role="alert">{t.error}</p>}
  </>;
}

export default function RestaurantDayPlan(props: Props) {
  // A directory search can return a venue outside its selected city.
  const slug = props.place.cityName && mentionedSearchCity(props.place.cityName);
  const city = slug === 'istanbul' ? 'İstanbul' : slug === 'antalya' ? 'Antalya' : null;
  return city ? <SaveAction key={city + props.place.id} {...props} city={city}/> : null;
}
