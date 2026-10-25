import {searchDestinations} from './searchDestinations';
export function destinationSlug(name:string){return name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function discoveryCity(query:string,fallback:string){
 const value=new URLSearchParams(query).get('city');
 return Object.keys(searchDestinations).find(name=>destinationSlug(name)===value)??(fallback.startsWith('Cappadocia')?'Cappadocia':fallback);
}
