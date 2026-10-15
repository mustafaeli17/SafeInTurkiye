import { parseCurrentWeather } from '../src/services/travelDataService.js';
type RequestLike = { method?: string; query?: Record<string, string | string[] | undefined> };
type ResponseLike = { status: (code: number) => ResponseLike; json: (body: unknown) => void };

export default async function handler(request: RequestLike, response: ResponseLike) {
  if (request.method && request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  const latitude = typeof request.query?.latitude === 'string' ? request.query.latitude : '';
  const longitude = typeof request.query?.longitude === 'string' ? request.query.longitude : '';
  if (!/^-?\d+(\.\d+)?$/.test(latitude) || !/^-?\d+(\.\d+)?$/.test(longitude) || Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180) {
    response.status(400).json({ error: 'Valid latitude and longitude are required.' });
    return;
  }
  try {
    const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timeformat=unixtime&timezone=Europe%2FIstanbul&temperature_unit=celsius&wind_speed_unit=kmh`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error('Provider unavailable');
    const body = await upstream.json();
    parseCurrentWeather(body);
    response.status(200).json(body);
  } catch {
    response.status(502).json({ error: 'Weather provider is unavailable.' });
  }
}
