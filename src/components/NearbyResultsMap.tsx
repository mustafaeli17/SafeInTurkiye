import {useEffect,useRef,useState} from 'react'
import GooglePlacePhoto from './GooglePlacePhoto'
import EditorialPlacePhoto from './EditorialPlacePhoto'
import {isEditorialPlace} from '../lib/editorialDiscovery'
import {loadMaps} from '../lib/loadGoogleMaps'
import type {NearbyPlaceRecord} from '../services/nearbyPlaces'
export default function NearbyResultsMap({places,onOpen,title,errorText,lang,onExpired}:{lang:string;onExpired:()=>void;places:NearbyPlaceRecord[];onOpen:(id:string)=>void;title:string;errorText:string}){
 const host=useRef<HTMLDivElement>(null),callback=useRef(onOpen)
 useEffect(()=>{callback.current=onOpen},[onOpen])
 const [failed,setFailed]=useState(false)
 const [selectedId,setSelectedId]=useState<string|null>(null)
 const selected=places.find(place=>place.id===selectedId)??places[0]
 useEffect(()=>{
  let cancelled=false;const overlays:any[]=[]
  const auth=()=>setFailed(true);window.addEventListener('transit-map-auth-error',auth);setFailed(false)
  loadMaps().then(maps=>{
   if(cancelled||!host.current||!places.length)return
   const map=new maps.Map(host.current,{center:places[0].coordinates,zoom:14,mapTypeControl:false,streetViewControl:false,fullscreenControl:true,gestureHandling:'cooperative'})
   const bounds=new maps.LatLngBounds();
   class PlacePin extends maps.OverlayView {
    element:HTMLButtonElement
    place:NearbyPlaceRecord
    constructor(place:NearbyPlaceRecord){super();this.place=place;this.element=document.createElement('button');this.element.className='nearby-map-label';this.element.textContent=place.name??title;this.element.addEventListener('click',()=>setSelectedId(place.id));this.setMap(map)}
    onAdd(){this.getPanes().floatPane.appendChild(this.element);maps.OverlayView.preventMapHitsAndGesturesFrom(this.element)}
    draw(){const point=this.getProjection().fromLatLngToDivPixel(new maps.LatLng(this.place.coordinates.lat,this.place.coordinates.lng));this.element.style.position='absolute';this.element.style.left=point.x+'px';this.element.style.top=point.y+'px'}
    onRemove(){this.element.remove()}
   }
   places.forEach(place=>{bounds.extend(place.coordinates);overlays.push(new PlacePin(place))});map.fitBounds(bounds,{top:65,right:80,bottom:190,left:80});maps.event.addListenerOnce(map,'idle',()=>{if(map.getZoom()>16)map.setZoom(16)})
  }).catch(()=>{if(!cancelled)setFailed(true)})
  return()=>{cancelled=true;window.removeEventListener('transit-map-auth-error',auth);overlays.forEach(item=>item.setMap(null))}
 },[places,title])
 return failed?<p role="status" className="nearby-map-error">{errorText}</p>:<div className="nearby-map-wrap"><div ref={host} role="region" aria-label={title} className="nearby-results-map"/>{selected&&<div className="nearby-map-selection"><div>{isEditorialPlace(selected)?<EditorialPlacePhoto place={selected} expanded={false} lang={lang} onOpen={()=>callback.current(selected.id)}/>:<GooglePlacePhoto key={selected.id} place={selected} onExpired={onExpired} onOpen={()=>callback.current(selected.id)}/>}</div><button className="nearby-map-selection-name" onClick={()=>callback.current(selected.id)}>{selected.name??title}<span aria-hidden="true"> →</span></button></div>}</div>
}
