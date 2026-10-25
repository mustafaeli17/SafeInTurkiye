import {useEffect,useState} from 'react';
import {siteInformation} from '../lib/siteInformation';
import {privacyCopy} from '../lib/privacyCopy';
import {readLanguagePreference,saveLanguagePreference} from '../lib/languagePreference';
const pages=['privacy','terms','about','contact'] as const;
export default function SiteInformation({page}:{page:typeof pages[number]}){
 const [lang,setLang]=useState(readLanguagePreference());const original=siteInformation[lang]??siteInformation.en;const t={...original,privacy:privacyCopy[lang]??privacyCopy.en};
 useEffect(()=>{document.title=t.labels[pages.indexOf(page)]+' | SafeInTürkiye';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';saveLanguagePreference(lang);},[lang,t,page]);
 return <main className="max-w-3xl mx-auto px-5 py-8 space-y-6"><a href="/" className="font-bold text-blue-700">SafeInTürkiye</a><select aria-label="Language" value={lang} onChange={e=>setLang(e.target.value)} className="border rounded-xl p-3 mx-4">{Object.keys(siteInformation).map(l=><option key={l}>{l}</option>)}</select><nav className="flex flex-wrap gap-4">{pages.map((p,i)=><a key={p} href={'/'+p} className="underline text-blue-700">{t.labels[i]}</a>)}</nav><h1 className="text-2xl font-bold">{t.labels[pages.indexOf(page)]}</h1><p className="leading-relaxed text-slate-700">{t[page]}</p>{page==='privacy'&&<a className="underline text-blue-700" href="/contact">{t.labels[3]}</a>}</main>
}
