import cities from '../data/cityGuides.json';
import { saveLanguagePreference } from './languagePreference';
import { normalizeSearch } from './catalog';
import {navigateTo} from './browserNavigation';
import {searchCities as aliases} from '../services/searchCities';
export function findCityGuide(query:string){
 const normalized=normalizeSearch(query.trim());
 return cities.find(city=>[city.name,city.slug,...(aliases[city.slug]??[])].some(alias=>normalizeSearch(alias)===normalized));
}
export function openCityGuide(slug:string,language:string){
 if(!cities.some(city=>city.slug===slug))return;
 saveLanguagePreference(language);
 navigateTo(`/cities/${slug}`);
}
