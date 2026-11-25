import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, ListPlus, X} from 'lucide-react';
import {cityDisplayName} from '../../lib/cityLocale';
import {publicCities} from '../../lib/publicRoutes';
import type {NearbyPlaceRecord} from '../../services/nearbyPlaces';
import {dayPlanCopy} from './copy';
import {appendStops, entryKey, placeStop, planCityForName, slotForStop, tourStop, validPlanDate, type DayStop, type PlanSlot} from './plan';
import {plannerHref, plannerText} from './plannerCopy';
import {useDayPlan} from './useDayPlan';
import './saveToDayPlan.css';

function discoveryDate() {
  const value = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('planDate') : null;
  return validPlanDate(value) ? value : '';
}

export function ScheduleStop({city, lang, stop, name}: {city: string | null; lang: string; stop: DayStop; name?: string | null}) {
  const t = dayPlanCopy(lang);
  const p = plannerText(lang);
  const [selectedCity, setSelectedCity] = useState(city ?? '');
  const {stops, update, saveFailed} = useDayPlan(selectedCity);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [date, setDate] = useState(discoveryDate);
  const [slot, setSlot] = useState<PlanSlot>(slotForStop(stop));
  const [pending, setPending] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const initialSlot = slotForStop(stop);
  const slots: PlanSlot[] = stop.section === 'restaurants' ? ['breakfast','lunch','dinner','dessert'] :
    stop.section === 'activities' ? ['activity','museum','cinema'] : [initialSlot];
  const scheduled = {...stop, slot, ...(date ? {date} : {})};
  if (scheduled.kind === 'google' || scheduled.kind === 'tour') scheduled.nickname = nickname.trim();
  const scheduledKey = entryKey(scheduled);
  const duplicate = stops.find(existing => entryKey(existing) === scheduledKey);
  const saved = duplicate ?? stops.find(existing => existing.id === stop.id);
  const displayCity = selectedCity ? cityDisplayName(selectedCity, lang) : '';
  useEffect(() => {
    const element = dialog.current;
    if (!editing || !element) return;
    const opener = trigger.current;
    element.showModal();
    return () => {
      if (element.open) element.close();
      if (opener?.isConnected) opener.focus({preventScroll: true});
    };
  }, [editing]);

  return <div className="save-day-stop">
    <button type="button" ref={trigger} className="save-day-trigger" aria-haspopup="dialog" onClick={() => setEditing(true)}>
      <ListPlus size={18} aria-hidden="true"/>{t.add}{displayCity && <span className="sr-only"> · {displayCity}</span>}
    </button>
    {saved && selectedCity && <a className="save-day-view" href={plannerHref(selectedCity, lang, saved.date)}><Check size={16} aria-hidden="true"/>{t.view}</a>}
    {editing && createPortal(<dialog ref={dialog} className="save-day-dialog" aria-labelledby={heading} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}
      onCancel={event => {event.preventDefault(); setEditing(false);}} onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setEditing(false);
      }}>
      <form onSubmit={async event => {
        event.preventDefault();
        event.stopPropagation();
        if (!selectedCity || pending || duplicate || (date && !validPlanDate(date))) return;
        setPending(true);
        const ok = await update(current => appendStops(current, [scheduled]));
        setPending(false);
        if (ok) setEditing(false);
      }}>
        <div className="save-day-heading"><h2 id={heading}>{t.add}</h2><button type="button" aria-label={t.cancel} onClick={() => setEditing(false)}><X size={19} aria-hidden="true"/></button></div>
        <p className="save-day-context"><bdi>{name}</bdi>{name && displayCity && ' · '}{displayCity}</p>
        {!city && <label>{p.city}<select aria-label={p.city} required value={selectedCity} onChange={event => setSelectedCity(event.target.value)}>
          <option value="" disabled>—</option>{publicCities.map(destination =>
            <option key={destination.slug} value={destination.name}>{cityDisplayName(destination.name, lang)}</option>)}
        </select></label>}
        <div className="save-day-fields">
          <label>{p.date}<input type="date" value={date} onChange={event => setDate(event.target.value)}/></label>
          <label>{p.category}<select aria-label={p.category} value={slot} onChange={event => setSlot(event.target.value as PlanSlot)}>{slots.map(item => <option key={item} value={item}>{p.slots[item]}</option>)}</select></label>
        </div>
        {(stop.kind === 'google' || stop.kind === 'tour') && <label>{t.nickname}<input type="text" autoComplete="off" maxLength={100} value={nickname} onChange={event => setNickname(event.target.value)}/></label>}
        {duplicate && selectedCity && <p role="status">{p.duplicate} <a href={plannerHref(selectedCity, lang, date)}>{t.view}</a></p>}
        {saveFailed && <p role="alert">{t.error}</p>}
        <button type="submit" className="save-day-submit" disabled={!selectedCity || pending || !!duplicate}>{p.save}</button>
      </form>
    </dialog>, document.body)}
  </div>;
}

export function PlaceDayPlan({lang, place}: {lang: string; place: NearbyPlaceRecord}) {
  const city = planCityForName(place.cityName);
  const section = place.category === 'hotel' ? 'hotels' :
    place.category === 'restaurant' || place.category === 'cafe' ? 'restaurants' : 'activities';
  const stop = placeStop(place, section);
  return stop ? <ScheduleStop key={stop.id + (city ?? '')} city={city} lang={lang} stop={stop} name={place.name}/> : null;
}

export function TourDayPlan({city, lang, code, url, name}: {city: string; lang: string; code: string; url: string; name: string}) {
  const stop = tourStop(code, url);
  return stop ? <ScheduleStop key={city + stop.id} city={city} lang={lang} stop={stop} name={name}/> : null;
}
