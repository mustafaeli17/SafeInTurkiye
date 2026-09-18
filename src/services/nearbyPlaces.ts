export type NearbyKind = 'exchange' | 'essential'
export type NearbyCategory = 'bureau_de_change' | 'pharmacy' | 'hospital' | 'police' | 'atm' | 'taxi' | 'restaurant' | 'cafe'
export interface NearbyCenter { lat: number; lng: number }
export interface NearbyPlaceRecord {
  id: string
  name: string | null
  category: NearbyCategory
  coordinates: NearbyCenter
  distanceMeters: number
  address: string | null
  phone: string | null
  telephoneUrl: string | null
  website: string | null
  openingHours: string | null
  sourceUrl: string
}
export interface NearbyResult {
  places: NearbyPlaceRecord[]
  fetchedAt: string
  mapDataAt: string | null
}

type OsmElement = {
  id?: unknown
  type?: unknown
  lat?: unknown
  lon?: unknown
  center?: { lat?: unknown; lon?: unknown }
  tags?: Record<string, unknown>
}

const categories: NearbyCategory[] = ['bureau_de_change', 'pharmacy', 'hospital', 'police', 'atm', 'taxi', 'restaurant', 'cafe']
const endpoints = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const cache = new Map<string, { result: NearbyResult; expires: number }>()
const cacheDuration = 5 * 60 * 1000
let lastRequestAt = 0
let blockedUntil = 0

export class NearbyError extends Error {
  readonly code: 'invalid-location' | 'busy' | 'timeout' | 'unavailable' | 'invalid-response'
  constructor(code: NearbyError['code']) {
    super(code)
    this.name = 'NearbyError'
    this.code = code
  }
}

export function isValidCenter(center: NearbyCenter): boolean {
  return Number.isFinite(center.lat) && Number.isFinite(center.lng) && Math.abs(center.lat) <= 90 && Math.abs(center.lng) <= 180
}

export function distanceInMeters(from: NearbyCenter, to: NearbyCenter): number {
  const radians = Math.PI / 180
  const sinLat = Math.sin((to.lat - from.lat) * radians / 2)
  const sinLng = Math.sin((to.lng - from.lng) * radians / 2)
  const haversine = sinLat ** 2 + Math.cos(from.lat * radians) * Math.cos(to.lat * radians) * sinLng ** 2
  return 6371008.8 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, haversine))))
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  // OSM text can contain control characters; strip them before rendering.
  // eslint-disable-next-line no-control-regex
  const text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 500)
  return text || null
}

export function safeWebsite(value: unknown): string | null {
  const text = cleanText(value)
  if (!text) return null
  try {
    const parsed = new URL(text.startsWith('www.') ? `https://${text}` : text)
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) return null
    return parsed.href
  } catch { return null }
}

export function safeTelephone(value: unknown): { phone: string; telephoneUrl: string } | null {
  const text = cleanText(value)?.split(';')[0].trim()
  if (!text || !/^\+?[\d\s().-]+$/.test(text)) return null
  const compact = text.replace(/[\s().-]/g, '')
  if (!/^\+?\d{3,15}$/.test(compact)) return null
  return { phone: text, telephoneUrl: `tel:${compact}` }
}

