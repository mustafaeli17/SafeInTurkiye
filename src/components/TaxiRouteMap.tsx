import {useEffect,useRef,useState} from 'react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {taxiMapKey} from '../lib/mapEnvironment';

type Point={lat:number;lng:number};
export default function TaxiRouteMap({originCoords,destCoords,geometry,color='#087FFF',title='Map'}:{originCoords:Point|null;destCoords:Point|null;geometry:Point[]|null;color?:string;title?:string}) {
 const host=useRef<HTMLDivElement>(null);
 const [failed,setFailed]=useState(false);
 const key=taxiMapKey(window.location.hostname,import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY,import.meta.env.VITE_GOOGLE_MAPS_PREVIEW_BROWSER_KEY);
 useEffect(()=>{
  if(key)return;
  let cancelled=false,map:Leaflet.Map|undefined;
  setFailed(false);
  void import('leaflet').then(L=>{
   if(cancelled||!host.current)return;
   map=L.map(host.current).setView([39,35],5);
   const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
   tiles.on('tileerror',()=>{if(!cancelled)setFailed(true);});
   tiles.on('tileload',()=>{if(!cancelled)setFailed(false);});
   const bounds:Leaflet.LatLngExpression[]=[];
   for(const [point,markerColor]of [[originCoords,'#087FFF'],[destCoords,'#EF4444']] as const){
    if(!point)continue;
    L.circleMarker([point.lat,point.lng],{radius:8,color:'#ffffff',weight:3,fillColor:markerColor,fillOpacity:1}).addTo(map);
    bounds.push([point.lat,point.lng]);
   }
   if(geometry?.length)L.polyline(geometry.map(p=>[p.lat,p.lng] as [number,number]),{color,weight:5,opacity:0.85}).addTo(map);
   if(bounds.length)map.fitBounds(L.latLngBounds(bounds),{padding:[40,40],maxZoom:15});
  }).catch(()=>{if(!cancelled)setFailed(true);});
  return()=>{cancelled=true;map?.remove();};
 },[key,originCoords,destCoords,geometry,color]);
 const point=originCoords||destCoords;
 const external=new URL('https://www.google.com/maps/dir/');
 external.searchParams.set('api','1');
 if(originCoords)external.searchParams.set('origin',`${originCoords.lat},${originCoords.lng}`);
 if(destCoords)external.searchParams.set('destination',`${destCoords.lat},${destCoords.lng}`);
 external.searchParams.set('travelmode','driving');
 const params=new URLSearchParams({key:key??'',language:document.documentElement.lang||'en',region:'TR'});
 const mode=originCoords&&destCoords?'directions':point?'place':'view';
 if(originCoords&&destCoords){params.set('origin',`${originCoords.lat},${originCoords.lng}`);params.set('destination',`${destCoords.lat},${destCoords.lng}`);params.set('mode','driving');}
 else if(point)params.set('q',`${point.lat},${point.lng}`);
 else{params.set('center','39,35');params.set('zoom','5');}
 return <div className="relative w-full min-h-[360px] overflow-hidden rounded-2xl border border-sky-100 bg-slate-100 shadow-sm">
  {key?<iframe title={title} src={`https://www.google.com/maps/embed/v1/${mode}?${params}`} className="w-full h-full min-h-[360px] sm:min-h-[480px]" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>:<div ref={host} role="region" aria-label={title} className="h-[360px] w-full sm:h-[480px]"/>}
  {failed&&destCoords&&<a href={external.href} target="_blank" rel="noopener noreferrer" aria-label={title} className="absolute bottom-8 left-3 z-[1000] rounded-xl bg-white p-3 text-sm font-semibold text-blue-700 shadow">Google Maps ↗</a>}
 </div>;
}
