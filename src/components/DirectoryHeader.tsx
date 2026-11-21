import { useState, type ReactNode } from 'react'
import { BedDouble, ChevronDown, Compass, LocateFixed, MapPin, Search, SlidersHorizontal, Utensils } from 'lucide-react'
import { directoryCopy, type DirectoryKind } from '../lib/directoryCopy'
import DirectoryMotion from './DirectoryMotion'
import './PlaceDirectory.css'

interface Props {
  kind: DirectoryKind
  lang: string
  citySelect: ReactNode
  cityLabel: string
  areaLabel: string
  areaInput: ReactNode
  area: string
  privacy: string
  scope: string
  searchLabel: string
  locateLabel: string
  initialQuery: string
  busy: boolean
  canSearch: boolean
  onLocate: () => void
  onSearch: (query: string) => void
}
export default function DirectoryHeader(props: Props) {
  const {kind, lang, initialQuery, busy} = props
  const [term, setTerm] = useState(initialQuery)
  const [areaOpen, setAreaOpen] = useState(Boolean(props.area))
  const copy = (directoryCopy[lang] ?? directoryCopy.en)[kind]
  const Icon = kind === 'hotels' ? BedDouble : kind === 'restaurants' ? Utensils : Compass
  return <>
    <header className="directory-hero">
      <img className="directory-hero-image" src={'/photos/directory/' + kind + '.webp'}
        srcSet={`/photos/directory/${kind}-768.webp 768w, /photos/directory/${kind}.webp 1600w`}
        sizes="100vw" alt="" width={1600} height={640} fetchPriority="high" />
      <div className="directory-hero-copy">
        <Icon className="directory-hero-icon" size={27} aria-hidden="true" />
        <h1>{copy[0]}</h1><p>{copy[1]}</p>
      </div>
      {kind === 'activities' && <DirectoryMotion kind="activities"/>}
    </header>
    <div className="directory-search">
      <form className="directory-search-row" onSubmit={event => {event.preventDefault(); if(props.canSearch && !busy) props.onSearch(term.trim())}}>
        <label className="directory-city"><MapPin size={18} aria-hidden="true"/><span className="sr-only">{props.cityLabel}</span>{props.citySelect}<ChevronDown size={16} aria-hidden="true"/></label>
        <label className="directory-query"><Search size={18} aria-hidden="true"/><span className="sr-only">{copy[2]}</span><input maxLength={200} type="search" value={term} placeholder={copy[2]} onChange={event=>setTerm(event.target.value)} /></label>
        <button type="button" className="directory-area-toggle" aria-expanded={areaOpen} aria-controls="directory-area-panel" onClick={()=>setAreaOpen(!areaOpen)}><SlidersHorizontal size={17} aria-hidden="true"/>{props.areaLabel}</button>
        <button className="directory-submit" disabled={busy || !props.canSearch}><Search size={17} aria-hidden="true"/>{props.searchLabel}</button>
      </form>
      <div id="directory-area-panel" className="directory-area-panel" hidden={!areaOpen}>
        <div className="directory-area-controls">{props.areaInput}<button type="button" onClick={props.onLocate} disabled={busy}><LocateFixed size={17} aria-hidden="true"/>{props.locateLabel}</button></div>
        <p>{props.scope} {props.privacy}</p>
      </div>
    </div>
  </>
}