export function parseNearbyResponse(payload: unknown, center: NearbyCenter, kind: NearbyKind): NearbyResult {
  if (!payload || typeof payload !== 'object' || !('elements' in payload) || !Array.isArray(payload.elements)) throw new NearbyError('invalid-response')
  // Overpass can return partial elements together with a runtime error. Never present that as a complete search.
  if ('remark' in payload && payload.remark) throw new NearbyError('unavailable')
  const places = new Map<string, NearbyPlaceRecord>()
  for (const raw of payload.elements as OsmElement[]) {
    if (!raw || !['node', 'way', 'relation'].includes(String(raw.type)) || !Number.isSafeInteger(raw.id) || Number(raw.id) <= 0) continue
    const tags = raw.tags
    if (!tags || typeof tags !== 'object') continue
    const category = tags.amenity as NearbyCategory
    if (!categories.includes(category) || (kind === 'exchange') !== (category === 'bureau_de_change')) continue
    if (tags.access === 'private' || tags.access === 'no' || tags.disused === 'yes' || tags.abandoned === 'yes') continue
    const lat = raw.lat ?? raw.center?.lat
    const lng = raw.lon ?? raw.center?.lon
    if (typeof lat !== 'number' || typeof lng !== 'number' || !isValidCenter({ lat, lng })) continue
    const street = [cleanText(tags['addr:street']) || cleanText(tags['addr:place']), cleanText(tags['addr:housenumber'])].filter(Boolean).join(' ')
    const area = [cleanText(tags['addr:suburb']), cleanText(tags['addr:district']), cleanText(tags['addr:city'])].filter(Boolean)
    const address = cleanText(tags['addr:full']) || [street, ...new Set(area)].filter(Boolean).join(', ') || null
    const telephone = safeTelephone(tags['contact:phone']) || safeTelephone(tags.phone)
    const id = `${raw.type}/${raw.id}`
    places.set(id, {
      id,
      name: cleanText(tags.name) || cleanText(tags['name:en']) || cleanText(tags.brand),
      category,
      coordinates: { lat, lng },
      distanceMeters: distanceInMeters(center, { lat, lng }),
      address,
      phone: telephone?.phone ?? null,
      telephoneUrl: telephone?.telephoneUrl ?? null,
      website: safeWebsite(tags['contact:website']) || safeWebsite(tags.website),
      openingHours: cleanText(tags.opening_hours),
      sourceUrl: `https://www.openstreetmap.org/${id}`,
    })
  }
  const metadata = 'osm3s' in payload && payload.osm3s && typeof payload.osm3s === 'object' ? payload.osm3s : null
  const mapTimestamp = metadata && 'timestamp_osm_base' in metadata ? cleanText(metadata.timestamp_osm_base) : null
  return {
    places: [...places.values()].sort((a, b) => a.distanceMeters - b.distanceMeters),
    fetchedAt: new Date().toISOString(),
    mapDataAt: mapTimestamp && Number.isFinite(Date.parse(mapTimestamp)) ? mapTimestamp : null,
  }
}

export async function fetchNearbyPlaces(center: NearbyCenter, kind: NearbyKind, signal?: AbortSignal): Promise<NearbyResult> {
  if (!isValidCenter(center)) throw new NearbyError('invalid-location')
  signal?.throwIfAborted()
  const key = `${kind}:${center.lat.toFixed(5)}:${center.lng.toFixed(5)}`
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) return cached.result
  if (Date.now() < blockedUntil || Date.now() - lastRequestAt < 2000) throw new NearbyError('busy')
  lastRequestAt = Date.now()

  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(() => { timedOut = true; controller.abort() }, 12000)
  const amenities = kind === 'exchange' ? 'bureau_de_change' : 'pharmacy|hospital|police|atm|taxi|restaurant|cafe'
  const query = `[out:json][timeout:20];nwr(around:2500,${center.lat.toFixed(6)},${center.lng.toFixed(6)})["amenity"~"^(${amenities})$"]["access"!="private"]["access"!="no"];out center tags;`
  try {
    let lastError: unknown = null
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { signal: controller.signal, credentials: 'omit' })
        if (response.status === 429 || response.status === 406) { lastError = new NearbyError('busy'); continue }
        if (!response.ok) { lastError = new NearbyError('unavailable'); continue }
        const result = parseNearbyResponse(await response.json(), center, kind)
        signal?.throwIfAborted()
        if (cache.size >= 12) cache.delete(cache.keys().next().value!)
        cache.set(key, { result, expires: Date.now() + cacheDuration })
        return result
      } catch (error) {
        if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError')
        if (timedOut) throw new NearbyError('timeout')
        lastError = error
      }
    }
    if (lastError instanceof NearbyError && lastError.code === 'busy') { blockedUntil = Date.now() + 30000; throw lastError }
    throw new NearbyError('unavailable')
  } catch (error) {
    if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError')
    if (timedOut) throw new NearbyError('timeout')
    if (error instanceof NearbyError) throw error
    throw new NearbyError('unavailable')
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
