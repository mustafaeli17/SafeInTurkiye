type RequestLike = { query?: Record<string, string | string[] | undefined> };
type ResponseLike = { status: (code: number) => ResponseLike; json: (body: unknown) => void };

export default async function handler(request: RequestLike, response: ResponseLike) {
  const latitude = typeof request.query?.latitude === 'string' ? request.query.latitude : '';
  const longitude = typeof request.query?.longitude === 'string' ? request.query.longitude : '';
  if (!/^-?\d+(\.\d+)?$/.test(latitude) || !/^-?\d+(\.\d+)?$/.test(longitude)) {
    response.status(400).json({ error: 'Valid latitude and longitude are required.' });
    return;
  }
  try {
    const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timeformat=unixtime&timezone=Europe%2FIstanbul&temperature_unit=celsius&wind_speed_unit=kmh`, { headers: { Accept: 'application/json' } });
    const body = await upstream.json();
    response.status(upstream.status).json(body);
  } catch {
    response.status(502).json({ error: 'Weather provider is unavailable.' });
  }
}
