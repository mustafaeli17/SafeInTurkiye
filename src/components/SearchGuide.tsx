import {searchPage} from '../lib/searchPages';
import {localizePath} from '../lib/searchLocales';
import {informationUi} from '../lib/informationUi';
import {practicalFaq,practicalSources,practicalVerifiedAt} from '../data/practicalFaq';
import {siteOperatorName,supportEmail} from '../lib/siteOperator';
/** This content is rendered for users as well as in the initial HTML. */
export function SearchGuide({path,lang,standalone=false}:{path:string;lang:string;standalone?:boolean}){
 const page=searchPage(path,lang);
 const content=<div className="space-y-4">
  {page.paragraphs.map((p,i)=><p key={i}>{p}</p>)}
  {page.highlights.length>0&&<ul className="space-y-3">{page.highlights.map(h=><li key={h.name}><strong>{h.name}</strong>{h.detail&&<p>{h.detail}</p>}</li>)}</ul>}
  {page.source&&<a className="underline" href={page.source} rel="noopener noreferrer">GoTürkiye ↗</a>}
  {(page.section==='safety'||page.section==='assistant')&&<>
   {(practicalFaq[lang]??practicalFaq.en).map(([q,a])=><details key={q}><summary className="cursor-pointer font-semibold py-2">{q}</summary><p>{a}</p></details>)}
   <p><time dateTime={practicalVerifiedAt}>{practicalVerifiedAt}</time> · {practicalSources.map((url,i)=><a key={url} className="underline me-3" href={url} rel="noopener noreferrer">{i===0?'FCDO':'AFAD'}</a>)}</p>
  </>}
  {page.info&&<p>{siteOperatorName} · <a href={'mailto:'+supportEmail}>{supportEmail}</a></p>}
  <nav aria-label={(informationUi[lang]??informationUi.en)[3]} className="flex flex-wrap gap-x-4 gap-y-3">{page.links.map(link=><a key={link.href} className="text-blue-700 underline" href={link.href}>{link.label}</a>)}</nav>
 </div>;
 return standalone?<main dir={lang==='ar'?'rtl':'ltr'} className="max-w-5xl mx-auto p-6 space-y-6"><a href={localizePath('/',lang)}>SafeInTürkiye</a><h1 className="text-3xl font-bold">{page.title.split(' | ')[0]}</h1>{content}</main>:
 <details className="max-w-6xl mx-auto my-6 px-6 text-sm text-slate-600"><summary className="cursor-pointer py-3 font-semibold">{page.heading}</summary>{content}</details>;
}
