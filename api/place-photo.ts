import { validPhotoToken } from '../src/server/placePhotoToken.js'
type Request = { method?: string; url?: string }
type Response = { status: (code: number) => Response; setHeader: (name: string, value: string) => void; end: () => void }
// Only fresh, server-signed references can reach Google's billable photo endpoint.
export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (req.method !== 'GET') return res.status(405).end()
  const query = new URL(req.url ?? '/', 'https://safeinturkiye.com').searchParams
  const name = query.get('name') ?? '', expires = Number(query.get('expires')), signature = query.get('signature') ?? ''
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return res.status(503).end()
  if (!validPhotoToken(name, expires, signature, key)) return res.status(400).end()
  try {
    const result = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=640&skipHttpRedirect=true`, {
      headers: { 'X-Goog-Api-Key': key }, signal: AbortSignal.timeout(8000), redirect: 'error',
    })
    if (!result.ok) return res.status(502).end()
    const body = await result.json()
    const image = new URL(body.photoUri)
    if (image.protocol !== 'https:' || !image.hostname.endsWith('.googleusercontent.com') || image.username || image.password) return res.status(502).end()
    res.setHeader('Location', image.href)
    return res.status(302).end()
  } catch { return res.status(502).end() }
}
