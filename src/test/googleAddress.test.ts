import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import handler from '../../api/address'
const token='12345678-1234-4234-8234-123456789012'
let serial=0
const response=()=>{const r={code:200,body:null as any,headers:{} as Record<string,string>,status(n:number){r.code=n;return r},setHeader(k:string,v:string){r.headers[k]=v},json(b:unknown){r.body=b}};return r}
const call=async(body:unknown,origin='https://preview.example')=>{const r=response();await handler({method:'POST',body,headers:{origin,'x-forwarded-for':String(++serial)}},r);return r}
beforeEach(()=>{vi.stubEnv('GOOGLE_PLACES_API_KEY','server-secret');vi.stubEnv('VERCEL_BRANCH_URL','preview.example')})
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()})
it('uses New Autocomplete with country scope, locale and a session token',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({suggestions:[{placePrediction:{placeId:'abc',text:{text:'Airport, Türkiye'}}}]})});vi.stubGlobal('fetch',fetcher)
 const r=await call({action:'suggest',query:'airport',language:'zh',sessionToken:token})
 expect(r.code).toBe(200);expect(r.body.suggestions).toEqual([{placeId:'abc',label:'Airport, Türkiye'}]);expect(JSON.stringify(r.body)).not.toContain('server-secret')
 expect(fetcher.mock.calls[0][0]).toBe('https://places.googleapis.com/v1/places:autocomplete')
 expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({includedRegionCodes:['tr'],languageCode:'zh-CN',sessionToken:token})
 expect(r.headers['Cache-Control']).toContain('no-store')
})
it('resolves selected places to coordinates, administrative province and exact Google place id',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({id:'abc',location:{latitude:40.9,longitude:29.3},formattedAddress:'Pendik, İstanbul',addressComponents:[{types:['country'],shortText:'TR'},{types:['administrative_area_level_1'],longText:'İstanbul'}]})}))
 const r=await call({action:'resolve',placeId:'abc',language:'tr',sessionToken:token})
 expect(r.body.place).toMatchObject({lat:40.9,lng:29.3,city:'İstanbul',mapQuery:'place_id:abc',provider:'google'})
})
it('biases transit suggestions near the chosen city while permitting matches elsewhere in Türkiye',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({suggestions:[]})});vi.stubGlobal('fetch',fetcher)
 const suggest={action:'suggest',query:'Kızılay',language:'tr',sessionToken:token}
 await call({...suggest,city:'Ankara'})
 const scoped=JSON.parse(fetcher.mock.calls[0][1].body)
 expect(scoped.locationBias.circle.center).toEqual({latitude:39.9334,longitude:32.8597})
 expect(scoped.locationRestriction).toBeUndefined()
 expect(scoped.input).toBe('Kızılay')
 for(const city of [undefined,'unknown','__proto__']) {
  await call({...suggest,city})
  expect(JSON.parse(fetcher.mock.lastCall![1].body)).not.toHaveProperty('locationBias')
 }
})
it.each([{}, {action:'suggest',query:'ab',language:'tr',sessionToken:token},{action:'resolve',placeId:'../keys',language:'en',sessionToken:token}])('rejects invalid input before billing',async body=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);expect((await call(body)).code).toBe(400);expect(fetcher).not.toHaveBeenCalled()
})
it('rejects unrelated origins',async()=>{expect((await call({},'https://attacker.example')).code).toBe(403)})
it.each(['zh','ar','ru','de','es','fr','en','tr'])('keeps %s suggestion text localized but resolves a stable tariff district',async language=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({id:'abc',location:{latitude:38.32,longitude:26.30},addressComponents:[{types:['country'],shortText:'TR'},{types:['administrative_area_level_1'],longText:'İzmir'},{types:['administrative_area_level_2'],longText:'Çeşme'}]})});
 vi.stubGlobal('fetch',fetcher);
 const r=await call({action:'resolve',placeId:'abc',language,sessionToken:token});
 expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('languageCode')).toBe('tr');
 expect(r.body.place).toMatchObject({city:'İzmir',district:'Çeşme'});
})
it('does not expose provider errors or make up results',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:429}));const r=await call({action:'suggest',query:'Airport',language:'en',sessionToken:token});expect(r.code).toBe(429);expect(r.body).toEqual({error:'BUSY'})
})
it('handles zero results and malformed responses separately',async()=>{
 const f=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({})}).mockResolvedValueOnce({ok:true,json:async()=>({suggestions:'bad'})});vi.stubGlobal('fetch',f)
 const input={action:'suggest',query:'Airport',language:'en',sessionToken:token}
 expect((await call(input)).body.suggestions).toEqual([]);expect((await call(input)).code).toBe(502)
})
it('fails safely when credentials are missing or the provider times out',async()=>{
 vi.stubEnv('GOOGLE_PLACES_API_KEY','');expect((await call({action:'suggest',query:'Airport',language:'en',sessionToken:token})).code).toBe(503)
 vi.stubEnv('GOOGLE_PLACES_API_KEY','secret');vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('timed out','TimeoutError')))
 expect((await call({action:'suggest',query:'Airport',language:'en',sessionToken:token})).body).toEqual({error:'TIMEOUT'})
})
it('rejects foreign places and invalid coordinates',async()=>{
 const f=vi.fn();vi.stubGlobal('fetch',f)
 for(const [country,latitude]of [['NL',52],['TR',NaN]]as const){
  f.mockResolvedValue({ok:true,json:async()=>({id:'abc',location:{latitude,longitude:29},addressComponents:[{types:['country'],shortText:country}]})})
  expect((await call({action:'resolve',placeId:'abc',language:'en',sessionToken:token})).code).toBe(502)
 }
})
