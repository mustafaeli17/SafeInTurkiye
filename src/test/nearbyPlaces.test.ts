import { afterEach, describe, expect, it, vi } from 'vitest'
import { distanceInMeters, fetchNearbyPlaces, parseNearbyResponse, safeTelephone, safeWebsite } from '../services/nearbyPlaces'

const centre = { lat: 41, lng: 29 }
const element = (id: number, lat: number, tags: Record<string, string>) => ({ type: 'node', id, lat, lon: 29, tags })

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('nearby place data', () => {
  it('sorts by numeric metres, so 900 m is closer than 1.2 km, and keeps missing fields unknown', () => {
    const result = parseNearbyResponse({ elements: [
      element(1, 41.0108, { amenity: 'atm' }),
      element(2, 41.0081, { amenity: 'pharmacy', opening_hours: 'Mo-Fr 09:00-18:00', rating: '5.0' }),
    ] }, centre, 'essential')
    expect(result.places.map(place => place.id)).toEqual(['node/2', 'node/1'])
    expect(result.places[0].distanceMeters).toBeCloseTo(900.68, 0)
    expect(result.places[0].openingHours).toBe('Mo-Fr 09:00-18:00')
    expect(result.places[0].phone).toBeNull()
    expect(result.places[0].address).toBeNull()
    expect(result.places[0]).not.toHaveProperty('rating')
    expect(result.places[0]).not.toHaveProperty('isOpen')
    expect(result.places[0].sourceUrl).toBe('https://www.openstreetmap.org/node/2')
  })

  it('keeps exchange bureaux separate and excludes private, disused and malformed records', () => {
    const payload = { elements: [
      element(1, 41.001, { amenity: 'bureau_de_change', name: 'Döviz', 'addr:street': 'Örnek Cad.', 'addr:housenumber': '12', 'addr:city': 'İstanbul', 'contact:phone': '+90 (212) 123 45 67' }),
      element(2, 41.002, { amenity: 'atm' }),
      element(3, 41.003, { amenity: 'bureau_de_change', access: 'private' }),
      element(4, 41.004, { amenity: 'bureau_de_change', disused: 'yes' }),
      element(5, 999, { amenity: 'bureau_de_change' }),
      { type: 'way', id: 6, center: { lat: 41.002, lon: 29 }, tags: { amenity: 'bureau_de_change' } },
    ] }
    const bureaux = parseNearbyResponse(payload, centre, 'exchange').places
    expect(bureaux.map(place => place.id)).toEqual(['node/1', 'way/6'])
    expect(bureaux[0].address).toBe('Örnek Cad. 12, İstanbul')
    expect(bureaux[0].telephoneUrl).toBe('tel:+902121234567')
    expect(parseNearbyResponse(payload, centre, 'essential').places.map(place => place.id)).toEqual(['node/2'])
  })

  it('rejects unsafe external and telephone links', () => {
    for (const link of ['javascript:alert(1)', 'data:text/html,test', 'https://name:pass@example.com', '/relative']) expect(safeWebsite(link)).toBeNull()
    expect(safeWebsite('www.example.com/contact')).toBe('https://www.example.com/contact')
    expect(safeWebsite('https://example.com')).toBe('https://example.com/')
    expect(safeTelephone('javascript:123')).toBeNull()
    expect(safeTelephone('112')).toEqual({ phone: '112', telephoneUrl: 'tel:112' })
    expect(safeTelephone('+90 212 123 45 67; +90 212 765 43 21')?.telephoneUrl).toBe('tel:+902121234567')
  })

  it('rejects incomplete Overpass responses and missing element data', () => {
    expect(() => parseNearbyResponse({ elements: [], remark: 'runtime error: timed out' }, centre, 'essential')).toThrow('unavailable')
    expect(() => parseNearbyResponse({}, centre, 'essential')).toThrow('invalid-response')
    expect(distanceInMeters(centre, centre)).toBe(0)
  })

  it('reuses recent results instead of repeating the same location query', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01'))
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ elements: [] }) })
    vi.stubGlobal('fetch', mockFetch)
    await fetchNearbyPlaces({ lat: 41.12, lng: 29.12 }, 'essential')
    await fetchNearbyPlaces({ lat: 41.12, lng: 29.12 }, 'essential')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('times out a stalled provider and honors cancellation', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-02'))
    vi.stubGlobal('fetch', vi.fn((_url, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const pending = fetchNearbyPlaces({ lat: 41.13, lng: 29.13 }, 'essential')
    const assertion = expect(pending).rejects.toThrow('timeout')
    await vi.advanceTimersByTimeAsync(25000)
    await assertion
    const abort = new AbortController()
    const canceled = fetchNearbyPlaces({ lat: 41.14, lng: 29.14 }, 'essential', abort.signal)
    const canceledAssertion = expect(canceled).rejects.toMatchObject({ name: 'AbortError' })
    abort.abort()
    await canceledAssertion
  })
})
