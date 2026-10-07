export type TransitStep = { travelMode?: string; staticDuration?: string; distanceMeters?: number; navigationInstruction?: { instructions?: string }; transitDetails?: { headsign?: string; stopCount?: number; transitLine?: { name?: string; nameShort?: string; vehicle?: { type?: string } }; stopDetails?: { departureStop?: { name?: string }; arrivalStop?: { name?: string }; departureTime?: string; arrivalTime?: string } } }
export type TransitRoute = { duration: string; distanceMeters?: number; polyline?: { encodedPolyline?: string }; legs: { steps: TransitStep[] }[]; travelAdvisory?: { transitFare?: { currencyCode?: string; units?: string | number; nanos?: number } } }
export function transitDeparture(value: string, now = Date.now()): string | null {
  const time = value ? Date.parse(`${value}:00+03:00`) : now
  return Number.isFinite(time) && time >= now - 60000 && time <= now + 7 * 86400000 ? new Date(time).toISOString() : null
}
export function transitRoutes(value: unknown): TransitRoute[] {
  if (!Array.isArray(value)) return []
  return value.filter(route => route && /^\d+(\.\d+)?s$/.test(route.duration) && Array.isArray(route.legs) && route.legs.every((leg: any) => Array.isArray(leg.steps) && leg.steps.every((step: any) => step && typeof step === 'object'))).slice(0, 4)
}
export function transitFare(route: TransitRoute, locale: string): string | null {
  const fare = route.travelAdvisory?.transitFare
  if (!fare || !/^[A-Z]{3}$/.test(fare.currencyCode ?? '')) return null
  const amount = Number(fare.units ?? 0) + Number(fare.nanos ?? 0) / 1e9
  if (!Number.isFinite(amount) || amount < 0) return null
  return new Intl.NumberFormat(locale, { style: 'currency', currency: fare.currencyCode }).format(amount)
}
export function decodeTransitPolyline(encoded: string): { lat: number; lng: number }[] {
  let index = 0, lat = 0, lng = 0
  const result: { lat: number; lng: number }[] = []
  const read = () => { let value = 0, shift = 0, byte: number; do { if (index >= encoded.length || shift > 30) throw new Error('Invalid polyline'); byte = encoded.charCodeAt(index++) - 63; if (byte < 0 || byte > 63) throw new Error('Invalid polyline'); value |= (byte & 31) << shift; shift += 5 } while (byte >= 32); return value & 1 ? ~(value >> 1) : value >> 1 }
  try { while (index < encoded.length && result.length < 50000) { lat += read(); lng += read(); if (Math.abs(lat / 1e5) > 90 || Math.abs(lng / 1e5) > 180) return []; result.push({ lat: lat / 1e5, lng: lng / 1e5 }) } } catch { return [] }
  return result
}
