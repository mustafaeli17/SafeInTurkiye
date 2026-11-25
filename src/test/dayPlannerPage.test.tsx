import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import DayPlanner from '../components/FirstVisitPlan/DayPlanner';
import DirectoryDetail from '../components/DirectoryDetail';
import {plannerHref, plannerText} from '../components/FirstVisitPlan/plannerCopy';
import {dayPlanTitle} from '../components/FirstVisitPlan/titles';
import {planSlots} from '../components/FirstVisitPlan/plan';
import {publicCities} from '../lib/publicRoutes';
import {localizePath, searchLanguages} from '../lib/searchLocales';

describe('city day planner entry points',()=>{
  it.each(searchLanguages)('opens and carries the selected destination and date into discovery in %s',lang=>{
    for(const {name,slug} of publicCities) {
      const url=plannerHref(name,lang,'2026-12-12');
      expect(url).toBe(localizePath('/cities/'+slug+'?view=plan&day=2026-12-12',lang));
      const html=renderToStaticMarkup(<DayPlanner lang={lang} city={name} query={url.split('?')[1]}/>);
      expect(html).toContain(dayPlanTitle(lang));
      expect(html).toContain('value="2026-12-12"');
      for (const directory of ['hotels','restaurants','activities','tours']) {
        expect(html).toContain(localizePath('/'+directory+'?city='+slug+'&amp;planDate=2026-12-12',lang));
      }
      expect(html).toContain('dir="'+(lang==='ar'?'rtl':'ltr')+'"');
    }
    expect(Object.keys(plannerText(lang).slots).sort()).toEqual([...planSlots].sort());
  });
  it('opens the undated plan when given an invalid date',()=>{
    const html=renderToStaticMarkup(<DayPlanner lang="tr" city="İstanbul" query="view=plan&day=2026-02-31"/>);
    expect(html).not.toContain('2026-02-31');
    expect(html).toContain('Tarihsiz');
  });
  it('offers the same save action on a published hotel detail with no map coordinates',()=>{
    const entry = {kind:'hotels', id:'aaaa0000-0000-4000-b000-000000000001', slug:'qa-hotel', name:'QA hotel',
      city:'Bursa', description:{en:'Test fixture'}, website:'', sourceUrl:'', lastVerified:null, gallery:[]};
    const html=renderToStaticMarkup(<DirectoryDetail entry={entry} lang="en" onBack={()=>{}}/>);
    expect(html).toContain('Add to day plan');
    expect(html).toContain('aria-haspopup="dialog"');
  });
});
