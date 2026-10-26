import {afterEach,expect,it,vi} from 'vitest';
import {Webhook} from 'svix';
import {POST} from '../../api/reservation-delivery';
const secret='whsec_'+Buffer.from('isolated-test-signature-secret-only').toString('base64');
const event={type:'email.delivered',created_at:'2026-10-26T12:00:00Z',data:{email_id:'00000000-0000-0000-0000-000000000123',to:['private@example.test'],tags:{sit_project:'example'}}};
function request(body=JSON.stringify(event),date=new Date(),signature=true){const id='msg_test';return new Request('https://example.test/api/reservation-delivery',{method:'POST',body,headers:{'svix-id':id,'svix-timestamp':String(Math.floor(date.getTime()/1000)),'svix-signature':signature?new Webhook(secret).sign(id,date,body):'invalid'}});}
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it('requires configured signing key',async()=>{vi.stubEnv('RESEND_WEBHOOK_SECRET','');expect((await POST(request())).status).toBe(503);});
it('rejects forged and stale events before database access',async()=>{
 vi.stubEnv('RESEND_WEBHOOK_SECRET',secret);const f=vi.fn();vi.stubGlobal('fetch',f);
 expect((await POST(request(undefined,undefined,false))).status).toBe(400);
 expect((await POST(request(undefined,new Date(Date.now()-600000)))).status).toBe(400);expect(f).not.toHaveBeenCalled();
});
it('stores only delivery metadata after verification, never recipient data',async()=>{
 vi.stubEnv('RESEND_WEBHOOK_SECRET',secret);vi.stubEnv('SUPABASE_URL','https://example.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test');
 const f=vi.fn(async()=>Response.json(true));vi.stubGlobal('fetch',f);expect((await POST(request())).status).toBe(200);
 expect(f).toHaveBeenCalledTimes(1);expect(JSON.stringify(f.mock.calls)).not.toContain('private@example.test');
});
it('requests retry when sender ID is not recorded yet or storage fails',async()=>{
 vi.stubEnv('RESEND_WEBHOOK_SECRET',secret);vi.stubEnv('SUPABASE_URL','https://example.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test');
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json(false)));expect((await POST(request())).status).toBe(503);
});
it('ignores unrelated signed events and rejects oversized payloads',async()=>{
 vi.stubEnv('RESEND_WEBHOOK_SECRET',secret);const f=vi.fn();vi.stubGlobal('fetch',f);
 expect((await POST(request(JSON.stringify({...event,type:'email.opened'})))).status).toBe(200);
 expect((await POST(request('x'.repeat(65537)))).status).toBe(413);expect(f).not.toHaveBeenCalled();
});
it('ignores signed events belonging to another project',async()=>{
 vi.stubEnv('RESEND_WEBHOOK_SECRET',secret);vi.stubEnv('SUPABASE_URL','https://another.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test');const f=vi.fn();vi.stubGlobal('fetch',f);
 expect((await POST(request())).status).toBe(200);expect(f).not.toHaveBeenCalled();
});
