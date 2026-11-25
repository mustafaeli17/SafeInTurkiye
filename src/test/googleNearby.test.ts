import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from '../../api/places'
import { parseGooglePlaces, fetchGoogleNearby } from '../services/googleNearby'
const response = () => ({ status: vi.fn().mockReturnThis(), setHeader: vi.fn(), json: vi.fn() })
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
describe('Google Places boundary', () => {
  it('returns only confirmed Turkish text results, including a named venue outside the biased city', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'test-only')
    const place = {id:'other-city', types:['restaurant'], displayName:{text:'Restaurant'}, location:{latitude:36.9,longitude:30.7}, googleMapsUri:'https://maps.google.com/?cid=1'}
    const components = (country:string) => [{types:['country'],shortText:country},{types:['administrative_area_level_1'],longText:'Antalya'}]
    const f = vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[
      {...place,addressComponents:components('TR')}, {...place,id:'outside',addressComponents:components('DE')}, {...place,id:'unknown'},
    ]})})
    vi.stubGlobal('fetch', f)
    const res = response()
    await handler({method:'GET',url:'/?lat=41&lng=29&category=restaurant&q=Antalya',headers:{'x-forwarded-for':'plan-province'}},res)
    expect(f.mock.calls[0][1].headers['X-Goog-FieldMask']).toContain('places.addressComponents')
    const payload = res.json.mock.calls[0][0]
    expect(payload.places[0]).not.toHaveProperty('addressComponents')
    const rows = parseGooglePlaces(payload, {lat:41,lng:29}, 'restaurant', Infinity).places
    expect(rows.map(row => [row.id,row.cityName])).toEqual([['google:other-city','Antalya']])
  })
  it('retrieves the province in the original place search for discovery categories that use city context', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'test-only')
    const upstream = vi.fn().mockResolvedValue({ok:true, json:async () => ({places:[]})})
    vi.stubGlobal('fetch', upstream)
    const categories = ['all','cafe','hotel','activity','attraction','museum','historical','park','cinema','entertainment','atm']
    for (const [index, category] of categories.entries()) {
      await handler({method:'GET', url:'/?lat=41&lng=29&category='+category, headers:{'x-forwarded-for':'plan-mask-'+category}}, response())
      expect(upstream).toHaveBeenCalledTimes(index + 1)
      expect(upstream.mock.calls[index][1].headers['X-Goog-FieldMask'].includes('places.addressComponents')).toBe(category !== 'atm')
    }
  })
  it('recovers a shared Turkish place by ID under the existing request budget',async()=>{
    vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only')
    const place={id:'shared',addressComponents:[{shortText:'TR',types:['country']}]}
    const f=vi.fn().mockResolvedValue({ok:true,json:async()=>place});vi.stubGlobal('fetch',f)
    const res=response()
    await handler({method:'GET',url:'/?id=shared&lat=41&lng=29&lang=de',headers:{'x-forwarded-for':'detail-id'}},res)
    expect(f).toHaveBeenCalledTimes(1)
    expect(f.mock.calls[0][0]).toBe('https://places.googleapis.com/v1/places/shared?languageCode=de')
    expect(res.json).toHaveBeenCalledWith({provider:'Google Maps',places:[{id:'shared',photo:null}]})
  })
  it('rejects a malformed ID before fetching, and suppresses an out-of-country record',async()=>{
    vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only')
    const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({id:'shared',addressComponents:[{shortText:'DE',types:['country']}]})});vi.stubGlobal('fetch',f)
    const bad=response(), outside=response()
    await handler({method:'GET',url:'/?id=bad%2Fvalue&lat=41&lng=29',headers:{}},bad)
    expect(bad.status).toHaveBeenCalledWith(400);expect(f).not.toHaveBeenCalled()
    await handler({method:'GET',url:'/?id=shared&lat=41&lng=29',headers:{'x-forwarded-for':'detail-outside'}},outside)
    expect(outside.status).toHaveBeenCalledWith(404)
  })
  it('uses an allowed cuisine in both nearby and named restaurant searches',async()=>{
    vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only')
    const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[]})});vi.stubGlobal('fetch',f)
    for(const suffix of ['', '&q=restaurant']){
      await handler({method:'GET',url:'/?lat=41&lng=29&category=restaurant&cuisine=seafood_restaurant'+suffix,headers:{'x-forwarded-for':'cuisine'}},response())
    }
    expect(JSON.parse(f.mock.calls[0][1].body).includedTypes).toEqual(['seafood_restaurant'])
    expect(JSON.parse(f.mock.calls[1][1].body)).toMatchObject({includedType:'seafood_restaurant',strictTypeFiltering:true})
    const bad=response()
    await handler({method:'GET',url:'/?lat=41&lng=29&category=hotel&cuisine=seafood_restaurant',headers:{}},bad)
    expect(bad.status).toHaveBeenCalledWith(400);expect(f).toHaveBeenCalledTimes(2)
  })
  it('does not relabel an event venue as cinema; keeps a real secondary cinema type',()=>{
    const place={id:'venue',displayName:{text:'Event venue'},location:{latitude:41,longitude:29},types:['event_venue'],googleMapsUri:'https://maps.google.com/?cid=1'};
    expect(parseGooglePlaces({places:[place]},{lat:41,lng:29},'cinema').places).toHaveLength(0);
    expect(parseGooglePlaces({places:[{...place,types:['event_venue','movie_theater']}]},{lat:41,lng:29},'cinema').places).toHaveLength(1);
  })
  it.each([['barber',['barber_shop']],['hair_salon',['hair_salon','hair_care']]] as const)('requests supported grooming types for %s',async(category,types)=>{
    vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only')
    const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[]})});vi.stubGlobal('fetch',f)
    await handler({method:'GET',url:`/?lat=41&lng=29&category=${category}`,headers:{'x-forwarded-for':`grooming-${category}`}},response())
    expect(JSON.parse(f.mock.calls[0][1].body).includedTypes).toEqual(types)
    const p={id:category,displayName:{text:'Salon'},location:{latitude:41,longitude:29},types:[types[0]],googleMapsUri:'https://maps.google.com/?cid=1'}
    expect(parseGooglePlaces({places:[p]},{lat:41,lng:29},'all').places[0].category).toBe(category)
  })
  it('separates city discovery from the 2.5km nearby radius', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only')
    const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[]})}); vi.stubGlobal('fetch',f)
    await handler({method:'GET',url:'/?lat=41&lng=29&category=cinema&scope=city',headers:{'x-forwarded-for':'city-scope'}},response())
    const body=JSON.parse(f.mock.calls[0][1].body)
    expect(body.locationRestriction.circle.radius).toBe(30000)
    expect(body.includedTypes).toEqual(['movie_theater'])
    const place={id:'across-town',types:['movie_theater'],displayName:{text:'Cinema'},location:{latitude:41.1,longitude:29},googleMapsUri:'https://maps.google.com/?cid=1'}
    expect(parseGooglePlaces({places:[place]},{lat:41,lng:29},'cinema').places).toHaveLength(0)
    expect(parseGooglePlaces({places:[place]},{lat:41,lng:29},'cinema',30000).places).toHaveLength(1)
  })
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
    vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only')
    const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[
      {id:'office-tr',addressComponents:[{types:['country'],shortText:'TR'}]},
      {id:'office-gr',addressComponents:[{types:['country'],shortText:'GR'}]},
    ]})});vi.stubGlobal('fetch',f)
    const res=response()
    await handler({method:'GET',url:'/?lat=37.84&lng=27.84&category=bureau_de_change',headers:{}},res)
    expect(f.mock.calls[0][0]).toContain('searchText')
    expect(f.mock.calls[0][1].headers['X-Goog-FieldMask']).toContain('places.addressComponents')
    expect(res.json.mock.calls[0][0].places.map((p:{id:string})=>p.id)).toEqual(['office-tr'])
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
