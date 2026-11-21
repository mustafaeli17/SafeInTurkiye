import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {
  ArrowUpRight, Banknote, BedDouble, Camera, Car, Castle, ChevronRight, Clapperboard, Coffee, Cross, FerrisWheel,
  Hospital, Landmark, MapPin, Navigation, Scissors, Shield, ShoppingBag, Ticket, Trees, Utensils, Wallet,
} from 'lucide-react'
import GooglePlacePhoto from './GooglePlacePhoto'
import EditorialPlacePhoto from './EditorialPlacePhoto'
import {isEditorialPlace} from '../lib/editorialDiscovery'
import {placeDirectionsUrl} from '../lib/placeDirections'
import {directionsText} from '../lib/searchDestinations'
import {loadMaps} from '../lib/loadGoogleMaps'
import type {NearbyCenter, NearbyPlaceRecord} from '../services/nearbyPlaces'

const categoryIcons = {
  restaurant: Utensils, cafe: Coffee, pharmacy: Cross, hospital: Hospital, hotel: BedDouble,
  museum: Landmark, historical: Castle, attraction: Camera, activity: Ticket, park: Trees,
  cinema: Clapperboard, entertainment: FerrisWheel, shopping: ShoppingBag, taxi: Car,
  barber: Scissors, hair_salon: Scissors, bureau_de_change: Banknote, atm: Wallet, police: Shield,
}

interface Props {
  places: NearbyPlaceRecord[]
  visible?: boolean
  activeId?: string | null
  onPick?: (id: string)=>void
  onOpen?: (id: string)=>void
  categoryLabel?: (category: NearbyPlaceRecord['category'])=>string
  title: string
  errorText: string
  lang: string
  onExpired: ()=>void
}

interface PinLayer {
  pane: HTMLDivElement
  draw: ()=>void
  fit: (places: NearbyPlaceRecord[])=>void
  reveal: (point: NearbyCenter)=>void
}

type Point = {x: number; y: number}
// Nearby businesses can share a building. Separate touch targets locally, leaving a line to the actual location.
function pinOffset(anchor: Point, placed: Point[]): Point {
  const available = (x: number, y: number) => placed.every(p=>Math.hypot(anchor.x+x-p.x, anchor.y+y-p.y)>=44)
  if (available(0,0)) return {x: 0, y: 0}
  for (let ring=1; ring<=3; ring++) {
    for (let index=0; index<ring*6; index++) {
      const angle = Math.PI*2*index/(ring*6) - Math.PI/2
      const x = Math.cos(angle)*ring*46, y = Math.sin(angle)*ring*46
      if (available(x,y)) return {x,y}
    }
  }
  return {x: 0, y: 0}
}

