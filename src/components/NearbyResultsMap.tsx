import {useEffect,useRef,useState} from 'react'
import GooglePlacePhoto from './GooglePlacePhoto'
import EditorialPlacePhoto from './EditorialPlacePhoto'
import {isEditorialPlace} from '../lib/editorialDiscovery'
import {loadMaps} from '../lib/loadGoogleMaps'
import type {NearbyPlaceRecord} from '../services/nearbyPlaces'
export default function NearbyResultsMap({places,onOpen,title,errorText,lang,onExpired,activeId,onPick}:{activeId?:string|null;onPick?:(id:string)=>void;lang:string;onExpired:()=>void;places:NearbyPlaceRecord[];onOpen:(id:string)=>void;title:string;errorText:string}){
 const host=useRef<HTMLDivElement>(null),callback=useRef(onOpen)
 useEffect(()=>{callback.current=onOpen},[onOpen])
 const [failed,setFailed]=useState(false)
 const [selectedId,setSelectedId]=useState<string|null>(null)
 const pinNodes=useRef(new Map<string,HTMLButtonElement>())
 const selected=places.find(place=>place.id===(activeId??selectedId))??places[0]
 const selectedKey=selected?.id
 const activePin=useRef(selectedKey)
 useEffect(()=>{activePin.current=selectedKey;for(const [id,node] of pinNodes.current)node.setAttribute('aria-pressed',String(id===selectedKey))},[selectedKey])
 useEffect(()=>{
  let cancelled=false;const overlays:any[]=[]
  const auth=()=>setFailed(true);window.addEventListener('transit-map-auth-error',auth);setFailed(false)
  loadMaps().then(maps=>{
   if(cancelled||!host.current||!places.length)return
   const map=new maps.Map(host.current,{center:places[0].coordinates,zoom:14,mapTypeControl:false,streetViewControl:false,fullscreenControl:true,gestureHandling:'cooperative'})
   const bounds=new maps.LatLngBounds();
   class PlacePin extends maps.OverlayView {
    element:HTMLButtonElement
    stem=document.createElement('div')
    place:NearbyPlaceRecord
    constructor(place:NearbyPlaceRecord){super();this.place=place;this.element=document.createElement('button');this.element.className='nearby-map-label';this.element.textContent=place.name??title;pinNodes.current.set(place.id,this.element);this.element.setAttribute('aria-pressed',String(activePin.current===place.id));this.element.addEventListener('click',()=>{setSelectedId(place.id);onPick?.(place.id)});this.setMap(map)}
    onAdd(){this.getPanes().floatPane.append(this.stem,this.element);this.stem.style.cssText='position:absolute;width:1px;background:#087fff;pointer-events:none';maps.OverlayView.preventMapHitsAndGesturesFrom(this.element)}
    draw(){
     const projection=this.getProjection(),center=projection.fromLatLngToDivPixel(map.getCenter());
     const width=host.current?.clientWidth??400,height=host.current?.clientHeight??610;
     const minX=center.x-width/2+8,maxX=center.x+width/2-118,minY=center.y-height/2+8,maxY=center.y+height/2-210;
     const placed:{x:number;y:number}[]=[];let target={x:0,y:0};
     for(const place of places){
      const anchor=projection.fromLatLngToDivPixel(new maps.LatLng(place.coordinates.lat,place.coordinates.lng));
      const options:{x:number;y:number;cost:number}[]=[];
      for(let row=-5;row<=5;row++)for(let col=-3;col<=3;col++){
       const x=Math.max(minX,Math.min(maxX,anchor.x-55+col*118)),y=Math.max(minY,Math.min(maxY,anchor.y-60+row*68));
       options.push({x,y,cost:Math.hypot(x+55-anchor.x,y+60-anchor.y)});
      }
      options.sort((a,b)=>a.cost-b.cost);
      target=options.find(o=>!placed.some(p=>o.x<p.x+116&&o.x+116>p.x&&o.y<p.y+66&&o.y+66>p.y))??options[0];
      placed.push(target);if(place.id===this.place.id)break;
     }
     const point=projection.fromLatLngToDivPixel(new maps.LatLng(this.place.coordinates.lat,this.place.coordinates.lng));
     const x=target.x+55,y=target.y+60,dx=x-point.x,dy=y-point.y;
     Object.assign(this.element.style,{position:'absolute',left:x+'px',top:y+'px'});
     Object.assign(this.stem.style,{left:point.x+'px',top:point.y+'px',width:Math.hypot(dx,dy)+'px',height:'1px',transformOrigin:'0 0',transform:`rotate(${Math.atan2(dy,dx)}rad)`});
    }
    onRemove(){pinNodes.current.delete(this.place.id);this.element.remove();this.stem.remove()}
   }
   places.forEach(place=>{bounds.extend(place.coordinates);overlays.push(new PlacePin(place))});map.fitBounds(bounds,{top:65,right:80,bottom:190,left:80});maps.event.addListenerOnce(map,'idle',()=>{if(map.getZoom()>16)map.setZoom(16)})
  }).catch(()=>{if(!cancelled)setFailed(true)})
  return()=>{cancelled=true;window.removeEventListener('transit-map-auth-error',auth);overlays.forEach(item=>item.setMap(null))}
 },[places,title,onPick])
 return failed?<p role="status" className="nearby-map-error">{errorText}</p>:<div className="nearby-map-wrap"><div ref={host} role="region" aria-label={title} className="nearby-results-map"/>{selected&&<div className="nearby-map-selection"><div>{isEditorialPlace(selected)?<EditorialPlacePhoto place={selected} expanded={false} lang={lang} onOpen={()=>callback.current(selected.id)}/>:<GooglePlacePhoto key={selected.id} place={selected} onExpired={onExpired} onOpen={()=>callback.current(selected.id)}/>}</div><button className="nearby-map-selection-name" onClick={()=>callback.current(selected.id)}>{selected.name??title}<span aria-hidden="true"> →</span></button></div>}</div>
}
