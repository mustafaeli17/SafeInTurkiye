import cities from '../data/cityGuides.json';
import { saveLanguagePreference } from './languagePreference';
import { normalizeSearch } from './catalog';
import {navigateTo} from './browserNavigation';
const aliases:Record<string,string[]>={gaziantep:['Antep'],mugla:['Bodrum'],aydin:['Kuşadası','Didim'],denizli:['Pamukkale','Hierapolis'],trabzon:['Sümela','Uzungöl'],konya:[],bursa:['Uludağ']};
export function findCityGuide(query:string){
 const normalized=normalizeSearch(query.trim());
 return cities.find(city=>[city.name,city.slug,...(aliases[city.slug]??[])].some(alias=>normalizeSearch(alias)===normalized));
}
export function openCityGuide(slug:string,language:string){
 if(!cities.some(city=>city.slug===slug))return;
 saveLanguagePreference(language);
 navigateTo(`/cities/${slug}`);
}
