import {useSyncExternalStore} from 'react';

const navigationEvent='safeinturkiye:navigate';
const currentLocation=()=>window.location.pathname+window.location.search;
function subscribe(listener:()=>void){
 window.addEventListener('popstate',listener);
 window.addEventListener(navigationEvent,listener);
 return()=>{window.removeEventListener('popstate',listener);window.removeEventListener(navigationEvent,listener);};
}
export function useBrowserLocation(){return useSyncExternalStore(subscribe,currentLocation,()=>'/');}

/** One history entry per user navigation. Rendering must never rewrite history. */
export function navigateTo(path:string,{replace=false,scroll=true,state={}}:{replace?:boolean;scroll?:boolean;state?:Record<string,unknown>}={}){
 const url=new URL(path,window.location.origin);
 if(url.origin!==window.location.origin)return;
 const target=url.pathname+url.search+url.hash;
 if(target===currentLocation()+window.location.hash)return;
 window.history[replace?'replaceState':'pushState']({...state},'',target);
 window.dispatchEvent(new Event(navigationEvent));
 if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
export function updateLocationQuery(values:Record<string,string|null>,options:{replace?:boolean;state?:Record<string,unknown>}={}){
 const url=new URL(window.location.href);
 for(const [key,value] of Object.entries(values)){if(value===null)url.searchParams.delete(key);else url.searchParams.set(key,value);}
 navigateTo(url.pathname+url.search,{...options,scroll:false});
}
