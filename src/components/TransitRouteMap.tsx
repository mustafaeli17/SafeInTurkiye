import { useEffect, useRef, useState } from 'react'
import { decodeTransitPolyline } from '../lib/transit'

import {loadMaps} from '../lib/loadGoogleMaps'
export default function TransitRouteMap({encoded,title,fallback}:{encoded:string;title:string;fallback?:React.ReactNode}) {
  const host = useRef<HTMLDivElement>(null)
  const [failed,setFailed]=useState(false)
  useEffect(()=>{
    let cancelled=false
    const overlays:any[]=[]
    const onAuthError=()=>setFailed(true)
    window.addEventListener('transit-map-auth-error',onAuthError)
    setFailed(false)
    const path=decodeTransitPolyline(encoded)
    if(path.length<2){setFailed(true);return()=>window.removeEventListener('transit-map-auth-error',onAuthError)}
    loadMaps().then(maps=>{
      if(cancelled||!host.current)return
      const map=new maps.Map(host.current,{center:path[0],zoom:12,mapTypeControl:false,streetViewControl:false,fullscreenControl:true,gestureHandling:'cooperative'})
      const line=new maps.Polyline({map,path,strokeColor:'#087FFF',strokeWeight:5,strokeOpacity:0.9})
      overlays.push(line)
      const bounds=new maps.LatLngBounds()
      path.forEach(point=>bounds.extend(point)); map.fitBounds(bounds,35)
      for(const [i,point]of [path[0],path[path.length-1]].entries())overlays.push(new maps.Circle({map,center:point,radius:45,fillColor:i?'#e11d48':'#16a34a',fillOpacity:1,strokeColor:'#fff',strokeWeight:2}))
    }).catch(()=>{if(!cancelled)setFailed(true)})
    return()=>{cancelled=true;window.removeEventListener('transit-map-auth-error',onAuthError);overlays.forEach(item=>item.setMap(null))}
  },[encoded])
  if(failed)return <>{fallback}</>
  return <div role="region" aria-label={title} ref={host} className="h-[340px] w-full overflow-hidden rounded-2xl border border-sky-100 bg-slate-100 sm:h-[430px]"/>
}
