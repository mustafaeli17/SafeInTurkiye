import { useState } from 'react'
import type { NearbyPlaceRecord } from '../services/nearbyPlaces'

export default function GooglePlacePhoto({ place }: { place: NearbyPlaceRecord }) {
  const [failed, setFailed] = useState(false)
  if (!place.photo || failed) return null
  return <figure className="mb-3 overflow-hidden rounded-xl">
    <a href={place.photo.sourceUrl} target="_blank" rel="noopener noreferrer">
      <img src={place.photo.url} alt={place.name ?? ''} width={640} height={360} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="aspect-video w-full object-cover" onError={() => setFailed(true)} />
    </a>
    <figcaption className="mt-1 text-[11px] text-slate-600"><span translate="no">Google Maps</span>{place.photo.authors.map((author, i) => <span key={i}> · {author.url ? <a href={author.url} target="_blank" rel="noopener noreferrer" className="underline">{author.name}</a> : author.name}</span>)}</figcaption>
  </figure>
}
