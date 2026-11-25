import {useEffect, useRef} from 'react';
import {CalendarDays, Check, ExternalLink, Footprints, ListOrdered, Plus, Utensils} from 'lucide-react';
import {localizePath} from '../lib/searchLocales';
import {destinationSlug} from '../lib/discoveryNavigation';
import {plannerHref} from './FirstVisitPlan/plannerCopy';
import {firstVisitPlanSources, firstVisitPlanCopy} from '../data/firstVisitPlans';
import {dayPlanCopy} from './FirstVisitPlan/copy';
import {dayPlanTitle} from './FirstVisitPlan/titles';
import {appendStops, isPlanCity, walks, type PlanCity} from './FirstVisitPlan/plan';
import {useDayPlan} from './FirstVisitPlan/useDayPlan';
import './FirstVisitPlan/plan.css';

function CityPlan({city, lang}: {city: PlanCity; lang: string}) {
  const {stops, update, saveFailed} = useDayPlan(city);
  const panel = useRef<HTMLElement>(null);
  const t = dayPlanCopy(lang);
  const guide = firstVisitPlanCopy[lang] ?? firstVisitPlanCopy.en;
  const directory = '/restaurants?city=' + destinationSlug(city);
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
        const included = walk.every(id => stops.some(stop => stop.id === id && !stop.date));
        const label = walk.map(id => t.landmarks[id]).join(' · ');
        return <button key={walk[0]} type="button" disabled={included} aria-label={t.addWalk + ' — ' + label}
          onClick={() => void update(current => appendStops(current, walk.map(id => ({kind: 'landmark', id}))))}>
          <Footprints size={17} aria-hidden="true"/><span>{label}</span>
          {included ? <Check size={18} aria-hidden="true"/> : <Plus size={18} aria-hidden="true"/>}
        </button>;
      })}
    </div>
    <div className="plan-actions">
      <a href={plannerHref(city, lang)}><CalendarDays size={16} aria-hidden="true"/>{t.view}{stops.length > 0 && ' (' + stops.length.toLocaleString(lang) + ')'}</a>
      <a href={localizePath(directory, lang)}><Utensils size={16} aria-hidden="true"/>{t.find}</a>
    </div>
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
