import PageLoading from './components/PageLoading';
import { useEffect, useState, lazy, Suspense } from 'react';
import App from './App';
import {sectionFromPath} from './lib/sectionNavigation';
import {navigateTo,useBrowserLocation} from './lib/browserNavigation';
import {isRetiredRestaurantPath} from './lib/retiredRestaurants';
import SiteInformation from './components/SiteInformation';
import { readLanguagePreference } from './lib/languagePreference';
import { directoryEntry, registerPublishedEntry, photoCuratedCatalog } from './lib/directory';
import type { DirectoryEntry } from './lib/directory';
import { requireSupabase } from './lib/supabase';
import {publicCities} from './lib/publicRoutes';
import {foundationEnabled} from './lib/foundationConfig';
const DirectoryDetail=lazy(()=>import('./components/DirectoryDetail'));
export default function TravelApp() {
  const location=useBrowserLocation();
  const path=location.split('?')[0];
  const [remote,setRemote]=useState<{path:string;entry?:DirectoryEntry;error?:boolean}|null>(null);
  const cmsPattern=/^(?:\/tr)?\/(hotels|restaurants|activities)\/([a-z0-9-]+)\/?$/;
  const legacyPattern=/^\/(hotels|restaurants|activities)\/[a-z0-9-]+--([a-f0-9-]{36})\/?$/;
  const match=path.match(foundationEnabled?cmsPattern:legacyPattern);
  useEffect(()=>{
    const route=path.match(foundationEnabled?/^(?:\/tr)?\/(hotels|restaurants|activities)\/([a-z0-9-]+)\/?$/:/^\/(hotels|restaurants|activities)\/[a-z0-9-]+--([a-f0-9-]{36})\/?$/);
    if(!route||photoCuratedCatalog||isRetiredRestaurantPath(path)){if(route)setRemote({path});return;}
    let cancelled=false;
    void (async()=>{
      try {
        const {data,error}=await requireSupabase().from(route[1]).select('*, city:cities(name)').eq(foundationEnabled?'public_slug':'id',route[2]).eq('active',true).eq('status','PUBLISHED').abortSignal(AbortSignal.timeout(12000)).maybeSingle();
        if(cancelled)return;
        setRemote({path,...(error?{error:true}:data?{entry:registerPublishedEntry(data,route[1])}:{})});
      }catch { if(!cancelled)setRemote({path,error:true}); }
    })();
    return()=>{cancelled=true;};
  },[path]);
  const localized=path.startsWith('/tr/');
  const entryPath=localized?path.slice(3):path;
  const candidate=match ? (remote?.path===path?remote.entry:undefined) : directoryEntry(entryPath);
  const entry=localized&&!candidate?.description.tr?undefined:candidate;
  const back=()=>navigateTo('/');
  const preference=readLanguagePreference();
  // Keep existing non-indexed language preferences working; Turkish indexed
  // routes are explicit and do not depend on a previous browser visit.
  const language=entry?(localized?'tr':preference==='tr'?'en':preference):preference;
  const city=publicCities.find(item=>path.replace(/\/$/,'')===`/cities/${item.slug}`);
  const section=sectionFromPath(path);
  if(['/privacy','/terms','/about','/contact'].includes(path))return <SiteInformation page={path.slice(1) as 'privacy'|'terms'|'about'|'contact'}/>;
  if(section||city||path==='/')return <App initialSection={section} initialCity={city?.name} initialLanguage={preference}/>;
  if(match && remote?.path!==path)return <PageLoading lang={language}/>;
  if(path!=='/'&&!entry)return <main className="max-w-xl mx-auto p-8 space-y-4"><h1 className="text-xl font-bold">{language==='tr'?'İçerik şu anda görüntülenemiyor':'This page is currently unavailable'}</h1><p>{language==='tr'?'Kayıt yayından kaldırılmış veya bağlantı geçici olarak kesilmiş olabilir.':'The entry may no longer be published, or the connection may be temporarily unavailable.'}</p><button className="text-blue-700 underline" onClick={back}>{language==='tr'?'Ana sayfaya dön':'Back to home'}</button></main>;
  return entry ? <Suspense fallback={<PageLoading lang={language}/>}><DirectoryDetail key={entry.id} entry={entry} lang={language} onBack={back}/></Suspense> : <App/>;
}
