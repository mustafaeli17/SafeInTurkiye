import { photonNearbyUrl, photonToOsm } from '../src/services/photonNearby.js'
type Request = { method?: string; url?: string; headers: Record<string, string | string[] | undefined> }
type Response = {
  status: (code: number) => Response
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
}

const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const limits = new Map<string, number>()

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' })
  const requestUrl = new URL(req.url ?? '/api/nearby', 'https://safeinturkiye.com')
  const lat = requestUrl.searchParams.has('lat') ? Number(requestUrl.searchParams.get('lat')) : NaN
  const lng = requestUrl.searchParams.has('lng') ? Number(requestUrl.searchParams.get('lng')) : NaN
  const kind = requestUrl.searchParams.get('kind')
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !['exchange', 'essential'].includes(kind ?? '')) {
    return res.status(400).json({ error: 'INVALID_INPUT' })
  }

  const forwarded = req.headers['x-forwarded-for']
  const client = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || 'unknown'
  if ((limits.get(client) ?? 0) > Date.now()) return res.status(429).json({ error: 'TRY_AGAIN_LATER' })
  if (limits.size > 2000) limits.clear()
  limits.set(client, Date.now() + 3000)

  const amenities = kind === 'exchange' ? 'bureau_de_change' : 'pharmacy|hospital|police|atm|taxi'
  const query = `[out:json][timeout:8];nwr(around:2500,${lat.toFixed(6)},${lng.toFixed(6)})["amenity"~"^(${amenities})$"]["access"!="private"]["access"!="no"];out center tags 180;`
  const controllers = endpoints.map(() => new AbortController())
  const timer = setTimeout(() => controllers.forEach(controller => controller.abort()), 4000)
  try {
    const payload = await Promise.any(endpoints.slice(0, 2).map(async (endpoint, index) => {
      const upstream = await fetch(endpoint + '?data=' + encodeURIComponent(query), {
        headers: { accept: 'application/json', 'User-Agent': 'SafeInTurkiye/1.0 (+https://safeinturkiye.com)' },
        signal: controllers[index].signal,
      })
      if (!upstream.ok) throw new Error('PROVIDER_' + upstream.status)
      const body = await upstream.json()
      if (!Array.isArray(body.elements) || body.remark) throw new Error('INCOMPLETE_RESPONSE')
      return body
    }))
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(payload)
  } catch {
    try {
      const upstream = await fetch(photonNearbyUrl(lat, lng, kind!), {signal: AbortSignal.timeout(6000), headers: {accept:'application/json'}})
      if (!upstream.ok) throw new Error('PROVIDER_UNAVAILABLE')
      const payload = photonToOsm(await upstream.json())
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
      return res.status(200).json(payload)
    } catch { return res.status(503).json({ error: 'PLACE_PROVIDER_UNAVAILABLE' }) }
  } finally {
    clearTimeout(timer)
    controllers.forEach(controller => controller.abort())
  }
}
