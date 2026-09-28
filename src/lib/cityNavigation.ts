import cities from '../data/cityGuides.json';
import { normalizeSearch } from './catalog';
const aliases:Record<string,string[]>={mugla:['Bodrum'],aydin:['Kuşadası','Didim'],denizli:['Pamukkale','Hierapolis'],trabzon:['Sümela','Uzungöl'],konya:[],bursa:['Uludağ']};
export function findCityGuide(query:string){
 const normalized=normalizeSearch(query.trim());
 return cities.find(city=>[city.name,city.slug,...(aliases[city.slug]??[])].some(alias=>normalizeSearch(alias)===normalized));
}
export function openCityGuide(slug:string,language:string){
 if(!cities.some(city=>city.slug===slug))return;
 localStorage.setItem('safeinturkiye-language',language);
 window.history.pushState({},'',`/cities/${slug}`);
 window.dispatchEvent(new PopStateEvent('popstate'));
 window.scrollTo(0,0);
}
