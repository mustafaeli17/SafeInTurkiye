import { parseReferenceRates } from '../src/services/travelDataService.ts';

type RequestLike = { method?: string };
type ResponseLike = { status(code: number): ResponseLike; setHeader(name: string, value: string): void; json(body: unknown): void };

// Fixed public source: no user-supplied URLs, credentials or exchange-office quotes.
const source = 'https://api.frankfurter.dev/v2/providers/tcmb/rates?base=EUR&quotes=TRY,USD,GBP,CHF,AED,SAR,CNY';
export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  try {
    const upstream = await fetch(source, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error('unavailable');
    const rows: unknown = await upstream.json();
    parseReferenceRates(rows); // Reject incomplete, future or mixed-date data before caching.
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    return res.status(200).json(rows);
  } catch {
    return res.status(503).json({ error: 'REFERENCE_RATES_UNAVAILABLE' });
  }
}
