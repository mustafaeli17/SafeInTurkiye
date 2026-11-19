import {lazy,Suspense,useState,useMemo,useEffect} from 'react'
import {Map as MapIcon,List,MapPin,Navigation,ExternalLink,Clock3,Star} from 'lucide-react'
import GooglePlacePhoto from './GooglePlacePhoto'
import EditorialPlacePhoto from './EditorialPlacePhoto'
import {isEditorialPlace} from '../lib/editorialDiscovery'
import {nearMeDesignCopy} from '../lib/nearMeDesignCopy'
import type {NearbyPlaceRecord} from '../services/nearbyPlaces'
const ResultsMap=lazy(()=>import('./NearbyResultsMap'))
export default function NearMeResults({places,lang,onOpen,categoryLabel,distance,text,directions,businessKey,onExpired}:{places:NearbyPlaceRecord[];lang:string;onOpen:(id:string)=>void;categoryLabel:(category:NearbyPlaceRecord['category'])=>string;distance:(n:number)=>string;text:(tr:string,en:string)=>string;directions:string;businessKey:(id:string)=>string|undefined;onExpired:()=>void}){
 const [view,setView]=useState('list'),copy=nearMeDesignCopy[lang]??nearMeDesignCopy.en
 const [wide,setWide]=useState(false)
 useEffect(()=>{const media=window.matchMedia('(min-width: 641px)');const sync=()=>setWide(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync)},[])
 const mapSignature=JSON.stringify(places.map(p=>({id:p.id,name:p.name,coordinates:p.coordinates})))
 // Keep the same map instance across unrelated list controls and photo loading.
 const mapPlaces=useMemo(()=>JSON.parse(mapSignature),[mapSignature])
 return <><div className="nearby-view-toggle" aria-label={copy.badge}><button aria-pressed={view==='list'} onClick={()=>setView('list')}><List size={18}/>{copy.list} ({places.length})</button><button aria-pressed={view==='map'} onClick={()=>setView('map')}><MapIcon size={18}/>{copy.map}</button></div><div className={`nearby-results-layout nearby-view-${view}`}><div className="nearby-result-list">{places.map(place=><article key={place.id} data-business-key={businessKey(place.id)} className={`nearby-place-card ${place.photo||isEditorialPlace(place)?'':'nearby-no-photo'}`}>
 <div className="nearby-card-photo">{isEditorialPlace(place)?<EditorialPlacePhoto expanded={false} place={place} onOpen={()=>onOpen(place.id)} lang={lang}/>:<GooglePlacePhoto onExpired={onExpired} place={place} onOpen={()=>onOpen(place.id)}/>}</div>
 <div className="nearby-card-body"><div className="nearby-card-heading"><h3><button onClick={()=>onOpen(place.id)}>{place.name??categoryLabel(place.category)}</button></h3><span className="nearby-distance">{distance(place.distanceMeters)}</span></div><p className="nearby-card-category">{place.typeLabel??categoryLabel(place.category)}</p>
 {isEditorialPlace(place)&&place.editorial.sponsored&&<p>{text('Sponsorlu','Sponsored')}</p>}
 {place.address&&<p className="nearby-card-address"><MapPin size={16} aria-hidden="true"/>{place.address}</p>}
 {place.rating!==undefined&&<p className="nearby-card-rating"><Star size={17} fill="#ffb800" color="#ffb800" aria-hidden="true"/><strong>{place.rating}</strong>{place.reviewCount!==undefined&&` (${place.reviewCount.toLocaleString(lang)})`}<a href={place.sourceUrl} target="_blank" rel="noopener noreferrer" translate="no">Google Maps <ExternalLink size={12}/></a></p>}
 {typeof place.openNow==='boolean'&&<p className="nearby-card-hours"><Clock3 size={15} aria-hidden="true"/>{place.openNow?text('Şu an açık','Open now'):text('Şu an kapalı','Closed now')}</p>}
 {place.attributions?.map((a,i)=><p className="text-xs" key={i}>{a.url?<a href={a.url} target="_blank" rel="noopener noreferrer">{a.name}</a>:a.name}</p>)}
 <div className="nearby-card-actions"><a href={`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}${place.id.startsWith('google:')?'&destination_place_id='+encodeURIComponent(place.id.slice(7)):''}`} target="_blank" rel="noopener noreferrer"><Navigation size={15}/>{directions}</a><a href={place.sourceUrl} target="_blank" rel="noopener noreferrer"><span translate="no">Google Maps</span><ExternalLink size={14}/></a></div></div></article>)}</div><aside className="nearby-map-panel"><Suspense fallback={<div className="nearby-results-map" aria-busy="true"/>}>{(wide||view==='map')&&<ResultsMap places={mapPlaces} onOpen={onOpen} title={copy.map} errorText={copy.mapError}/>}</Suspense></aside></div></>
}
