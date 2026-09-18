type Request = { method?: string; url?: string; headers: Record<string, string | string[] | undefined> }
type Response = {
  status: (code: number) => Response
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
}

const endpoints = [
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]
const limits = new Map<string, number>()

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' })
  const requestUrl = new URL(req.url ?? '/api/nearby', 'https://safeinturkiye.com')
  const lat = Number(requestUrl.searchParams.get('lat'))
  const lng = Number(requestUrl.searchParams.get('lng'))
  const kind = requestUrl.searchParams.get('kind')
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !['exchange', 'essential'].includes(kind ?? '')) {
    return res.status(400).json({ error: 'INVALID_INPUT' })
  }

  const forwarded = req.headers['x-forwarded-for']
  const client = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || 'unknown'
  if ((limits.get(client) ?? 0) > Date.now()) return res.status(429).json({ error: 'TRY_AGAIN_LATER' })
  if (limits.size > 2000) limits.clear()
  limits.set(client, Date.now() + 3000)

  const amenities = kind === 'exchange' ? 'bureau_de_change' : 'pharmacy|hospital|police|atm|taxi|restaurant|cafe'
  const query = `[out:json][timeout:18];nwr(around:2500,${lat.toFixed(6)},${lng.toFixed(6)})["amenity"~"^(${amenities})$"]["access"!="private"]["access"!="no"];out center tags 300;`
  let lastStatus = 502
  for (const endpoint of endpoints) {
    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', accept: 'application/json' },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(10000),
      })
      lastStatus = upstream.status
      if (!upstream.ok) continue
      const payload = await upstream.json()
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
      return res.status(200).json(payload)
    } catch {
      lastStatus = 502
    }
  }
  return res.status(lastStatus === 429 ? 429 : 502).json({ error: lastStatus === 429 ? 'TRY_AGAIN_LATER' : 'PLACE_PROVIDER_UNAVAILABLE' })
}
