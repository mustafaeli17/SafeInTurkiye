import {searchDestinations} from './searchDestinations';
import {localizePath} from './searchLocales';
const regions:Record<string,string>={kusadasi:'aydin',didim:'aydin',bodrum:'mugla',pamukkale:'denizli',cesme:'izmir',alacati:'izmir'};
export function destinationRegion(slug:string){return regions[slug]??slug;}
export function discoverySwitchHref(page:'activities'|'tours',lang:string,city:string|undefined,term:string){
 const params=new URLSearchParams();
 if(city)params.set('city',page==='tours'?destinationRegion(city):city);
 const query=term.trim().slice(0,160);
 if(query){params.set('q',query);if(page==='activities')params.set('lookup','1');}
 return localizePath('/'+page+(params.size?'?'+params:''),lang);
}
export function destinationSlug(name:string){return name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function discoveryCity(query:string,fallback:string){
 const value=new URLSearchParams(query).get('city');
 return Object.keys(searchDestinations).find(name=>destinationSlug(name)===value)??(fallback.startsWith('Cappadocia')?'Cappadocia':fallback);
}
