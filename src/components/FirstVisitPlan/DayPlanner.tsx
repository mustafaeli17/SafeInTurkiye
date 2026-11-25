import {useState} from 'react';
import {ArrowDown, ArrowRight, ArrowUp, BedDouble, CalendarDays, Check, Compass, Film, Landmark, MapPin, Navigation, Pencil, Plus, Trash2, Utensils} from 'lucide-react';
import {cityDisplayName} from '../../lib/cityLocale';
import {cityPath, publicCities} from '../../lib/publicRoutes';
import {localizePath} from '../../lib/searchLocales';
import {navigateTo, updateLocationQuery} from '../../lib/browserNavigation';
import {directionsText} from '../../lib/searchDestinations';
import CityArtwork from '../CityArtwork';
import {dayPlanCopy} from './copy';
import {dayPlanTitle} from './titles';
import {plannerHref, plannerText} from './plannerCopy';
import {appendStops, assignStop, directionsHref, entryKey, manualStop, moveDayStop, planSlots, slotForStop, stopDetailPath, validPlanDate, type DayStop, type PlanSlot} from './plan';
import {useDayPlan} from './useDayPlan';
import './dayPlanner.css';

const slotIcons = {hotel:BedDouble, breakfast:Utensils, lunch:Utensils, dinner:Utensils, dessert:Utensils, tour:Compass, museum:Landmark, activity:MapPin, cinema:Film};
const directories = [['hotels',BedDouble],['restaurants',Utensils],['activities',Landmark],['tours',Compass]] as const;
function stopName(stop: DayStop, lang: string) {
  if (stop.kind === 'landmark') return dayPlanCopy(lang).landmarks[stop.id];
  if ('label' in stop) return stop.label;
  return stop.nickname || plannerText(lang).slots[slotForStop(stop)];
}
function dateLabel(day: string, lang: string) {
  return new Intl.DateTimeFormat(lang, {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}).format(new Date(day + 'T12:00:00Z'));
}

type EditorProps = {lang:string; date:string; stop?:DayStop; onSave:(name:string, slot:PlanSlot, date:string)=>Promise<boolean>; onCancel:()=>void};
function StopEditor({lang, date, stop, onSave, onCancel}: EditorProps) {
  const t = plannerText(lang);
  const usesNickname = stop?.kind === 'google' || stop?.kind === 'tour';
  const needsName = !stop || stop.kind === 'manual';
  const [name, setName] = useState(usesNickname ? stop.nickname : stop ? stopName(stop, lang) : '');
  const [slot, setSlot] = useState<PlanSlot>(stop ? slotForStop(stop) : 'activity');
  const [selected, setSelected] = useState(date);
  const [busy, setBusy] = useState(false);
  return <form className="dp-editor" onSubmit={async event => {
    event.preventDefault();
    if (busy || (selected && !validPlanDate(selected))) return;
    setBusy(true);
    try {await onSave(name.trim(), slot, selected);} finally {setBusy(false);}
  }}>
    {(needsName || usesNickname) && <label>{usesNickname ? dayPlanCopy(lang).nickname : t.name}<input autoFocus required={needsName} maxLength={100} value={name} onChange={e=>setName(e.target.value)} /></label>}
    <label>{t.category}<select value={slot} onChange={e=>setSlot(e.target.value as PlanSlot)}>{planSlots.map(id=><option key={id} value={id}>{t.slots[id]}</option>)}</select></label>
    <label>{t.date}<input type="date" value={selected} onChange={e=>setSelected(e.target.value)} /></label>
    <div className="dp-editor-actions"><button className="dp-primary" disabled={busy || (needsName && !name.trim())}><Check size={16}/>{t.save}</button>
      <button type="button" onClick={onCancel}>{dayPlanCopy(lang).cancel}</button></div>
  </form>;
}

