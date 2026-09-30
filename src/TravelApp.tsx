import { useEffect, useState, lazy, Suspense } from 'react';
import App from './App';
import { directoryEntry, registerPublishedEntry, photoCuratedCatalog } from './lib/directory';
import type { DirectoryEntry } from './lib/directory';
import { requireSupabase } from './lib/supabase';
import cityGuides from './data/cityGuides.json';
const CityGuide=lazy(()=>import('./components/CityGuide'));
const DirectoryDetail=lazy(()=>import('./components/DirectoryDetail'));
export default function TravelApp() {
  const [path,setPath]=useState(window.location.pathname);
  const [remote,setRemote]=useState<{path:string;entry?:DirectoryEntry;error?:boolean}|null>(null);
  useEffect(()=>{ const update=()=>setPath(window.location.pathname); window.addEventListener('popstate',update);return()=>window.removeEventListener('popstate',update); },[]);
  const match=path.match(/^\/(hotels|restaurants|activities)\/[a-z0-9-]+--([a-f0-9-]{36})\/?$/);
  useEffect(()=>{
    const route=path.match(/^\/(hotels|restaurants|activities)\/[a-z0-9-]+--([a-f0-9-]{36})\/?$/);
    if(!route||photoCuratedCatalog){if(route)setRemote({path});return;}
    let cancelled=false;
    void (async()=>{
      try {
        const {data,error}=await requireSupabase().from(route[1]).select('*, city:cities(name)').eq('id',route[2]).eq('active',true).eq('status','PUBLISHED').abortSignal(AbortSignal.timeout(12000)).maybeSingle();
        if(cancelled)return;
        setRemote({path,...(error?{error:true}:data?{entry:registerPublishedEntry(data,route[1])}:{})});
      }catch { if(!cancelled)setRemote({path,error:true}); }
    })();
    return()=>{cancelled=true;};
  },[path]);
  const entry=match ? (remote?.path===path?remote.entry:undefined) : directoryEntry(path);
  const back=()=>{window.history.pushState({},'','/');setPath('/');};
  const language=localStorage.getItem('safeinturkiye-language') ?? 'en';
  const city=cityGuides.find(item=>path.replace(/\/$/,'')===`/cities/${item.slug}`);
  if(city)return <Suspense fallback={<main className="p-8" aria-busy="true">SafeInTürkiye…</main>}><CityGuide city={city} language={language} onBack={back}/></Suspense>;
  if(match && remote?.path!==path)return <main className="p-8" aria-busy="true">SafeInTürkiye…</main>;
  if(path!=='/'&&!entry)return <main className="max-w-xl mx-auto p-8 space-y-4"><h1 className="text-xl font-bold">{language==='tr'?'İçerik şu anda görüntülenemiyor':'This page is currently unavailable'}</h1><p>{language==='tr'?'Kayıt yayından kaldırılmış veya bağlantı geçici olarak kesilmiş olabilir.':'The entry may no longer be published, or the connection may be temporarily unavailable.'}</p><button className="text-blue-700 underline" onClick={back}>{language==='tr'?'Ana sayfaya dön':'Back to home'}</button></main>;
  return entry ? <Suspense fallback={<main className="p-8" aria-busy="true">SafeInTürkiye…</main>}><DirectoryDetail key={entry.id} entry={entry} lang={language} onBack={back}/></Suspense> : <App/>;
}
