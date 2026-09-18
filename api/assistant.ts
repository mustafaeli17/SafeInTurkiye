type RequestLike = { method?: string; body?: unknown };
type ResponseLike = { status(code: number): ResponseLike; json(body: unknown): void };

const systemInstruction = `You are SafeInTürkiye's travel assistant. Answer briefly and practically for visitors in Türkiye. Never invent live prices, opening hours, ratings, weather, traffic or departures. If a live source is not connected, say so and point the user to the relevant SafeInTürkiye page. Do not ask for passwords, API keys or payment details.`;

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method && req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  const apiKey = String(process.env.GEMINI_API_KEY ?? '').trim();
  if (!apiKey) return res.status(503).json({ error: 'unconfigured' });
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 1000) : '';
  const language = typeof body.language === 'string' ? body.language.slice(0, 8) : 'en';
  if (!prompt) return res.status(400).json({ error: 'prompt-required' });
  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents: [{ role: 'user', parts: [{ text: `Reply in language code ${language}. User question: ${prompt}` }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 450 } }),
    });
    if (!upstream.ok) return res.status(upstream.status === 429 ? 429 : 502).json({ error: 'provider-unavailable' });
    const data = await upstream.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const reply = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('').trim();
    if (!reply) return res.status(502).json({ error: 'empty-response' });
    return res.status(200).json({ reply });
  } catch {
    return res.status(502).json({ error: 'provider-unavailable' });
  }
}
