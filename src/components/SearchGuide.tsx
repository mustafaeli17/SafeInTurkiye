import {searchPage} from '../lib/searchPages';
import {localizePath} from '../lib/searchLocales';
import {informationUi} from '../lib/informationUi';
import {practicalFaq,practicalSources,practicalVerifiedAt} from '../data/practicalFaq';
import {siteOperatorName,supportEmail} from '../lib/siteOperator';
import {searchIntentGuides} from '../data/searchIntentGuides';
import type {SearchLanguage} from '../lib/searchLocales';

const disclosureClass='group rounded-2xl border border-sky-100 bg-white';
const summaryClass='flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-4 py-3 font-semibold text-slate-800 transition-colors hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 [&::-webkit-details-marker]:hidden';
function Chevron(){return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 shrink-0 text-blue-500 transition-transform group-open:rotate-180 motion-reduce:transition-none"><path d="m6 9 6 6 6-6"/></svg>;}
/** Shared content keeps the initial HTML and the interactive guide consistent. */
export function SearchGuide({path,lang,standalone=false}:{path:string;lang:string;standalone?:boolean}){
 const page=searchPage(path,lang);
 const ui=informationUi[lang]??informationUi.en;
 const toolAnswers=searchIntentGuides[lang as SearchLanguage]??searchIntentGuides.en;
 const answer=page.section?toolAnswers[page.section as keyof typeof toolAnswers]:undefined;
 const content=<div className="space-y-4 text-sm leading-7 text-slate-600">
  <p className="max-w-3xl">{page.paragraphs[0]}</p>
  {page.paragraphs.length>1&&<details className={disclosureClass}><summary className={summaryClass}>{ui[5]}<Chevron/></summary><div className="space-y-3 px-4 pb-4">{page.paragraphs.slice(1).map(p=><p key={p}>{p}</p>)}</div></details>}
  {answer&&<details className={disclosureClass}><summary className={summaryClass}><span>{answer[0]}</span><Chevron/></summary><p className="px-4 pb-4">{answer[1]}</p></details>}
  {page.highlights.length>0&&<ul className="grid gap-3 sm:grid-cols-2">{page.highlights.map(h=><li key={h.name} className="rounded-2xl border border-sky-100 bg-white p-4"><strong className="text-slate-800">{h.name}</strong>{h.detail&&<p className="mt-1">{h.detail}</p>}</li>)}</ul>}
  {page.source&&<a className="inline-flex min-h-11 items-center text-blue-700 underline underline-offset-4" href={page.source} rel="noopener noreferrer">GoTürkiye ↗</a>}
  {(page.section==='safety'||page.section==='assistant')&&<>
   {(practicalFaq[lang]??practicalFaq.en).map(([q,a])=><details key={q} className={disclosureClass}><summary className={summaryClass}><span>{q}</span><Chevron/></summary><p className="px-4 pb-4">{a}</p></details>)}
   <p><time dateTime={practicalVerifiedAt}>{practicalVerifiedAt}</time> · {practicalSources.map((url,i)=><a key={url} className="underline me-3" href={url} rel="noopener noreferrer">{i===0?'FCDO':'AFAD'}</a>)}</p>
  </>}
  {page.info&&<p className="break-words">{siteOperatorName} · <a href={'mailto:'+supportEmail}>{supportEmail}</a></p>}
  <details className={disclosureClass}>
   <summary className={summaryClass}><span>{ui[3]}</span><Chevron/></summary>
   <nav aria-label={ui[3]} className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">{page.links.map(link=><a key={link.href} className="flex min-h-11 items-center rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2 font-medium text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500" href={link.href}>{link.label}</a>)}</nav>
  </details>
 </div>;
 if(!standalone)return answer?<div dir={lang==='ar'?'rtl':'ltr'} className="my-4 w-full"><details className={disclosureClass}><summary className={summaryClass}><span className="text-sm">{answer[0]}</span><Chevron/></summary><p className="px-4 pb-4 text-sm leading-7 text-slate-600">{answer[1]}</p></details></div>:null;
 return <main dir={lang==='ar'?'rtl':'ltr'} className="max-w-5xl mx-auto p-6 space-y-6"><a href={localizePath('/',lang)}>SafeInTürkiye</a><h1 className="text-3xl font-bold">{page.title.split(' | ')[0]}</h1>{content}</main>;
}
