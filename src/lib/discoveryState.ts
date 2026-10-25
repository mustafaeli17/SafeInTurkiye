import {isValidCenter} from '../services/nearbyPlaces';
export type DiscoveryArea={label:string;lat:number;lng:number};
const scope=()=>window.location.pathname+'?city='+(new URLSearchParams(window.location.search).get('city')??'');
// Tab history only: no URL, analytics, localStorage or server persistence of addresses.
export function readDiscoveryArea(now=Date.now()):DiscoveryArea|null{
 if(typeof window==='undefined')return null;
 const row=window.history.state?.discoveryArea;
 if(!row||row.scope!==scope()||!Number.isFinite(row.until)||row.until<=now||row.until>now+30*60000||!isValidCenter(row.place)||typeof row.place.label!=='string'||!row.place.label.trim()||row.place.label.length>1000)return null;
 return row.place;
}
export function saveDiscoveryArea(place:DiscoveryArea|null,now=Date.now()){
 window.history.replaceState({...window.history.state,discoveryArea:place?{scope:scope(),until:now+30*60000,place}:null},'',window.location.href);
}
