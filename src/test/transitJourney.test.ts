import { afterEach, describe, expect, it, vi } from 'vitest'
import handler, { transitWaypoint } from '../../api/transit'
import { decodeTransitPolyline, requestTransitLocation, transitDeparture, transitFare, transitRoutes } from '../lib/transit'
import { transitCopy, transitVehicle } from '../lib/transitCopy'

afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()})
const route={duration:'1800s',legs:[{steps:[{travelMode:'WALK'}]}]}
let sequence=0
async function call(body:any={},origin='https://preview.example',method='POST'){
 vi.stubEnv('GOOGLE_TRANSIT_API_KEY','test-server-secret');vi.stubEnv('TRANSIT_ALLOWED_ORIGINS','https://preview.example')
 const result:any={code:200,headers:{}}
 const res:any={status:(code:number)=>{result.code=code;return res},json:(data:any)=>{result.data=data},setHeader:(key:string,value:string)=>{result.headers[key]=value}}
 await handler({method,headers:{origin,'x-forwarded-for':String(++sequence)},body:{origin:'Taksim, İstanbul',destination:'Sultanahmet, İstanbul',...body}},res)
 return result
}
describe('Transit journey',()=>{
 it('handles location granted, denied and unavailable',async()=>{await expect(requestTransitLocation({getCurrentPosition:((success:any)=>success({coords:{latitude:41,longitude:29}})) as any})).resolves.toEqual({lat:41,lng:29});await expect(requestTransitLocation({getCurrentPosition:((_success:any,error:any)=>error({code:1})) as any})).rejects.toThrow('denied');await expect(requestTransitLocation(undefined)).rejects.toThrow('noLocation')})
 it('rejects invalid coordinates and short addresses',()=>{expect(transitWaypoint({lat:91,lng:20})).toBeNull();expect(transitWaypoint({lat:'41',lng:29})).toBeNull();expect(transitWaypoint('x')).toBeNull();expect(transitWaypoint({lat:41,lng:29})).toEqual({location:{latLng:{latitude:41,longitude:29}}})})
 it('uses Türkiye timezone and bounds departure',()=>{const now=Date.parse('2026-10-07T09:00:00Z');expect(transitDeparture('2026-10-07T12:00',now)).toBe('2026-10-07T09:00:00.000Z');expect(transitDeparture('2026-11-07T12:00',now)).toBeNull();expect(transitDeparture('bad',now)).toBeNull()})
 it('does not invent fares and respects currency nanos',()=>{expect(transitFare(route,'en')).toBeNull();expect(transitFare({...route,travelAdvisory:{transitFare:{currencyCode:'TRY',units:'50',nanos:500000000}}},'en')).toContain('50.50')})
 it('rejects malformed routes and polylines',()=>{expect(transitRoutes([null,{},route])).toEqual([route]);expect(decodeTransitPolyline('bad')).toEqual([]);expect(decodeTransitPolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toHaveLength(3)})
 it('has complete eight-language planner copy',()=>{expect(Object.keys(transitCopy)).toHaveLength(8);for(const copy of Object.values(transitCopy)){expect(Object.keys(copy).sort()).toEqual(Object.keys(transitCopy.en).sort());expect(Object.values(copy).every(Boolean)).toBe(true)}})
 it('localizes vehicle types without inventing unknown modes',()=>{expect(transitVehicle('FERRY','tr')).toBe('Vapur');expect(transitVehicle('BUS','zh')).toBe('公交车');expect(transitVehicle('OTHER','en')).toBe('')})
 it('distinguishes invalid address responses from provider failure',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:400}));expect((await call()).data).toEqual({error:'INVALID_INPUT'})})
 it('rejects malformed provider data',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({routes:'bad'})}));expect((await call()).data).toEqual({error:'UNAVAILABLE'})})
 it('sends TRANSIT, alternatives, field mask and no traffic multiplier',async()=>{const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({routes:[route]})});vi.stubGlobal('fetch',fetcher);const result=await call();expect(result.data.routes).toHaveLength(1);const request=fetcher.mock.calls[0];expect(request[0]).toBe('https://routes.googleapis.com/directions/v2:computeRoutes');const payload=JSON.parse(request[1].body);expect(payload.travelMode).toBe('TRANSIT');expect(payload.computeAlternativeRoutes).toBe(true);expect(payload.transitPreferences).toBeUndefined();expect(request[1].headers['X-Goog-FieldMask']).toContain('transitFare');expect(result.headers['Cache-Control']).toBe('private, no-store')})
 it('normalizes genuine zero results',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({})}));expect((await call()).data.routes).toEqual([])})
 it('hides upstream errors and handles quota',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:403}));expect((await call()).data).toEqual({error:'UNAVAILABLE'});vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:429}));expect((await call()).data).toEqual({error:'BUSY'})})
 it('handles timeout',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('private error','TimeoutError')));expect((await call()).data).toEqual({error:'TIMEOUT'})})
 it('rejects invalid input, unsupported origin and methods before calling Google',async()=>{const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);expect((await call({origin:{lat:NaN,lng:29}})).code).toBe(400);expect((await call({},'https://other.example')).code).toBe(403);expect((await call({},'https://preview.example','GET')).code).toBe(405);expect(fetcher).not.toHaveBeenCalled()})
})
