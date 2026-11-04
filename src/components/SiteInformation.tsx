import {localizePath,parseLocalePath} from '../lib/searchLocales';
import {navigateTo,useBrowserLocation} from '../lib/browserNavigation';
import {searchPage,searchPageSchema} from '../lib/searchPages';
import {updateSearchHead} from '../lib/seo';
import {useEffect} from 'react';
import {ArrowLeft,ArrowUpRight,BookOpen,Globe2,Info,Mail,Phone,ShieldCheck,UserRound} from 'lucide-react';
import {siteInformation} from '../lib/siteInformation';
import {restaurantRequestsEnabled} from '../lib/reservationAvailability';
import {activeReservationPrivacy,activeReservationContact} from '../lib/activeReservationPolicy';
import {privacyDetails,privacyProviders} from '../lib/privacyDetails';
import {operatorLabel,siteOperatorName,supportEmail} from '../lib/siteOperator';
import {informationUi,informationLanguages} from '../lib/informationUi';
import {saveLanguagePreference} from '../lib/languagePreference';
import './SiteInformation.css';
const pages=['privacy','terms','about','contact'] as const;
const icons=[ShieldCheck,BookOpen,Info,Mail];
export default function SiteInformation({page,initialLanguage}:{page:typeof pages[number];initialLanguage?:string}){
 const location=useBrowserLocation();
 const lang=initialLanguage??parseLocalePath(location).lang;
 const setLang=(next:string)=>navigateTo(location+window.location.hash,{language:next,scroll:false,state:window.history.state??{}});
 const original=siteInformation[lang]??siteInformation.en;
 // Disabling new intake does not change how existing reservation data is handled.
 const t={...original,privacy:activeReservationPrivacy[lang]??activeReservationPrivacy.en,contact:restaurantRequestsEnabled?(activeReservationContact[lang]??activeReservationContact.en):original.contact};
 const ui=informationUi[lang]??informationUi.en;
 const active=pages.indexOf(page),Icon=icons[active];
 useEffect(()=>{const meta=searchPage('/'+page,lang);updateSearchHead('/'+page,lang,meta.title,meta.description,searchPageSchema('/'+page,lang));document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';saveLanguagePreference(lang);},[lang,active,t,page]);
 return <div className="information-shell" dir={lang==='ar'?'rtl':'ltr'}>
  <header className="information-header">
   <a href={localizePath('/',lang)} aria-label="SafeInTürkiye"><img src="/brand-logo.webp" alt="SafeInTürkiye" width="180" height="60"/></a>
   <label className="information-language"><Globe2 size={17} aria-hidden="true"/><span className="sr-only">{ui[4]}</span><select value={lang} onChange={e=>setLang(e.target.value)}>{Object.entries(informationLanguages).map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label>
  </header>
  <main className="information-main">
   <a href={localizePath('/',lang)} className="information-back"><ArrowLeft size={17} aria-hidden="true"/>{ui[0]}</a>
   <section className="information-hero" aria-labelledby="information-title">
    <span className="information-hero-icon"><Icon size={29} strokeWidth={1.7} aria-hidden="true"/></span>
    <div><p className="information-eyebrow">{ui[1]}</p><h1 id="information-title">{t.labels[active]}</h1><p className="information-intro">{ui[2]}</p></div>
   </section>
   <div className="information-layout">
    <nav className="information-nav" aria-label={ui[3]}><p>{ui[3]}</p>{pages.map((item,i)=>{const NavIcon=icons[i];return <a key={item} href={localizePath('/'+item,lang)} aria-current={page===item?'page':undefined}><NavIcon size={19} aria-hidden="true"/><span>{t.labels[i]}</span><ArrowUpRight size={15} className="information-nav-arrow" aria-hidden="true"/></a>;})}</nav>
    <div className="information-content">
     <article className="information-panel"><h2>{ui[5]}</h2><p className="information-copy">{t[page]}</p><div className="information-operator"><UserRound size={19} aria-hidden="true"/><div><span>{operatorLabel[lang]??operatorLabel.en}</span><p>{siteOperatorName}</p></div></div></article>
     {page==='privacy'&&<section className="information-panel"><p className="information-copy">{privacyDetails[lang]??privacyDetails.en}</p><ul>{privacyProviders.map(([name,url])=><li key={name}><a href={url} target="_blank" rel="noopener noreferrer" className="underline">{name}</a></li>)}</ul></section>}
     <section className="information-contact-panel" aria-labelledby="information-email"><span className="information-mail-icon"><Mail size={23} aria-hidden="true"/></span><div><h2 id="information-email">{ui[6]}</h2><p>{ui[7]}</p><a href={`mailto:${supportEmail}`} dir="ltr">{supportEmail}<ArrowUpRight size={17} aria-hidden="true"/></a></div></section>
     {page==='contact'&&<aside className="information-emergency"><Phone size={19} aria-hidden="true"/><div><a href="tel:112">{ui[8]}</a><p>{ui[9]}</p></div></aside>}
    </div>
   </div>
  </main>
  <footer className="information-footer"><a href={localizePath('/',lang)}>SafeInTürkiye</a><span>{ui[1]}</span></footer>
 </div>;
}
