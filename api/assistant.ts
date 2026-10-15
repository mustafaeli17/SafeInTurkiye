type RequestLike = { method?: string; body?: unknown };
type ResponseLike = { status(code: number): ResponseLike; json(body: unknown): void };

// Retired endpoint: FAQ is the current public experience. Future Safe AI must
// introduce reviewed access and cost controls before any provider is enabled.
// Do not read credentials or contact model providers here.
export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method && req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  return res.status(503).json({ error: 'unconfigured' });
}
