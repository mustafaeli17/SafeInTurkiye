import {lazy, Suspense, useState, useEffect, useRef} from 'react'
import {Map as MapIcon, List, LayoutGrid, MapPin, Navigation, ExternalLink, Clock3, Star, Globe} from 'lucide-react'
import GooglePlacePhoto from './GooglePlacePhoto'
import EditorialPlacePhoto from './EditorialPlacePhoto'
import {editorialDiscoveryCopy} from '../lib/editorialDiscoveryCopy'
import {isEditorialPlace} from '../lib/editorialDiscovery'
import {nearMeDesignCopy} from '../lib/nearMeDesignCopy'
import {placeDirectionsUrl} from '../lib/placeDirections'
import type {NearbyPlaceRecord} from '../services/nearbyPlaces'
import type {DirectoryKind} from '../lib/directoryCopy'

const ResultsMap = lazy(()=>import('./NearbyResultsMap'))
interface Props {
  places: NearbyPlaceRecord[]
  lang: string
  onOpen: (id:string)=>void
  categoryLabel: (category:NearbyPlaceRecord['category'])=>string
  distance: (n:number)=>string
  text: (tr:string,en:string)=>string
  directions: string
  businessKey: (id:string)=>string|undefined
  onExpired: ()=>void
  directory?: DirectoryKind
  showDistance?: boolean
}
export default function NearMeResults({places, lang, onOpen, categoryLabel, distance, text, directions, businessKey, onExpired, directory, showDistance=true}: Props) {
  const [view, setView] = useState<'list'|'map'>('list')
  const [openedMap, setOpenedMap] = useState(false)
  function showMap() { setOpenedMap(true); setView('map') }
  const copy = nearMeDesignCopy[lang] ?? nearMeDesignCopy.en
  const [chosenId, setActiveId] = useState<string|null>(null)
  const activeId = places.some(place=>place.id===chosenId) ? chosenId : places[0]?.id ?? null
  const [wide,setWide] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  const previousView = useRef(view)
  const hotelOrNearby = !directory || directory==='hotels'
  const split = wide && hotelOrNearby
  useEffect(()=>{
    const changed = previousView.current!==view
    previousView.current = view
    if (!changed || split) return
    const target = resultsRef.current?.querySelector<HTMLElement>(view==='list' ? '.nearby-place-card[data-selected="true"] h3 button' : '.nearby-map-panel')
    if (target) {target.scrollIntoView({block:'nearest',behavior:'instant'}); target.focus({preventScroll:true})}
  },[view,split])
  useEffect(()=>{
    const media=window.matchMedia('(min-width: 641px)')
    const sync=()=>setWide(media.matches)
    sync()
    media.addEventListener('change',sync)
    return ()=>media.removeEventListener('change',sync)
  },[])
  const ViewIcon=hotelOrNearby ? List : LayoutGrid
  return <>
    <div className="nearby-view-toggle" role="group" aria-label={text('Kayıtlar','places')}>
      <button type="button" aria-pressed={view==='list'} onClick={()=>setView('list')}><ViewIcon size={18} aria-hidden="true"/>{copy.list}</button>
      <button type="button" aria-pressed={view==='map'} onClick={showMap}><MapIcon size={18} aria-hidden="true"/>{copy.map}</button>
    </div>
    <div ref={resultsRef} className={`nearby-results-layout nearby-view-${view}`}>
      <div className="nearby-result-list">{places.map(place=>{
        const editorial = isEditorialPlace(place) ? place.editorial : null
        const websiteIsSource = Boolean(editorial && place.website===place.sourceUrl)
        const source = websiteIsSource ? text('Web sitesi','Website') : place.id.startsWith('google:') || editorial ? 'Google Maps' : 'OpenStreetMap'
        return <article key={place.id} data-place-id={place.id} data-selected={activeId===place.id || undefined} data-business-key={businessKey(place.id)} className="nearby-place-card">
          <div className="nearby-card-photo">
            {isEditorialPlace(place)
              ? <EditorialPlacePhoto expanded={false} place={place} onOpen={()=>onOpen(place.id)} lang={lang}/>
              : <GooglePlacePhoto key={place.photo?.url??place.id} onExpired={onExpired} place={place} onOpen={()=>onOpen(place.id)}/>}
          </div>
          <div className="nearby-card-body">
            <div className="nearby-card-heading"><h3><button onClick={()=>onOpen(place.id)}>{place.name??categoryLabel(place.category)}</button></h3>
              {showDistance&&<span className="nearby-distance">{distance(place.distanceMeters)}</span>}
            </div>
            <p className="nearby-card-category">{place.typeLabel??categoryLabel(place.category)}</p>
            {editorial&&<p className="directory-editorial-label">{(editorialDiscoveryCopy[lang]??editorialDiscoveryCopy.en)[editorial.sponsored?1:0]}</p>}
            {place.address&&<p className="nearby-card-address"><MapPin size={16} aria-hidden="true"/>{place.address}</p>}
            {place.rating!==undefined&&<p className="nearby-card-rating"><Star size={17} fill="#ffb800" color="#a75d00" aria-hidden="true"/><strong>{place.rating.toLocaleString(lang)}</strong>
              {place.reviewCount!==undefined&&` (${place.reviewCount.toLocaleString(lang)})`}<a href={place.sourceUrl} target="_blank" rel="noopener noreferrer" translate="no">{source}<ExternalLink size={12} aria-hidden="true"/></a></p>}
            {typeof place.openNow==='boolean'&&<p className="nearby-card-hours"><Clock3 size={15} aria-hidden="true"/>{place.openNow?text('Şu an açık','Open now'):text('Şu an kapalı','Closed now')}</p>}
            {place.attributions?.map((a,i)=><p className="text-xs" key={i}>{a.url?<a href={a.url} target="_blank" rel="noopener noreferrer">{a.name}</a>:a.name}</p>)}
            <div className="nearby-card-actions">
              <a href={placeDirectionsUrl(place)} target="_blank" rel="noopener noreferrer"><Navigation size={15} aria-hidden="true"/>{directions}</a>
              {directory&&place.website&&<a href={place.website} data-event="website" target="_blank" rel="noopener noreferrer"><Globe size={15} aria-hidden="true"/>{text('Web sitesi','Website')}</a>}
              {(!directory||(!websiteIsSource&&place.rating===undefined))&&<a href={place.sourceUrl} data-event={websiteIsSource?'website':undefined} target="_blank" rel="noopener noreferrer"><span translate="no">{source}</span><ExternalLink size={14} aria-hidden="true"/></a>}
              <button type="button" aria-pressed={activeId===place.id&&(split||view==='map')} onClick={()=>{setActiveId(place.id);showMap()}}><MapIcon size={15} aria-hidden="true"/>{copy.map}</button>
            </div>
          </div>
        </article>
      })}</div>
      <aside className="nearby-map-panel" tabIndex={-1}><Suspense fallback={<div className="nearby-results-map" aria-busy="true"/>}>
        {(split||openedMap)&&<ResultsMap visible={split||view==='map'} activeId={activeId} onPick={setActiveId} places={places} lang={lang} onExpired={onExpired} onOpen={onOpen} categoryLabel={categoryLabel} title={copy.map} errorText={copy.mapError}/>}
      </Suspense></aside>
    </div>
  </>
}