export default function NearbyResultsMap({places, visible=true, activeId, onPick, onOpen, categoryLabel, title, errorText, lang, onExpired}: Props) {
  const host = useRef<HTMLDivElement>(null)
  const initialCenter = useRef(places[0]?.coordinates ?? {lat: 39, lng: 35})
  const fittedLocations = useRef('')
  const [failed, setFailed] = useState(false)
  const [fullscreen, setFullscreen] = useState<Element|null>(null)
  const [layer, setLayer] = useState<PinLayer|null>(null)
  const [chosen, setChosen] = useState<string|null>(null)
  const selected = places.find(place=>place.id===(activeId??chosen)) ?? places[0]
  const selectionName = selected && (selected.name ?? selected.typeLabel ?? categoryLabel?.(selected.category) ?? title)
  const directions = directionsText[lang] ?? directionsText.en
  const route = selected && placeDirectionsUrl(selected)

  useEffect(()=>{
    let cancelled = false
    let removeOverlay: (()=>void) | undefined
    const onAuthError = ()=>setFailed(true)
    const onFullscreen = ()=>{
      const target = document.fullscreenElement
      setFullscreen(target && host.current?.contains(target) ? target : null)
    }
    window.addEventListener('transit-map-auth-error', onAuthError)
    document.addEventListener('fullscreenchange', onFullscreen)
    loadMaps().then(maps=>{
      if (cancelled || !host.current) return
      const map = new maps.Map(host.current, {
        center: initialCenter.current, zoom: 14, mapTypeControl: false, streetViewControl: false,
        fullscreenControl: true, gestureHandling: 'cooperative', clickableIcons: false,
      })
      const shield = document.createElement('div')
      const pane = document.createElement('div')
      shield.append(pane)
      let zoomLimit: {remove: ()=>void} | undefined
      class Pins extends maps.OverlayView {
        onAdd() {
          this.getPanes().overlayMouseTarget.append(shield)
          maps.OverlayView.preventMapHitsAndGesturesFrom(shield)
          setLayer({
            pane, draw: ()=>this.draw(),
            fit(visible) {
              zoomLimit?.remove()
              if (visible.length===1) {
                map.setCenter(visible[0].coordinates)
                map.setZoom(16)
              } else if (visible.length) {
                const bounds = new maps.LatLngBounds()
                visible.forEach(place=>bounds.extend(place.coordinates))
                map.fitBounds(bounds, 54)
                zoomLimit = maps.event.addListenerOnce(map,'idle',()=>{if (map.getZoom()>16) map.setZoom(16)})
              }
            },
            reveal(point) {
              if (!map.getBounds() || map.getBounds().contains(point)) return
              if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) map.setCenter(point)
              else map.panTo(point)
            },
          })
        }
        draw() {
          const projection = this.getProjection()
          if (!projection) return
          const placed: Point[] = []
          pane.dataset.detailed = String(map.getZoom()>=16)
          for (const pin of pane.querySelectorAll<HTMLElement>('.nearby-marker')) {
            const point = projection.fromLatLngToDivPixel(new maps.LatLng(Number(pin.dataset.lat), Number(pin.dataset.lng)))
            if (!point) continue
            const offset = pinOffset(point, placed)
            placed.push({x: point.x+offset.x, y: point.y+offset.y})
            pin.style.left = point.x+'px'
            pin.style.top = point.y+'px'
            pin.style.setProperty('--pin-x', offset.x+'px')
            pin.style.setProperty('--pin-y', offset.y+'px')
            pin.style.setProperty('--stem-width', Math.hypot(offset.x,offset.y)+'px')
            pin.style.setProperty('--stem-angle', Math.atan2(offset.y,offset.x)+'rad')
          }
        }
        onRemove() {shield.remove()}
      }
      const overlay = new Pins()
      overlay.setMap(map)
      removeOverlay = ()=>{zoomLimit?.remove(); overlay.setMap(null)}
    }).catch(()=>{if (!cancelled) setFailed(true)})
    return ()=>{
      cancelled=true
      window.removeEventListener('transit-map-auth-error', onAuthError)
      document.removeEventListener('fullscreenchange', onFullscreen)
      removeOverlay?.()
    }
  }, [])

  useLayoutEffect(()=>{
    if (!layer || !visible) return
    const locations = places.map(p=>`${p.id}:${p.coordinates.lat},${p.coordinates.lng}`).join('|')
    if (locations!==fittedLocations.current) {
      layer.fit(places)
      fittedLocations.current=locations
    }
    layer.draw()
  }, [layer, places, visible])
  useEffect(()=>{
    if (selected && visible) layer?.reveal(selected.coordinates)
  }, [layer, selected, visible])

  const open = selected && onOpen ? ()=>onOpen(selected.id) : undefined
  const selection = selected && route && <div key={selected.id} className={`nearby-map-selection${fullscreen?' nearby-map-fullscreen-card':''}`}>
    <div className="nearby-map-thumbnail">{isEditorialPlace(selected)
      ? <EditorialPlacePhoto place={selected} expanded={false} lang={lang} onOpen={open} href={open?undefined:route}/>
      : <GooglePlacePhoto key={selected.photo?.url??selected.id} place={selected} onExpired={onExpired} onOpen={open} href={open?undefined:route}/>}</div>
    <div className="nearby-map-selection-body">
      {open ? <button type="button" className="nearby-map-selection-name" onClick={open}>{selectionName}<ChevronRight size={16} aria-hidden="true"/></button>
        : <a className="nearby-map-selection-name" href={route} target="_blank" rel="noopener noreferrer">{selectionName}<ArrowUpRight size={16} aria-hidden="true"/></a>}
      <a className="nearby-map-directions" href={route} target="_blank" rel="noopener noreferrer"><Navigation size={15} aria-hidden="true"/>{directions}</a>
      {selected.attributions?.map((credit,i)=><small key={i} className="nearby-map-credit">{credit.url?<a href={credit.url} target="_blank" rel="noopener noreferrer">{credit.name}</a>:credit.name}</small>)}
    </div>
  </div>
  return <div className="nearby-map-wrap">
    {failed ? <p role="status" className="nearby-map-error">{errorText}</p> : <div ref={host} role="region" aria-label={title} className="nearby-results-map"/>}
    {layer && !failed && createPortal(places.map(place=>{
      const Icon = categoryIcons[place.category] ?? MapPin
      const name = place.name ?? place.typeLabel ?? categoryLabel?.(place.category) ?? title
      return <div key={place.id} className="nearby-marker" data-lat={place.coordinates.lat} data-lng={place.coordinates.lng}>
        <button type="button" className="nearby-map-pin" aria-label={name} aria-pressed={place.id===selected?.id}
          onClick={()=>{setChosen(place.id); onPick?.(place.id)}}>
          <span className="nearby-map-symbol"><Icon size={17} aria-hidden="true"/></span>
          <span className="nearby-map-caption" aria-hidden="true">{name}</span>
        </button>
      </div>
    }), layer.pane)}
    {fullscreen ? createPortal(selection,fullscreen) : selection}
  </div>
}
