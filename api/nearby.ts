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
]
const limits = new Map<string, { count: number; until: number }>()
const cache = new Map<string, { body: unknown; until: number }>()
const pending = new Map<string, Promise<unknown>>()

async function search(lat: number, lng: number, kind: string): Promise<unknown> {
  const amenities = kind === 'exchange' ? 'bureau_de_change' : 'pharmacy|hospital|police|atm|taxi'
  const query = `[out:json][timeout:3];nwr(around:2500,${lat.toFixed(6)},${lng.toFixed(6)})["amenity"~"^(${amenities})$"]["access"!="private"]["access"!="no"];out center tags 180;`
  // Bounded sequential failover: healthy requests use one provider, not three.
  // 4s + 4s + 4s leaves room inside the client's 18s deadline.
  for (const endpoint of endpoints) {
      try {
        const upstream = await fetch(endpoint + '?data=' + encodeURIComponent(query), {
          headers: { accept: 'application/json', 'User-Agent': 'SafeInTurkiye/1.0 (+https://safeinturkiye.com)' },
          signal: AbortSignal.timeout(4000),
        })
        if (!upstream.ok) throw new Error(`HTTP_${upstream.status}`)
        const body = await upstream.json()
        if (!body || !Array.isArray(body.elements) || body.remark) throw new Error('INCOMPLETE_RESPONSE')
        return body
      } catch {
        // No user coordinates, IPs or credentials in diagnostic logs.
        console.warn('Nearby upstream failure', new URL(endpoint).hostname)
      }
  }
    const upstream = await fetch(photonNearbyUrl(lat, lng, kind), { signal: AbortSignal.timeout(4000), headers: { accept: 'application/json' } })
    if (!upstream.ok) throw new Error(`PHOTON_HTTP_${upstream.status}`)
    return photonToOsm(await upstream.json())
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' })
  const requestUrl = new URL(req.url ?? '/api/nearby', 'https://safeinturkiye.com')
  const lat = requestUrl.searchParams.has('lat') ? Number(requestUrl.searchParams.get('lat')) : NaN
  const lng = requestUrl.searchParams.has('lng') ? Number(requestUrl.searchParams.get('lng')) : NaN
  const kind = requestUrl.searchParams.get('kind')
  if (!requestUrl.searchParams.get('lat')?.trim() || !requestUrl.searchParams.get('lng')?.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !['exchange', 'essential'].includes(kind ?? '')) {
    return res.status(400).json({ error: 'INVALID_INPUT' })
  }

  const forwarded = req.headers['x-forwarded-for']
  const client = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || 'unknown'
  const key = `${kind}:${lat.toFixed(6)}:${lng.toFixed(6)}`
  const cached = cache.get(key)
  if (cached && cached.until > Date.now()) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(cached.body)
  }
  const limit = limits.get(client)
  if (limit && limit.until > Date.now() && limit.count >= 12) {
    res.setHeader('Retry-After', String(Math.ceil((limit.until - Date.now()) / 1000)))
    res.setHeader('Cache-Control', 'no-store')
    return res.status(429).json({ error: 'TRY_AGAIN_LATER' })
  }
  if (limits.size > 2000) limits.clear()
  limits.set(client, limit && limit.until > Date.now() ? { ...limit, count: limit.count + 1 } : { count: 1, until: Date.now() + 60000 })
  try {
    let task = pending.get(key)
    if (!task) {
      task = search(lat, lng, kind!).finally(() => pending.delete(key))
      pending.set(key, task)
    }
    const payload = await task
    if (cache.size >= 200) cache.delete(cache.keys().next().value!)
    cache.set(key, { body: payload, until: Date.now() + 300000 })
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(payload)
  } catch {
    console.warn('Nearby fallback unavailable')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(503).json({ error: 'PLACE_PROVIDER_UNAVAILABLE' })
  }
}
