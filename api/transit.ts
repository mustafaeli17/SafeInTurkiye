type Request = { method?: string; body?: any; headers: Record<string, string | string[] | undefined> };
type Response = { status: (code: number) => Response; json: (body: unknown) => void };
const limits = new Map<string, number>();
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const key = process.env.GOOGLE_ROUTES_API_KEY;
  if (!key) return res.status(503).json({ error: 'ROUTES_NOT_CONFIGURED' });
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const authorization = req.headers.authorization;
  if (!url || !anon || typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return res.status(401).json({ error: 'SIGN_IN_REQUIRED' });
  try {
    const auth = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: authorization }, signal: AbortSignal.timeout(8000) });
    if (!auth.ok) return res.status(401).json({ error: 'SIGN_IN_REQUIRED' });
    const user = await auth.json();
    if (!user.id) return res.status(401).json({ error: 'SIGN_IN_REQUIRED' });
    if ((limits.get(user.id) ?? 0) > Date.now()) return res.status(429).json({ error: 'TRY_AGAIN_LATER' });
    if (limits.size > 1000) limits.clear();
    limits.set(user.id, Date.now() + 10000);
    const { origin, destination, departure, preference, language } = req.body ?? {};
    if (typeof origin !== 'string' || typeof destination !== 'string' || origin.trim().length < 3 || destination.trim().length < 3 || origin.length > 250 || destination.length > 250 || !['LESS_WALKING', 'FEWER_TRANSFERS'].includes(preference)) return res.status(400).json({ error: 'INVALID_INPUT' });
    const time = Date.parse(departure);
    if (!Number.isFinite(time) || time < Date.now() - 60000 || time > Date.now() + 7 * 86400000) return res.status(400).json({ error: 'INVALID_DEPARTURE' });
    const upstream = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.legs.steps,routes.travelAdvisory.transitFare' },
      body: JSON.stringify({ origin: { address: origin.trim() }, destination: { address: destination.trim() }, travelMode: 'TRANSIT', departureTime: new Date(time).toISOString(), computeAlternativeRoutes: true, transitPreferences: { routingPreference: preference }, languageCode: ['tr','en','de','fr','ar','zh','ru'].includes(language) ? language : 'en' }),
    });
    if (!upstream.ok) return res.status(502).json({ error: 'PROVIDER_UNAVAILABLE' });
    const data = await upstream.json();
    return res.status(200).json({ routes: data.routes ?? [], source: 'Google Maps', retrievedAt: new Date().toISOString() });
  } catch { return res.status(502).json({ error: 'PROVIDER_UNAVAILABLE' }); }
}
