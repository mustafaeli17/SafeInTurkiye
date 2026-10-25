import retired from '../data/retiredDirectory.json';
import {publicCities} from './publicRoutes';
const paths=new Map(retired.map(entry=>[`/${entry.kind}/${entry.slug}`,entry]));
export function isRetiredDirectoryEntry(kind:string,slug:unknown){return typeof slug==='string'&&paths.has(`/${kind}/${slug}`);}
export function retiredDirectoryDestination(path:string){
 const entry=paths.get(path.replace(/^\/tr\//,'/').replace(/\/$/,''));
 if(!entry)return undefined;
 const city=publicCities.find(city=>'city' in entry&&city.name===entry.city)?.slug;
 return `/${entry.kind}${city?'?city='+city:''}`;
}
