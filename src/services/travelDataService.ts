export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'TRY';

export interface ReferenceRates {
  date: string;
  /** Units of each currency for one EUR, from one ECB publication date. */
  perEuro: Record<CurrencyCode, number>;
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  code: number;
  isDay: boolean;
  time: number;
}

export class TravelDataError extends Error {
  readonly kind: 'timeout' | 'unavailable' | 'invalid' | 'unconfigured';
  constructor(kind: 'timeout' | 'unavailable' | 'invalid' | 'unconfigured') {
    super(kind);
    this.name = 'TravelDataError';
    this.kind = kind;
  }
}

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TravelDataError('invalid');
  return value as Record<string, unknown>;
};

function numberInRange(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new TravelDataError('invalid');
  }
  return value;
}

function publicationDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TravelDataError('invalid');
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new TravelDataError('invalid');
  return value;
}

export function parseReferenceRates(payload: unknown, now = new Date()): ReferenceRates {
  if (!Array.isArray(payload) || payload.length !== 4) throw new TravelDataError('invalid');
  const perEuro: Record<CurrencyCode, number> = { EUR: 1, USD: 0, GBP: 0, CHF: 0, TRY: 0 };
  let date = '';
  const seen = new Set<string>();
  for (const entry of payload) {
    const row = record(entry);
    const rowDate = publicationDate(row.date);
    if (row.base !== 'EUR' || typeof row.quote !== 'string' || !['USD', 'GBP', 'CHF', 'TRY'].includes(row.quote) || seen.has(row.quote)) {
      throw new TravelDataError('invalid');
    }
    if (date && date !== rowDate) throw new TravelDataError('invalid');
    date = rowDate;
    seen.add(row.quote);
    perEuro[row.quote as CurrencyCode] = numberInRange(row.rate, Number.MIN_VALUE, 1e8);
  }
  // A publication cannot be in the future. An older date is retained and clearly labelled in the UI.
  if (referencePublicationAge(date, now) < 0) throw new TravelDataError('invalid');
  return { date, perEuro };
}

export function referencePublicationAge(date: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (name: string) => parts.find(value => value.type === name)?.value;
  const today = Date.parse(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`);
  return Math.round((today - Date.parse(`${publicationDate(date)}T00:00:00Z`)) / 86400000);
}

export function convertReferenceAmount(amount: number, from: CurrencyCode, to: CurrencyCode, rates: ReferenceRates): number | null {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(rates.perEuro[from]) || !Number.isFinite(rates.perEuro[to]) || rates.perEuro[from] <= 0 || rates.perEuro[to] <= 0) return null;
  const result = amount / rates.perEuro[from] * rates.perEuro[to];
  return Number.isFinite(result) ? result : null;
}

export function parseCurrentWeather(payload: unknown, now = Date.now()): CurrentWeather {
  const body = record(payload);
  const current = record(body.current);
  const units = record(body.current_units);
  if (units.time !== 'unixtime' || units.temperature_2m !== '°C' || units.relative_humidity_2m !== '%' || units.wind_speed_10m !== 'km/h') {
    throw new TravelDataError('invalid');
  }
  const code = numberInRange(current.weather_code, 0, 99);
  if (!Number.isInteger(code)) throw new TravelDataError('invalid');
  const isDay = numberInRange(current.is_day, 0, 1);
  if (isDay !== 0 && isDay !== 1) throw new TravelDataError('invalid');
  const time = numberInRange(current.time, 946684800, now / 1000 + 900) * 1000;
  return {
    temperature: numberInRange(current.temperature_2m, -100, 70),
    humidity: numberInRange(current.relative_humidity_2m, 0, 100),
    windSpeed: numberInRange(current.wind_speed_10m, 0, 500),
    code,
    isDay: isDay === 1,
    time,
  };
}

export async function fetchTravelJson(url: string, signal: AbortSignal, timeoutMs = 12000): Promise<unknown> {
  signal.throwIfAborted();
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal.reason);
  signal.addEventListener('abort', onAbort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new TravelDataError(url.startsWith('/api/weather') && [404, 503].includes(response.status) ? 'unconfigured' : 'unavailable');
    return await response.json();
  } catch (error) {
    if (signal.aborted) throw signal.reason;
    if (timedOut) throw new TravelDataError('timeout');
    if (error instanceof TravelDataError) throw error;
    throw new TravelDataError('unavailable');
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
}

export async function getReferenceRates(signal: AbortSignal): Promise<ReferenceRates> {
  const data = await fetchTravelJson('https://api.frankfurter.dev/v2/providers/ecb/rates?base=EUR&quotes=TRY,USD,GBP,CHF', signal);
  return parseReferenceRates(data);
}

export async function getCurrentWeather(lat: number, lng: number, signal: AbortSignal): Promise<CurrentWeather> {
  numberInRange(lat, -90, 90);
  numberInRange(lng, -180, 180);
  const params = new URLSearchParams({
    latitude: String(lat), longitude: String(lng),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
    timeformat: 'unixtime', timezone: 'Europe/Istanbul', temperature_unit: 'celsius', wind_speed_unit: 'kmh',
  });
  // Open-Meteo's free endpoint permits non-commercial use. A commercial deployment
  // must supply a server-side /api/weather proxy with its licensed provider key.
  // The key must never be placed in VITE_* variables or browser code.
  const endpoint = import.meta.env.DEV ? 'https://api.open-meteo.com/v1/forecast' : '/api/weather';
  return parseCurrentWeather(await fetchTravelJson(`${endpoint}?${params}`, signal));
}

export async function getAssistantReply(prompt: string, language: string, signal: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST', signal,
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ prompt: prompt.slice(0, 1000), language }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { reply?: unknown };
    return typeof payload.reply === 'string' && payload.reply.trim() ? payload.reply.trim() : null;
  } catch {
    return null;
  }
}
