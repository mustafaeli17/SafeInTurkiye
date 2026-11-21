import {useEffect, useState} from 'react'
import {loadEditorialDiscovery} from '../repositories/editorialDiscoveryRepository'
import {fetchGoogleNearby} from '../services/googleNearby'
import {matchesDiscoveryCategory} from './editorialDiscovery'
import type {NearbyCategory, NearbyCenter, NearbyPlaceRecord} from '../services/nearbyPlaces'

/** A shared URL contains only an ID. Resolve it when the original list isn't available. */
export function useDiscoveryDetail(id: string | null, existing: NearbyPlaceRecord | null, center: NearbyCenter, category: NearbyCategory | 'all', lang: string, context: string) {
  const [attempt, retry] = useState(0)
  const [resolved, setResolved] = useState<{key: string; place: NearbyPlaceRecord | null} | null>(null)
  const key = [id, category, lang, context, center.lat, center.lng, attempt].join('|')
  useEffect(() => {
    if (!id || existing) return
    const controller = new AbortController()
    const point = {lat: center.lat, lng: center.lng}
    const load = id.startsWith('google:')
      ? fetchGoogleNearby(point, category, lang, controller.signal, 'city', '', {id: id.slice(7)})
      : loadEditorialDiscovery(point, category, Infinity, controller.signal, context, id)
    void load.then(result => result.places.find(place => place.id === id && matchesDiscoveryCategory(place, category)) ?? null)
      .catch(() => null).then(place => {
        if (!controller.signal.aborted) setResolved({key, place})
      })
    return () => controller.abort()
  }, [id, existing, center.lat, center.lng, category, lang, context, key])
  return {
    place: existing ?? (resolved?.key === key ? resolved.place : null),
    pending: Boolean(id && !existing && resolved?.key !== key),
    retry: () => retry(previous => previous + 1),
  }
}
