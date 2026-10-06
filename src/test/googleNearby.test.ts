import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from '../../api/places'
import { parseGooglePlaces, fetchGoogleNearby } from '../services/googleNearby'
const response = () => ({ status: vi.fn().mockReturnThis(), setHeader: vi.fn(), json: vi.fn() })
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
describe('Google Places boundary', () => {
  it.each([[41.0082,28.9784],[37.8444,27.8458],[36.8969,30.7133],[37.0344,27.4305]])('uses the supplied location %s,%s without city-specific substitution', async (lat,lng) => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only')
    const fetcher = vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[]})}); vi.stubGlobal('fetch',fetcher)
    const res=response(); await handler({method:'GET',url:`/?lat=${lat}&lng=${lng}&category=restaurant`,headers:{'x-forwarded-for':String(lat)}},res)
    expect(JSON.parse(fetcher.mock.calls[0][1].body).locationRestriction.circle.center).toEqual({latitude:lat,longitude:lng})
    expect(fetcher.mock.calls[0][0]).toBe('https://places.googleapis.com/v1/places:searchNearby')
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control','private, no-store')
    expect(res.json).toHaveBeenCalledWith({provider:'Google Maps',places:[]})
  })
  it('uses Text Search for exchange offices, not an unsupported place type',async()=>{
    vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only'); const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({})});vi.stubGlobal('fetch',f)
    await handler({method:'GET',url:'/?lat=37.84&lng=27.84&category=bureau_de_change',headers:{}},response())
    expect(f.mock.calls[0][0]).toContain('searchText')
  })
  it.each(['','91','NaN'])('rejects invalid coordinates %s',async lat=>{
    const f=vi.fn();vi.stubGlobal('fetch',f);const res=response()
    await handler({method:'GET',url:`/?lat=${lat}&lng=29`,headers:{}},res)
    expect(res.status).toHaveBeenCalledWith(400);expect(f).not.toHaveBeenCalled()
  })
  it('does not fabricate results when the key is missing',async()=>{
    vi.stubEnv('GOOGLE_PLACES_API_KEY','');const res=response()
    await handler({method:'GET',url:'/?lat=41&lng=29',headers:{}},res)
    expect(res.json).toHaveBeenCalledWith({error:'NOT_CONFIGURED'})
  })
  it.each([429,403,500])('hides provider error %s',async status=>{
    vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only');vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status}));const res=response()
    await handler({method:'GET',url:'/?lat=41&lng=29',headers:{'x-forwarded-for':String(status)}},res)
    expect(res.json).toHaveBeenCalledWith({error:status===429?'BUSY':'PROVIDER_UNAVAILABLE'})
  })
  it('handles timeouts without raw exceptions',async()=>{
    vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only');vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('secret','TimeoutError')));const res=response()
    await handler({method:'GET',url:'/?lat=41&lng=29',headers:{'x-forwarded-for':'timeout'}},res)
    expect(res.json).toHaveBeenCalledWith({error:'TIMEOUT'})
  })
  it('does not cache Google results in the browser service',async()=>{
    const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[]})});vi.stubGlobal('fetch',f)
    await fetchGoogleNearby({lat:41,lng:29},'all','en');await fetchGoogleNearby({lat:41,lng:29},'all','en')
    expect(f).toHaveBeenCalledTimes(2)
  })
  it('preserves optional fields and rejects distant places',()=>{
    const p={id:'test',displayName:{text:'Place'},location:{latitude:41,longitude:29},googleMapsUri:'https://maps.google.com/?cid=1',types:['restaurant']}
    const result=parseGooglePlaces({places:[p,{...p,id:'far',location:{latitude:38,longitude:28}}]},{lat:41,lng:29},'all')
    expect(result.places).toHaveLength(1);expect(result.places[0].phone).toBeNull();expect(result.places[0].rating).toBeUndefined()
  })
})
