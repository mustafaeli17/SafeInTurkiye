import {citiesDetailedData} from '../data/originalCityDetails';
import routes from '../data/sectionRoutes.json';
import originalsTr from '../data/citiesTr.json';
import originalsEs from '../data/citiesEs.json';
import originalsZh from '../data/citiesZh.json';
import regional from '../data/cityGuides.json';
import {publicCities} from './publicRoutes';
import {cityLocale,cityDisplayName} from './cityLocale';
import {regionalDescription} from './regionalDescription';
import {sectionSeo} from './seo';
import {searchCopy} from '../data/searchCopy';
import {localizePath} from './searchLocales';
import {siteInformation} from './siteInformation';
import {activeReservationPrivacy,activeReservationContact} from './activeReservationPolicy';
import {privacyDetails} from './privacyDetails';
import {restaurantRequestsEnabled} from './reservationAvailability';

export const informationPages=['privacy','terms','about','contact'] as const;
export const searchPagePaths=['/',...Object.values(routes).map(r=>r.path),...publicCities.map(c=>'/cities/'+c.slug),...informationPages.map(p=>'/'+p)];
export function searchPageSchema(path:string,lang:string){
 const origin='https://www.safeinturkiye.com',url=origin+localizePath(path,lang),meta=searchPage(path,lang);
 return path==='/'?{'@context':'https://schema.org','@graph':[
  {'@type':'WebSite',name:'SafeInTürkiye',url,inLanguage:lang},
  {'@type':'Organization',name:'SafeInTürkiye',url:origin+'/'}
 ]}:{'@context':'https://schema.org','@type':meta.city?'TouristDestination':'WebPage',name:meta.title,url,description:meta.description,inLanguage:lang};
}
export function searchPage(path:string,lang:string){
 const copy=searchCopy[lang]??searchCopy.en;
 const city=publicCities.find(c=>'/cities/'+c.slug===path);
 const section=Object.entries(routes).find(([,r])=>r.path===path)?.[0];
 const info=informationPages.find(p=>'/'+p===path);
 let highlights:{name:string;detail:string}[]=[];
 let source:string|undefined;
 let meta=sectionSeo(city?'city':section??'home',city?.name??'',lang);
 if(city){
  const reg=regional.find(c=>c.slug===city.slug);
  const original=(lang==='tr'?originalsTr:lang==='es'?originalsEs:lang==='zh'?originalsZh:null);
  const translated=original?.[city.name as keyof typeof originalsTr];
  highlights=reg?reg.places.map(name=>({name,detail:''})):translated?.highlights??cityLocale(city.name,lang).highlights??citiesDetailedData[city.name]?.highlights??[];
  source=reg?.source;
  const description=reg?regionalDescription(reg,lang):translated?.tagline??cityLocale(city.name,lang).tagline??city.description.en;
  meta={title:`${cityDisplayName(city.name,lang)} ${copy.city} | SafeInTürkiye`,description};
 }
 if(info){
  const t=siteInformation[lang]??siteInformation.en;
  const text=info==='privacy'?(activeReservationPrivacy[lang]??activeReservationPrivacy.en):info==='contact'&&restaurantRequestsEnabled?(activeReservationContact[lang]??activeReservationContact.en):t[info];
  meta={title:t.labels[informationPages.indexOf(info)]+' | SafeInTürkiye',description:text};
 }
 const paragraphs=[meta.description];
 if(info==='privacy')paragraphs.push(privacyDetails[lang]??privacyDetails.en);
 const links=city?Object.entries(routes).map(([key,r])=>({href:localizePath(r.path,lang)+'?city='+city.slug,label:sectionSeo(key,city.name,lang).title.split(' | ')[0]})):
  [...publicCities.map(c=>({href:localizePath('/cities/'+c.slug,lang),label:cityDisplayName(c.name,lang)})),...Object.entries(routes).filter(([key])=>key!==section).map(([key,r])=>({href:localizePath(r.path,lang),label:sectionSeo(key,'',lang).title.split(' | ')[0]}))];
 return {...meta,paragraphs,links,city,section,info,highlights,source,heading:copy.guide};
}

