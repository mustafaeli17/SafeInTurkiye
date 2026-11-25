import {beforeEach,expect,it,vi} from 'vitest';
import {loadAdminReservations,scheduleCallback} from '../repositories/adminBookingRepository';
import {lastCallbackMinute,type ReservationRow} from '../lib/adminReservations';

const requests=vi.hoisted(()=>vi.fn<typeof fetch>());
vi.mock('../lib/supabase',async()=>{
 const {createClient}=await import('@supabase/supabase-js');
 const client=createClient('https://isolated.example.test','fixture-key',{
  global:{fetch:requests},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
 });
 return {requireSupabase:()=>client};
});
beforeEach(()=>requests.mockReset());
const row:ReservationRow={id:'synthetic',reference_code:'SIT-2099-1',listing_name:'QA Restaurant',guest_name:'QA Guest',
 guest_email:'qa@example.test',visit_date:'2099-01-02',visit_time:'00:15',status:'PENDING',notes:null,guest_count:2};
it.each([['PENDING','eq.false'],['SCHEDULED','eq.true'],['','']])('filters %s before counting and paging',async(status,deferred)=>{
 requests.mockResolvedValueOnce(Response.json([],{headers:{'Content-Range':'*/0'}}));
 const result=await loadAdminReservations(status,50);
 const url=new URL(String(requests.mock.calls[0][0]));
 expect(url.searchParams.get('callback_deferred')??'').toBe(deferred);
 expect(url.searchParams.get('status')).toBe(status?'eq.PENDING':null);
 expect(url.searchParams.get('offset')).toBe('50');expect(url.searchParams.get('order')).toContain(status?'call_priority_at.asc':'created_at.desc');
 expect(result).toMatchObject({total:0,callbacksAvailable:true});
});
it('never substitutes all pending requests for an unavailable scheduled queue',async()=>{
 requests.mockResolvedValueOnce(Response.json({code:'PGRST205'},{status:404}));
 await expect(loadAdminReservations('SCHEDULED')).resolves.toEqual({rows:[],total:0,callbacksAvailable:false});
 expect(requests).toHaveBeenCalledTimes(1);
});
it('derives the callback deadline from the structured Türkiye table time or legacy notes',()=>{
 expect(lastCallbackMinute(row)).toBe(Date.parse('2099-01-01T21:14Z'));
 expect(lastCallbackMinute({...row,visit_time:null,notes:JSON.stringify({time:'01:00'})})).toBe(Date.parse('2099-01-01T21:59Z'));
 expect(lastCallbackMinute({...row,visit_time:null})).toBe(Date.parse('2099-01-02T20:59Z'));
 expect(lastCallbackMinute({...row,visit_date:'2099-02-30'})).toBeNull();
});
it('does not submit an expired, post-visit or closed request to the callback RPC',async()=>{
 await expect(scheduleCallback(row,'2099-01-01T21:15:00Z')).rejects.toThrow('INVALID_CALLBACK_TIME');
 await expect(scheduleCallback({...row,visit_date:'2000-03-05'},'2099-01-01T21:14:00Z')).rejects.toThrow('INVALID_CALLBACK_TIME');
 await expect(scheduleCallback({...row,status:'REJECTED'},'2099-01-01T20:00:00Z')).rejects.toThrow('INVALID_TRANSITION');
 expect(requests).not.toHaveBeenCalled();
});