export default function DayPlanner({city, lang, query}: {city:string; lang:string; query:string}) {
  const {stops, update, saveFailed} = useDayPlan(city);
  const [editing, setEditing] = useState<string|null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [conflict, setConflict] = useState(false);
  const t = plannerText(lang), base = dayPlanCopy(lang);
  const days = [...new Set(stops.flatMap(item=>item.date ? [item.date] : []))].sort();
  const parameter = new URLSearchParams(query).get('day');
  const defaultDay = parameter === 'undated' || stops.some(stop => !stop.date) ? '' : days[0] || '';
  const day = validPlanDate(parameter) ? parameter : defaultDay;
  const visible = stops.filter(item=>(item.date || '')===day);
  const slug = publicCities.find(c=>c.name===city)?.slug;
  const cityName = cityDisplayName(city,lang);
  const selectDay = (next:string) => {
    setEditing(null); setConflict(false); setConfirmClear(false);
    updateLocationQuery({day: next || 'undated'});
  };
  function begin(key:string|null) {setEditing(key); setConflict(false); setConfirmClear(false);}
  async function saveEntry(stop:DayStop|undefined, name:string, slot:PlanSlot, date:string) {
    let applied = false;
    const ok = await update(current=>{
      if (!stop) {
        const newStop = manualStop(name,slot,date);
        if (!newStop) return current;
        applied=true;
        return appendStops(current,[newStop]);
      }
      const assigned = assignStop(current,entryKey(stop),{date:date || undefined,slot});
      if (assigned===current) return current;
      applied=true;
      const newKey=entryKey({...stop, date:date || undefined, slot});
      return assigned.map(item=>{
        if (entryKey(item)!==newKey) return item;
        if (item.kind==='manual') return {...item,label:name};
        if (item.kind==='google' || item.kind==='tour') return {...item,nickname:name};
        return item;
      });
    });
    if (ok && applied) selectDay(date);
    else if (ok) setConflict(true);
    return ok && applied;
  }
  const scheduleDays = [...new Set([...days,...(day?[day]:[])])].sort();
  return <section className="day-planner" dir={lang==='ar'?'rtl':'ltr'}>
    <header className="dp-header">
      <div className="dp-heading"><a href={localizePath(cityPath(city),lang)}><MapPin size={15}/>{cityName}<span aria-hidden="true"> · </span>{t.guide}</a>
        <h1>{dayPlanTitle(lang)}</h1><p>{base.local}</p></div>
      <div className="dp-art" aria-hidden="true"><CityArtwork city={city} lang={lang}/></div>
    </header>
    <div className="dp-layout">
      <div className="dp-main">
        <div className="dp-controls">
          <label>{t.city}<select value={city} onChange={e=>navigateTo(plannerHref(e.target.value,lang,day || undefined))}>{publicCities.map(c=><option key={c.slug} value={c.name}>{cityDisplayName(c.name,lang)}</option>)}</select></label>
          <label>{t.chooseDate}<input type="date" value={day} onChange={e=>{if(!e.target.value || validPlanDate(e.target.value)) selectDay(e.target.value);}}/></label>
        </div>
        <div className="dp-days" aria-label={t.date}>
          {['',...scheduleDays].map(d=><button key={d} type="button" aria-pressed={d===day} onClick={()=>selectDay(d)}>{d ? dateLabel(d,lang) : t.unscheduled}</button>)}
        </div>
        <div className="dp-listhead"><h2>{base.stops} <span>{visible.length.toLocaleString(lang)}</span></h2>
          <button type="button" className="dp-primary" aria-expanded={editing==='new'} onClick={()=>begin(editing==='new'?null:'new')}><Plus size={17}/>{t.addStop}</button></div>
        {editing==='new' && <StopEditor lang={lang} date={day} onCancel={()=>begin(null)} onSave={(name,slot,d)=>saveEntry(undefined,name,slot,d)}/>}
        {!visible.length && <p className="dp-empty"><CalendarDays size={21}/>{t.empty}</p>}
        <ol className="dp-stops">{visible.map((stop,index)=>{
          const key=entryKey(stop), slot=slotForStop(stop), Icon=slotIcons[slot], label=stopName(stop,lang);
          const internal=stopDetailPath(city,stop);
          const detailLanguage = stop.kind==='directory' && !(lang==='tr' && stop.hasTurkish) ? 'en' : lang;
          const href=internal ? localizePath(internal,detailLanguage) : stop.kind==='tour'?stop.url:null;
          const directions=directionsHref(city,stop,visible[index-1]);
          return <li key={key}><span className="dp-index">{(index+1).toLocaleString(lang)}</span>
            <div className="dp-item"><div className="dp-slot"><Icon size={14}/>{t.slots[slot]}</div>
              {href ? <a className="dp-name" href={href} target={stop.kind==='tour'?'_blank':undefined} rel={stop.kind==='tour'?'sponsored noopener noreferrer':undefined}><bdi>{label}</bdi><ArrowRight size={15}/></a> : <strong className="dp-name"><bdi>{label}</bdi></strong>}
              {directions && <a className="dp-dir" href={directions} target="_blank" rel="noopener noreferrer"><Navigation size={13}/>{directionsText[lang]??directionsText.en}</a>}
            </div>
            <div className="dp-tools">
              <button type="button" title={base.up} aria-label={base.up+' · '+label} disabled={index===0} onClick={()=>void update(current=>moveDayStop(current,key,-1))}><ArrowUp/></button>
              <button type="button" title={base.down} aria-label={base.down+' · '+label} disabled={index===visible.length-1} onClick={()=>void update(current=>moveDayStop(current,key,1))}><ArrowDown/></button>
              <button type="button" title={t.edit} aria-label={t.edit+' · '+label} aria-expanded={editing===key} onClick={()=>begin(editing===key?null:key)}><Pencil/></button>
              <button type="button" title={base.remove} aria-label={base.remove+' · '+label} onClick={()=>void update(current=>current.filter(item=>entryKey(item)!==key))}><Trash2/></button>
            </div>
            {editing===key && <StopEditor lang={lang} stop={stop} date={day} onCancel={()=>begin(null)} onSave={(name,slot,d)=>saveEntry(stop,name,slot,d)}/>}
          </li>;
        })}</ol>
        {conflict && <p role="alert">{t.duplicate}</p>}
        {saveFailed && <p role="alert">{base.error}</p>}
        {stops.length>0 && <div className="dp-clear">{confirmClear ? <><strong><bdi>{cityName}</bdi> · {base.confirm}</strong><button type="button" onClick={async()=>{if(await update(()=>[])) selectDay('');}}>{base.clear}</button><button type="button" onClick={()=>setConfirmClear(false)}>{base.cancel}</button></>:<button type="button" onClick={()=>setConfirmClear(true)}>{base.clear}</button>}</div>}
      </div>
      <aside className="dp-aside"><h2><Compass size={20}/>{t.discover}</h2>
        {directories.map(([path,Icon])=>{const params=new URLSearchParams({city:slug || ''});if(day) params.set('planDate',day);return <a key={path} href={localizePath('/'+path+'?'+params,lang)}><Icon size={20}/><span>{t[path]}</span><ArrowRight size={16}/></a>;})}
      </aside>
    </div>
  </section>;
}
