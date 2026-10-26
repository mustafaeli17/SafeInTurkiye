import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import handler from '../../api/admin-business';
import {businessKeyFromSource,validBusinessKey} from '../lib/businessIdentity';
let sequence=0;
beforeEach(()=>{vi.stubEnv('SUPABASE_URL','https://example.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-service');vi.stubEnv('GOOGLE_PLACES_API_KEY','test-google');});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
async function call(body:unknown={key:'google/ChIJtest123'},authorized=true,origin='https://www.safeinturkiye.com'){
 let code=0,data:any;const headers:Record<string,string>={};const res:any={status(n:number){code=n;return res;},json(value:unknown){data=value;},setHeader(k:string,v:string){headers[k]=v;}};
 await handler({method:'POST',headers:{origin,'x-forwarded-for':'business-'+ ++sequence,...(authorized?{authorization:'Bearer test'}:{})},body},res);return {code,data,headers};
}
function provider(role='admin',mode='success'){
 return vi.fn(async(url:string)=>{
  if(url.includes('/auth/'))return Response.json({id:'00000000-0000-0000-0000-000000000123'});
  if(url.includes('/profiles'))return Response.json([{role}]);
  if(url.startsWith('https://places.googleapis.com/')){
   if(mode==='timeout')throw new DOMException('secret upstream','TimeoutError');
   if(mode==='failure')return Response.json({error:'private provider details'},{status:429});
   return Response.json({id:mode==='mismatch'?'wrong':'ChIJtest123',displayName:{text:'Test business'},formattedAddress:'Test address',addressComponents:[{types:['administrative_area_level_1'],longText:'İstanbul'}],attributions:[{provider:'Test attribution',providerUri:'https://example.test'}]});
  }
  if(url.includes('/published_editorial_businesses'))return Response.json([{name:'CMS business',address:'CMS address',website:'https://example.test',editorial_metadata:{phone:'+902121234567'}}]);
  return Response.json([]);
 });
}
it('requires staff authorization and same-origin before any Google request',async()=>{
 const fetcher=provider('user');vi.stubGlobal('fetch',fetcher);
 expect((await call(undefined,false)).code).toBe(403);expect(fetcher).not.toHaveBeenCalled();
 expect((await call(undefined,true,'https://evil.test')).code).toBe(403);expect(fetcher).not.toHaveBeenCalled();
 expect((await call()).code).toBe(403);expect(fetcher.mock.calls.some(([url])=>url.includes('googleapis'))).toBe(false);
});
it('returns only actual fields, city and attribution without caching or database writes',async()=>{
 const fetcher=provider();vi.stubGlobal('fetch',fetcher);const result=await call();
 expect(result.code).toBe(200);expect(result.headers['Cache-Control']).toBe('private, no-store');
 expect(result.data).toMatchObject({name:'Test business',city:'İstanbul',provider:'Google Maps'});expect(result.data.phone).toBeUndefined();expect(result.data.attributions).toHaveLength(1);
 expect(fetcher.mock.calls.map(([url])=>url)).toHaveLength(3);
});
it.each(['timeout','failure','mismatch'])('handles %s without raw error or false data',async mode=>{
 vi.stubGlobal('fetch',provider('admin',mode));const result=await call();expect(result.code).toBe(503);expect(result.data).toEqual({error:'UNAVAILABLE'});
});
it('supports existing CMS IDs',async()=>{vi.stubGlobal('fetch',provider());const result=await call({key:'restaurants/00000000-0000-0000-0000-000000000123'});expect(result.data.name).toBe('CMS business');expect(result.data.phone).toBe('+902121234567');});
it('does not follow arbitrary source URLs or guess a Google identity from a name or cid',async()=>{
 const fetcher=provider();vi.stubGlobal('fetch',fetcher);expect((await call({source:'https://evil.test/?query_place_id=ChIJtest123'})).code).toBe(404);
 expect(businessKeyFromSource('https://www.google.com/maps?query_place_id=ChIJtest123')).toBe('google/ChIJtest123');
 expect(businessKeyFromSource('https://maps.google.com/?cid=123')).toBeNull();expect(validBusinessKey('google/../../secrets')).toBe(false);
 expect(fetcher.mock.calls.some(([url])=>url.includes('evil.test'))).toBe(false);
});
