import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import handler from '../../api/reservations';
import worker from '../../api/reservation-notifications';
import {receiptHash,validateGuestRequest,reservationAdminLink} from '../../server/restaurantRequests';
const request={action:'create',requestId:'00000000-0000-0000-0000-000000000123',receiptToken:'a'.repeat(64),listing:'TEST restaurant',name:'TEST guest',email:'guest@example.test',phone:'+90000000000',date:new Date(Date.now()+86400000).toISOString().slice(0,10),time:'19:00',guests:2,notes:'Test only',source:'https://maps.google.com/?cid=123'};
let sequence=0;
async function call(body:unknown=request,origin='https://www.safeinturkiye.com',authorization?:string){let code=0,data:any;const res:any={status(n:number){code=n;return res;},json(value:unknown){data=value;},setHeader:vi.fn()};await handler({method:'POST',headers:{origin,'x-forwarded-for':'test-'+ ++sequence,...(authorization?{authorization}:{})},body},res);return {code,data};}
beforeEach(()=>{vi.stubEnv('SUPABASE_URL','https://example.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-service');vi.stubEnv('RESERVATIONS_ENABLED','true');vi.stubEnv('RESEND_API_KEY','test-email-key');vi.stubEnv('RESERVATION_EMAIL_FROM','notifications@example.test');});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
function provider(emailOk=true){return vi.fn(async(url:string,options?:RequestInit)=>{
 const body=String(options?.body??'');
 if(url.includes('/emails'))return new Response(JSON.stringify(emailOk?{id:'mail-123'}:{error:'provider private error'}),{status:emailOk?200:503});
 if(url.includes('/rpc/submit_restaurant_request'))return Response.json([{id:'00000000-0000-0000-0000-000000000111',reference_code:'SIT-2026-0000001',status:'PENDING'}]);
 if(url.includes('/rpc/claim_restaurant_notifications'))return Response.json([{id:'00000000-0000-0000-0000-000000000222',booking_id:'00000000-0000-0000-0000-000000000111',lease_id:'00000000-0000-0000-0000-000000000333',reference_code:'SIT-2026-0000001',listing_name:'TEST restaurant'}]);
 if(url.includes('select=listing_name,visit_date,visit_time,guest_count'))return Response.json([{listing_name:request.listing,visit_date:request.date+'T00:00:00.000Z',visit_time:request.time+':00',guest_count:request.guests}]);
 if(url.includes('receipt_hash='))return Response.json([{status:'CONFIRMED'}]);
 if(url.includes('/auth/'))return Response.json({id:'00000000-0000-0000-0000-000000000444'});
 if(url.includes('/profiles'))return Response.json([{role:body==='staff'?'admin':'user'}]);
 return Response.json([]);
});}
it('rejects bad input and cross-origin requests before inserting',async()=>{const fetcher=provider();vi.stubGlobal('fetch',fetcher);expect((await call(request,'https://evil.example')).code).toBe(403);for(const patch of [{guests:0},{name:' '},{phone:'x'},{receiptToken:'123'},{source:'javascript:alert(1)'},{date:'2030-02-30'},{listing:'Bad\nName'}])expect((await call({...request,...patch})).code).toBe(400);expect(fetcher).not.toHaveBeenCalled();});
it('leaves intake unavailable without configuration and never fakes an acknowledgement',async()=>{vi.stubEnv('RESEND_API_KEY','');vi.stubGlobal('fetch',provider());expect((await call()).code).toBe(503);});
it('commits a real request before notifying and keeps customer PII out of owner email',async()=>{const fetcher=provider();vi.stubGlobal('fetch',fetcher);const result=await call();expect(result.code).toBe(200);expect(result.data.reference).toMatch(/^SIT-/);const payload=JSON.parse(String(fetcher.mock.calls.find(([url])=>String(url).includes('/emails'))?.[1]?.body));expect(payload.to).toEqual(['elimust503@gmail.com']);expect(payload.text).not.toContain(request.email);expect(payload.text).not.toContain(request.phone);const dbPayload=JSON.parse(String(fetcher.mock.calls.find(([url])=>String(url).includes('submit_restaurant_request'))?.[1]?.body));expect(dbPayload.p_receipt_hash).toBe(receiptHash(request.receiptToken));expect(dbPayload).not.toHaveProperty('status');expect(JSON.stringify(dbPayload)).not.toContain(request.receiptToken);});
it('does not lose a saved request if email fails; outbox remains retryable',async()=>{const fetcher=provider(false);vi.stubGlobal('fetch',fetcher);const result=await call();expect(result.code).toBe(200);expect(result.data.notificationQueued).toBe(true);expect(fetcher.mock.calls.some(([,opt])=>String(opt?.body).includes('FAILED'))).toBe(true);});
it('shows the saved visit, not edited retry fields, after an ambiguous successful commit',async()=>{vi.stubGlobal('fetch',provider());const result=await call({...request,listing:'Edited retry',guests:8});expect(result.data.summary).toEqual({listing:request.listing,date:request.date,time:request.time,guests:request.guests});});
it('requires the private receipt, enforces seven-day access and returns only status, not guest data',async()=>{const f=provider();vi.stubGlobal('fetch',f);expect((await call({action:'status',requestId:request.requestId,receiptToken:'wrong'})).code).toBe(404);expect((await call({action:'status',requestId:request.requestId,receiptToken:request.receiptToken})).data).toEqual({status:'CONFIRMED'});expect(f.mock.calls.some(([url])=>String(url).includes('created_at=gte.'))).toBe(true);});
it('does not allow a signed-in ordinary user to process the notification queue',async()=>{vi.stubGlobal('fetch',provider());expect((await call({action:'notifications'},undefined,'Bearer ordinary-user')).code).toBe(403);});
it('keeps the worker protected when no cron secret exists',async()=>{vi.stubEnv('CRON_SECRET','');let code=0;const res:any={status(n:number){code=n;return res;},json:vi.fn(),setHeader:vi.fn()};await worker({method:'GET',headers:{}},res);expect(code).toBe(403);});
it('runs queued notification retries and retention only with the cron secret',async()=>{
 vi.stubEnv('CRON_SECRET','test-cron-secret');const fetcher=provider();vi.stubGlobal('fetch',fetcher);
 let code=0,data:any;const res:any={status(n:number){code=n;return res;},json(value:unknown){data=value;},setHeader:vi.fn()};
 await worker({method:'GET',headers:{authorization:'Bearer wrong'}},res);expect(code).toBe(403);expect(fetcher).not.toHaveBeenCalled();
 await worker({method:'GET',headers:{authorization:'é'.repeat('Bearer test-cron-secret'.length)}},res);expect(code).toBe(403);expect(fetcher).not.toHaveBeenCalled();
 await worker({method:'GET',headers:{authorization:'Bearer test-cron-secret'}},res);expect(code).toBe(200);expect(data.sent).toBe(1);expect(fetcher.mock.calls.some(([url])=>String(url).includes('anonymize_expired_restaurant_requests'))).toBe(true);
});
it('requires valid future Turkish local date/time',()=>{expect(validateGuestRequest(request)).toBe(true);expect(validateGuestRequest({...request,date:'2020-01-01'})).toBe(false);});
it('links Preview notifications to the isolated Preview admin, never a client-supplied host',()=>{
 vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('VERCEL_URL','safe-in-turkiye-test.vercel.app');
 expect(reservationAdminLink()).toBe('https://safe-in-turkiye-test.vercel.app/#admin');
 for(const host of ['evil.example','safe.vercel.app/evil','safe.vercel.app@evil.example','safe.vercel.app\n']){vi.stubEnv('VERCEL_URL',host);expect(reservationAdminLink()).toBe('https://www.safeinturkiye.com/#admin');}
 vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('VERCEL_URL','safe-in-turkiye-test.vercel.app');expect(reservationAdminLink()).toBe('https://www.safeinturkiye.com/#admin');
});
