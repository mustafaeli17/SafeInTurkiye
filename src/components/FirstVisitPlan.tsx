import {useEffect, useRef, useState} from 'react';
import {ArrowDown, ArrowUp, Check, ExternalLink, Footprints, ListOrdered, Navigation, Plus, Trash2, Utensils} from 'lucide-react';
import {localizePath} from '../lib/searchLocales';
import {destinationSlug} from '../lib/discoveryNavigation';
import {directionsText} from '../lib/searchDestinations';
import {firstVisitPlanSources, firstVisitPlanCopy} from '../data/firstVisitPlans';
import {dayPlanCopy} from './FirstVisitPlan/copy';
import {dayPlanTitle} from './FirstVisitPlan/titles';
import {appendStops, directionsHref, isPlanCity, moveStop, walks, type PlanCity} from './FirstVisitPlan/plan';
import {useDayPlan} from './FirstVisitPlan/useDayPlan';
import './FirstVisitPlan/plan.css';

function CityPlan({city, lang}: {city: PlanCity; lang: string}) {
  const {stops, update, saveFailed} = useDayPlan(city);
  const [confirmClear, setConfirmClear] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const t = dayPlanCopy(lang);
  const guide = firstVisitPlanCopy[lang] ?? firstVisitPlanCopy.en;
  const directory = '/restaurants?city=' + destinationSlug(city);
  const routeLabel = directionsText[lang] ?? directionsText.en;
  useEffect(() => {
    if (window.location.hash !== '#day-plan') return;
    const frame = requestAnimationFrame(() => {
      panel.current?.focus({preventScroll: true});
      panel.current?.scrollIntoView({block: 'start'});
    });
    return () => cancelAnimationFrame(frame);
  }, [city]);

  return <section id="day-plan" className="first-visit-plan" ref={panel} tabIndex={-1}
    aria-labelledby="day-plan-title" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <h2 id="day-plan-title"><ListOrdered size={21} aria-hidden="true"/>{dayPlanTitle(lang)}</h2>
    <p className="plan-storage">{t.local}</p>
    <h3>{t.walks}</h3>
    <div className="plan-walks">
      {walks[city].map(walk => {
        const included = walk.every(id => stops.some(stop => stop.id === id));
        const label = walk.map(id => t.landmarks[id]).join(' · ');
        return <button key={walk[0]} type="button" disabled={included} aria-label={t.addWalk + ' — ' + label}
          onClick={() => void update(current => appendStops(current, walk.map(id => ({kind: 'landmark', id}))))}>
          <Footprints size={17} aria-hidden="true"/><span>{label}</span>
          {included ? <Check size={18} aria-hidden="true"/> : <Plus size={18} aria-hidden="true"/>}
        </button>;
      })}
    </div>
    <h3 aria-live="polite">{t.stops}{stops.length > 0 && ' (' + stops.length.toLocaleString(lang) + ')'}</h3>
    {stops.length === 0 ? <p className="plan-empty">{t.empty}</p> : <ol className="plan-stops">
      {stops.map((stop, index) => {
        const label = stop.kind === 'landmark' ? t.landmarks[stop.id] : (stop.kind === 'google' ? stop.nickname : stop.label) || t.restaurant;
        return <li key={stop.id}>
          <span className="plan-order" aria-hidden="true">{(index + 1).toLocaleString(lang)}</span>
          <div className="plan-stop-info">
            {stop.kind === 'landmark' ? <strong>{label}</strong> :
              <a className="plan-restaurant-name" href={localizePath(directory + '&place=' + encodeURIComponent(stop.id), lang)}><bdi>{label}</bdi></a>}
            <a className="plan-directions" href={directionsHref(city, stop, stops[index - 1])} target="_blank" rel="noopener noreferrer"
              aria-label={routeLabel + ' — ' + label + ' (Google Maps)'}><Navigation size={13} aria-hidden="true"/>{routeLabel}</a>
          </div>
          <div className="plan-tools">
            <button type="button" disabled={index === 0} aria-label={t.up + ' — ' + label} title={t.up}
              onClick={() => void update(current => moveStop(current, stop.id, -1))}><ArrowUp size={17} aria-hidden="true"/></button>
            <button type="button" disabled={index === stops.length - 1} aria-label={t.down + ' — ' + label} title={t.down}
              onClick={() => void update(current => moveStop(current, stop.id, 1))}><ArrowDown size={17} aria-hidden="true"/></button>
            <button type="button" aria-label={t.remove + ' — ' + label} title={t.remove}
              onClick={() => void update(current => current.filter(item => item.id !== stop.id))}><Trash2 size={16} aria-hidden="true"/></button>
          </div>
        </li>;
      })}
    </ol>}
    <div className="plan-actions">
      <a href={localizePath(directory, lang)}><Utensils size={16} aria-hidden="true"/>{t.find}</a>
      {stops.length > 0 && !confirmClear && <button type="button" onClick={() => setConfirmClear(true)}>{t.clear}</button>}
    </div>
    {confirmClear && stops.length > 0 && <div className="plan-confirm">
      <p>{t.confirm}</p>
      <button type="button" onClick={async () => {if (await update(() => [])) setConfirmClear(false);}}>{t.clear}</button>
      <button type="button" onClick={() => setConfirmClear(false)}>{t.cancel}</button>
    </div>}
    {saveFailed && <p role="alert">{t.error}</p>}
    <details className="plan-guide">
      <summary>{guide[0]}</summary><p>{guide[city === 'İstanbul' ? 1 : 2]}</p><p>{guide[3]}</p>
      <div><a href={localizePath('/transport?city=' + destinationSlug(city), lang)}>{guide[4]}</a>
        <a href={firstVisitPlanSources[city].url} target="_blank" rel="noopener noreferrer">{guide[5]} <ExternalLink size={13} aria-hidden="true"/></a></div>
    </details>
  </section>;
}

export default function FirstVisitPlan({city, lang}: {city: string; lang: string}) {
  return isPlanCity(city) ? <CityPlan key={city} city={city} lang={lang}/> : null;
}
