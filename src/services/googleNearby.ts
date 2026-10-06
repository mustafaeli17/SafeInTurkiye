import { distanceInMeters, isValidCenter, NearbyError, safeTelephone, safeWebsite } from './nearbyPlaces'
import type { NearbyCategory, NearbyCenter, NearbyPlaceRecord, NearbyResult } from './nearbyPlaces'

const mapping: [string, NearbyCategory][] = [['museum','museum'],['tourist_attraction','attraction'],['hotel','hotel'],['lodging','hotel'],['cafe','cafe'],['restaurant','restaurant'],['pharmacy','pharmacy'],['hospital','hospital'],['atm','atm'],['shopping_mall','shopping'],['police','police'],['taxi_stand','taxi']]
const str = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim().slice(0, 2000) : null
export function parseGooglePlaces(payload: unknown, center: NearbyCenter, category: NearbyCategory | 'all'): NearbyResult {
  if (!payload || typeof payload !== 'object' || !('places' in payload) || !Array.isArray(payload.places)) throw new NearbyError('invalid-response')
  const records = new Map<string, NearbyPlaceRecord>()
  for (const p of payload.places) {
    if (!p || typeof p !== 'object' || typeof p.id !== 'string' || !p.id || p.businessStatus === 'CLOSED_PERMANENTLY') continue
    const point = { lat: p.location?.latitude, lng: p.location?.longitude }
    if (!isValidCenter(point) || !str(p.displayName?.text)) continue
    const distance = distanceInMeters(center, point)
    if (distance > 2500) continue
    const matched = category === 'all' ? mapping.find(([type]) => Array.isArray(p.types) && p.types.includes(type))?.[1] : category
    if (!matched) continue
    const phone = safeTelephone(p.internationalPhoneNumber)
    const hours = p.currentOpeningHours ?? p.regularOpeningHours
    const sourceUrl = safeWebsite(p.googleMapsUri)
    if (!sourceUrl) continue
    records.set(p.id, {
      id: `google:${p.id}`, name: str(p.displayName.text), category: matched, coordinates: point,
      distanceMeters: distance, address: str(p.formattedAddress), phone: phone?.phone ?? null,
      telephoneUrl: phone?.telephoneUrl ?? null, website: safeWebsite(p.websiteUri), sourceUrl,
      openingHours: Array.isArray(hours?.weekdayDescriptions) ? hours.weekdayDescriptions.map(str).filter(Boolean).join(' · ') || null : null,
      openNow: typeof p.currentOpeningHours?.openNow === 'boolean' ? p.currentOpeningHours.openNow : undefined,
      rating: typeof p.rating === 'number' && p.rating >= 1 && p.rating <= 5 ? p.rating : undefined,
      reviewCount: Number.isSafeInteger(p.userRatingCount) && p.userRatingCount >= 0 ? p.userRatingCount : undefined,
      attributions: Array.isArray(p.attributions) ? p.attributions.flatMap((a: { provider?: unknown; providerUri?: unknown }) => str(a.provider) ? [{ name: str(a.provider)!, url: safeWebsite(a.providerUri) }] : []) : [],
      typeLabel: str(p.primaryTypeDisplayName?.text) ?? undefined,
      photo: typeof p.photo?.url === 'string' && p.photo.url.startsWith('/api/place-photo?') ? {
        url: p.photo.url, sourceUrl: safeWebsite(p.photo.sourceUrl) ?? sourceUrl,
        authors: Array.isArray(p.photo.authors) ? p.photo.authors.flatMap((a: { displayName?: unknown; uri?: unknown }) => str(a.displayName) ? [{ name: str(a.displayName)!, url: safeWebsite(typeof a.uri === 'string' && a.uri.startsWith('//') ? `https:${a.uri}` : a.uri) }] : []) : [],
      } : undefined,
    })
  }
  return { provider: 'Google Maps', places: [...records.values()].sort((a,b) => a.distanceMeters-b.distanceMeters), fetchedAt: new Date().toISOString(), mapDataAt: null }
}

// Google responses stay only in the mounted view, never in localStorage or the OSM cache.
export async function fetchGoogleNearby(center: NearbyCenter, category: NearbyCategory | 'all', lang: string, signal?: AbortSignal): Promise<NearbyResult> {
  if (!isValidCenter(center)) throw new NearbyError('invalid-location')
  const params = new URLSearchParams({ lat: String(center.lat), lng: String(center.lng), category, lang: ['en','tr','de','fr','ar','ru','zh'].includes(lang) ? lang : 'en' })
  try {
    const response = await fetch(`/api/places?${params}`, { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(11000)]) })
    if (response.status === 429) throw new NearbyError('busy')
    if (!response.ok) throw new NearbyError('unavailable')
    return parseGooglePlaces(await response.json(), center, category)
  } catch (error) {
    if (signal?.aborted) throw signal.reason
    if (error instanceof NearbyError) throw error
    if (error instanceof Error && error.name === 'TimeoutError') throw new NearbyError('timeout')
    throw new NearbyError('unavailable')
  }
}
