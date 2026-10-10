import { photoSignature } from '../src/server/placePhotoToken.js'
// Places API (New). Deliberately no persistent cache or CDN caching of Google data.
type Request = { method?: string; url?: string; headers: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => Response; setHeader: (name: string, value: string) => void; json: (body: unknown) => void }
const types: Record<string, string[]> = {
  all: ['restaurant', 'hotel', 'cafe', 'tourist_attraction', 'museum', 'pharmacy', 'hospital', 'atm', 'shopping_mall'],
  restaurant: ['restaurant'], hotel: ['hotel'], cafe: ['cafe'], attraction: ['tourist_attraction'], museum: ['museum'],
  pharmacy: ['pharmacy'], hospital: ['hospital'], atm: ['atm'], shopping: ['shopping_mall'], police: ['police'], taxi: ['taxi_stand'],
  activity: ['tourist_attraction', 'museum', 'historical_landmark', 'park', 'amusement_park', 'movie_theater', 'bowling_alley'],
  park: ['park'], historical: ['historical_landmark'], entertainment: ['amusement_park', 'bowling_alley'], cinema: ['movie_theater'],
}
const limits = new Map<string, { count: number; until: number }>()
export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (req.method !== 'GET') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  const url = new URL(req.url ?? '/', 'https://safeinturkiye.com')
  const lat = Number(url.searchParams.get('lat')), lng = Number(url.searchParams.get('lng'))
  const category = url.searchParams.get('category') ?? 'all'
  const lang = url.searchParams.get('lang') ?? 'en'
  if (!url.searchParams.get('lat')?.trim() || !url.searchParams.get('lng')?.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !(Object.hasOwn(types, category) || category === 'bureau_de_change') || !['en','tr','de','fr','ar','ru','zh','es'].includes(lang)) return res.status(400).json({ error: 'INVALID_INPUT' })
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return res.status(503).json({ error: 'NOT_CONFIGURED' })
  const ip = String(req.headers['x-forwarded-for'] ?? 'unknown').split(',')[0].trim()
  const now = Date.now()
  for (const [id, entry] of limits) if (entry.until <= now) limits.delete(id)
  const limit = limits.get(ip)
  if ((limit && limit.count >= 12) || limits.size >= 2000) {
    res.setHeader('Retry-After', '60')
    return res.status(429).json({ error: 'BUSY' })
  }
  limits.set(ip, { count: (limit?.count ?? 0) + 1, until: limit?.until ?? now + 60000 })
  const radius = url.searchParams.get('scope') === 'city' ? 30000 : 2500
  const circle = { center: { latitude: lat, longitude: lng }, radius }
  const exchange = category === 'bureau_de_change'
  try {
    const upstream = await fetch(`https://places.googleapis.com/v1/places:${exchange ? 'searchText' : 'searchNearby'}`, {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryTypeDisplayName,places.photos,places.googleMapsUri,places.businessStatus,places.rating,places.userRatingCount,places.currentOpeningHours,places.regularOpeningHours,places.internationalPhoneNumber,places.websiteUri,places.attributions' },
      body: JSON.stringify(exchange
        ? { textQuery: 'döviz bürosu currency exchange', locationBias: { circle }, pageSize: 20, languageCode: lang === 'zh' ? 'zh-CN' : lang }
        : { includedTypes: types[category], locationRestriction: { circle }, maxResultCount: 20, rankPreference: 'POPULARITY', languageCode: lang === 'zh' ? 'zh-CN' : lang }),
    })
    if (!upstream.ok) return res.status(upstream.status === 429 ? 429 : 503).json({ error: upstream.status === 429 ? 'BUSY' : 'PROVIDER_UNAVAILABLE' })
    const body = await upstream.json()
    if (!body || typeof body !== 'object' || (body.places !== undefined && !Array.isArray(body.places))) return res.status(503).json({ error: 'INVALID_RESPONSE' })
    const places = (body.places ?? []).map((place: Record<string, unknown>) => {
      const photos = place.photos as { name?: string; authorAttributions?: unknown[]; googleMapsUri?: string }[] | undefined
      const photo = photos?.[0]
      const expires = Date.now() + 15 * 60000
      const photoUrl = photo?.name ? `/api/place-photo?${new URLSearchParams({ name: photo.name, expires: String(expires), signature: photoSignature(photo.name, expires, key) })}` : null
      const { photos: omittedPhotos, ...rest } = place
      return { ...rest, photo: photoUrl ? { url: photoUrl, authors: photo?.authorAttributions ?? [], sourceUrl: photo?.googleMapsUri ?? place.googleMapsUri } : null }
    })
    return res.status(200).json({ provider: 'Google Maps', places })
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'PROVIDER_UNAVAILABLE' })
  }
}
