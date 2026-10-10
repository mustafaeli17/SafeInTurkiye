// Affiliate search only: no bookings, payment data, reviews text or catalog ingestion.
import { viatorFilters } from '../src/services/viatorFilters.js'
type Request = { method?: string; url?: string; headers: Record<string, string | string[] | undefined> }
type Response = { status: (code: number) => Response; setHeader: (name: string, value: string) => void; json: (body: unknown) => void }
type Destination = { destinationId: number; parentDestinationId?: number; name: string }
const destinations: Record<string, string[]> = {
  istanbul: ['Istanbul'], antalya: ['Antalya'], izmir: ['Izmir'], ankara: ['Ankara'],
  cappadocia: ['Cappadocia'], mugla: ['Bodrum'], aydin: ['Kusadasi'], denizli: ['Pamukkale'],
  trabzon: ['Trabzon'], konya: ['Konya'], bursa: ['Bursa'],
}
const languages: Record<string, string> = { en: 'en', tr: 'en', de: 'de', fr: 'fr', ar: 'en', ru: 'en', zh: 'zh-CN', es: 'es' }
const limits = new Map<string, { count: number; until: number }>()
let taxonomy: { base: string; expires: number; items: Destination[] } | undefined
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i')
function safeUrl(value: unknown, photo = false): string | undefined {
  if (typeof value !== 'string') return
  try {
    const u = new URL(value)
    if (u.protocol !== 'https:' || u.username || u.password) return
    if (photo ? u.hostname === 'media-cdn.tripadvisor.com' : u.hostname === 'www.viator.com') return value
  } catch { /* Untrusted upstream URL is omitted. */ }
}
export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  if (req.method !== 'GET') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  const url = new URL(req.url ?? '/', 'https://safeinturkiye.com')
  const city = url.searchParams.get('city') ?? '', lang = url.searchParams.get('lang') ?? 'en'
  const currency = url.searchParams.get('currency') ?? 'EUR'
  const start = Number(url.searchParams.get('start') ?? 1)
  if (!Object.hasOwn(destinations, city) || !Object.hasOwn(languages, lang) || !['EUR','USD','GBP','TRY','AED','CNY'].includes(currency) || !Number.isInteger(start) || start < 1 || start > 97 || (start - 1) % 12) return res.status(400).json({ error: 'INVALID_INPUT' })
  let filters: ReturnType<typeof viatorFilters>
  try { filters = viatorFilters(url.searchParams) } catch { return res.status(400).json({ error: 'INVALID_INPUT' }) }
  const key = process.env.VIATOR_API_KEY?.trim()
  if (!key || /[^\x21-\x7e]/.test(key)) {
    console.warn('Viator configuration unavailable', { reason: key ? 'INVALID_KEY_FORMAT' : 'MISSING_KEY' })
    return res.status(503).json({ error: 'NOT_CONFIGURED' })
  }
  const now = Date.now(), ip = String(req.headers['x-forwarded-for'] ?? 'unknown').split(',')[0].trim()
  for (const [id, item] of limits) if (item.until <= now) limits.delete(id)
  const limit = limits.get(ip)
  if ((limit?.count ?? 0) >= 12 || limits.size >= 2000) { res.setHeader('Retry-After', '60'); return res.status(429).json({ error: 'BUSY' }) }
  limits.set(ip, { count: (limit?.count ?? 0) + 1, until: limit?.until ?? now + 60000 })
  // Preview can read the real catalog without deploying the website to production.
  // This setting must be paired with the matching provider credential.
  const environment = process.env.VIATOR_ENVIRONMENT ?? (process.env.VERCEL_ENV === 'production' ? 'production' : 'sandbox')
  if (!['production','sandbox'].includes(environment)) return res.status(503).json({ error: 'NOT_CONFIGURED' })
  const sandbox = environment === 'sandbox'
  const base = sandbox ? 'https://api.sandbox.viator.com/partner' : 'https://api.viator.com/partner'
  const headers = { 'exp-api-key': key, Accept: 'application/json;version=2.0', 'Accept-Language': languages[lang], 'Content-Type': 'application/json' }
  const signal = AbortSignal.timeout(12000)
  try {
    const request = async (path: string, body?: unknown) => {
      // Destination matching uses stable English taxonomy names; product text
      // remains localized. Do not cache translated names across user languages.
      const requestHeaders = path === '/destinations' ? { ...headers, 'Accept-Language':'en' } : headers
      const r = await fetch(`${base}${path}`, { method: body ? 'POST' : 'GET', headers: requestHeaders, signal, ...(body ? { body: JSON.stringify(body) } : {}) })
      if (!r.ok) {
        // Diagnostics contain only endpoint/status, never response bodies or credentials.
        console.warn('Viator upstream request failed', { path, status: r.status, sandbox })
        throw new Error(r.status === 401 || r.status === 403 ? 'ACCESS_PENDING' : r.status === 429 ? 'BUSY' : 'PROVIDER_UNAVAILABLE')
      }
      return r.json()
    }
    if (!taxonomy || taxonomy.base !== base || taxonomy.expires <= now) {
      const data = await request('/destinations')
      if (!Array.isArray(data.destinations)) throw new Error('PROVIDER_UNAVAILABLE')
      taxonomy = { base, expires: now + 24 * 3600000, items: data.destinations }
    }
    const items = taxonomy.items
    const turkey = items.find(d => ['turkey','turkiye'].includes(normalize(d.name)))
    const inTurkey = (d: Destination) => {
      let parent: Destination | undefined = d
      for (let n = 0; n < 12 && parent; n++) {
        if (parent.destinationId === turkey?.destinationId) return true
        parent = items.find(p => p.destinationId === parent?.parentDestinationId)
      }
      return false
    }
    const destination = items.find(d => destinations[city].some(name => normalize(name) === normalize(d.name)) && inTurkey(d))
    if (!destination) return res.status(200).json({ products: [], totalCount: 0, sandbox, language: languages[lang] })
    const data = await request('/products/search', { ...filters, filtering: { destination: String(destination.destinationId), ...filters.filtering }, pagination: { start, count: 12 }, currency })
    if (!Array.isArray(data.products)) throw new Error('PROVIDER_UNAVAILABLE')
    const products = data.products.flatMap((p: any) => {
      const productUrl = safeUrl(p.productUrl)
      // Never invent affiliate tracking or send visitors to an untracked URL.
      if (!productUrl || !new URL(productUrl).searchParams.get('pid') || typeof p.title !== 'string' || typeof p.productCode !== 'string') return []
      const variants = (p.images?.find((i: any) => i.isCover) ?? p.images?.[0])?.variants
      const photo = Array.isArray(variants) ? [...variants].filter(v => safeUrl(v.url, true) && v.width >= 320).sort((a,b) => Math.abs(a.width-720)-Math.abs(b.width-720))[0]?.url : undefined
      return [{ code: p.productCode, title: p.title, productUrl, photo,
        description: typeof p.description === 'string' ? p.description.slice(0,1500) : undefined,
        fromPrice: Number.isFinite(p.pricing?.summary?.fromPrice) && p.pricing.summary.fromPrice >= 0 ? p.pricing.summary.fromPrice : undefined,
        currency: p.pricing?.currency === currency ? currency : undefined }]
    })
    return res.status(200).json({ products, totalCount: Number.isFinite(data.totalCount) ? data.totalCount : products.length, destination: destination.name, sandbox, language: languages[lang] })
  } catch (error) {
    const code = error instanceof Error && ['ACCESS_PENDING','BUSY'].includes(error.message) ? error.message : signal.aborted ? 'TIMEOUT' : 'PROVIDER_UNAVAILABLE'
    console.warn('Viator search failed', { code, errorType: error instanceof Error ? error.name : 'UnknownError' })
    return res.status(code === 'BUSY' ? 429 : 503).json({ error: code })
  }
}
