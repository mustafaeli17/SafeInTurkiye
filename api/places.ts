import { directoryCuisine } from '../src/lib/directoryCuisines.js'
import { photoSignature } from '../src/server/placePhotoToken.js'
import { createRequestBudget } from '../src/server/requestBudget.js'
// Places API (New). Deliberately no persistent cache or CDN caching of Google data.
type Request = { method?: string; url?: string; headers: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => Response; setHeader: (name: string, value: string) => void; json: (body: unknown) => void }
const types: Record<string, string[]> = {
  all: ['restaurant', 'hotel', 'cafe', 'tourist_attraction', 'museum', 'pharmacy', 'hospital', 'atm', 'shopping_mall', 'barber_shop', 'hair_salon'],
  barber: ['barber_shop'], hair_salon: ['hair_salon', 'hair_care'],
  restaurant: ['restaurant'], hotel: ['hotel'], cafe: ['cafe'], attraction: ['tourist_attraction'], museum: ['museum'],
  pharmacy: ['pharmacy'], hospital: ['hospital'], atm: ['atm'], shopping: ['shopping_mall'], police: ['police'], taxi: ['taxi_stand'],
  activity: ['tourist_attraction', 'museum', 'historical_landmark', 'park', 'amusement_park', 'movie_theater', 'bowling_alley'],
  park: ['park'], historical: ['historical_landmark'], entertainment: ['amusement_park', 'bowling_alley'], cinema: ['movie_theater'],
}
const detailFields = 'id,displayName,formattedAddress,location,types,primaryType,primaryTypeDisplayName,photos,googleMapsUri,businessStatus,rating,userRatingCount,currentOpeningHours,regularOpeningHours,internationalPhoneNumber,websiteUri,attributions'
const searchFields = detailFields.split(',').map(field => 'places.' + field).join(',')
const consumePlacesBudget = createRequestBudget(12)
export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (req.method !== 'GET') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  const url = new URL(req.url ?? '/', 'https://safeinturkiye.com')
  const lat = Number(url.searchParams.get('lat')), lng = Number(url.searchParams.get('lng'))
  const category = url.searchParams.get('category') ?? 'all'
  const lang = url.searchParams.get('lang') ?? 'en'
  const placeId = url.searchParams.get('id')
  const cuisine = directoryCuisine(url.searchParams.get('cuisine'))
  if ((placeId !== null && !/^[A-Za-z0-9_-]{1,250}$/.test(placeId)) || (url.searchParams.has('cuisine') && (category !== 'restaurant' || !cuisine))) return res.status(400).json({ error: 'INVALID_INPUT' })
  const searchText = (url.searchParams.get('q') ?? '').trim()
  if (searchText.length > 200 || [...searchText].some(char=>char.charCodeAt(0)<32)) return res.status(400).json({ error: 'INVALID_INPUT' })
  if (!url.searchParams.get('lat')?.trim() || !url.searchParams.get('lng')?.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !(Object.hasOwn(types, category) || category === 'bureau_de_change') || !['en','tr','de','fr','ar','ru','zh','es'].includes(lang)) return res.status(400).json({ error: 'INVALID_INPUT' })
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return res.status(503).json({ error: 'NOT_CONFIGURED' })
  const retryAfter = consumePlacesBudget(req.headers)
  if (retryAfter) {
    res.setHeader('Retry-After', String(retryAfter))
    return res.status(429).json({ error: 'BUSY' })
  }
  const radius = url.searchParams.get('scope') === 'city' ? 30000 : 2500
  const circle = { center: { latitude: lat, longitude: lng }, radius }
  const exchange = category === 'bureau_de_change'
  try {
    const languageCode = lang === 'zh' ? 'zh-CN' : lang
    const includedTypes = cuisine ? [cuisine] : types[category]
    const upstream = placeId ? await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${languageCode}`, {
      signal: AbortSignal.timeout(8000),
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': detailFields + ',addressComponents' },
    }) : await fetch(`https://places.googleapis.com/v1/places:${exchange || searchText ? 'searchText' : 'searchNearby'}`, {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': searchFields },
      body: JSON.stringify(exchange || searchText
        ? { textQuery: searchText || 'döviz bürosu currency exchange', locationBias: { circle }, ...(searchText && includedTypes?.length === 1 ? { includedType: includedTypes[0], strictTypeFiltering: true } : {}), pageSize: 20, languageCode: lang === 'zh' ? 'zh-CN' : lang }
        : { includedTypes, locationRestriction: { circle }, maxResultCount: 20, rankPreference: 'POPULARITY', languageCode: lang === 'zh' ? 'zh-CN' : lang }),
    })
    if (!upstream.ok) return res.status(upstream.status === 429 ? 429 : 503).json({ error: upstream.status === 429 ? 'BUSY' : 'PROVIDER_UNAVAILABLE' })
    let body = await upstream.json()
    if (placeId) {
      const withinTurkiye = Array.isArray(body?.addressComponents) && body.addressComponents.some((part: {types?: string[]; shortText?: string}) => part.types?.includes('country') && part.shortText === 'TR')
      if (body?.id !== placeId || !withinTurkiye) return res.status(404).json({ error: 'PLACE_UNAVAILABLE' })
      const { addressComponents, ...place } = body
      body = { places: [place] }
    }
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
