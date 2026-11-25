import {beforeEach,expect,it,vi} from 'vitest';
import {loadTodayCalls,loadTodayDelivery} from '../repositories/adminTodayRepository';

const requests=vi.hoisted(()=>vi.fn<typeof fetch>());
vi.mock('../lib/supabase',async()=>{
  const {createClient}=await import('@supabase/supabase-js');
  const client=createClient('https://isolated.example.test','fixture-key',{
    global:{fetch:requests},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
  return {requireSupabase:()=>client};
});
const signal=new AbortController().signal;
const json=(count:number)=>Response.json([],{headers:{'content-range':'*/'+count}});
const error=(code:string,status:number)=>Response.json({code,message:'unavailable'},{status});
const url=(i:number)=>new URL(String(requests.mock.calls[i][0]));
beforeEach(()=>requests.mockReset());

it('queues only due restaurant calls and fetches no guest contact details',async()=>{
  requests.mockResolvedValueOnce(json(18));
  expect((await loadTodayCalls(signal)).count).toBe(18);
  const request=url(0);
  expect(request.pathname).toBe('/rest/v1/admin_restaurant_call_queue');
  expect(Object.fromEntries(request.searchParams)).toMatchObject({status:'eq.PENDING',callback_deferred:'eq.false',
    guest_name:'not.ilike.TEST ONLY%',listing_name:'not.ilike.TEST ONLY%',limit:'5',order:'call_priority_at.asc,created_at.asc,id.asc'});
  expect(request.searchParams.get('select')).not.toMatch(/guest_name|guest_phone|guest_email|notes/);
});
it('uses the old pending list only when the queue schema is missing',async()=>{
  requests.mockResolvedValueOnce(error('PGRST205',404)).mockResolvedValueOnce(json(0));
  await expect(loadTodayCalls(signal)).resolves.toEqual({rows:[],count:0});
  expect(url(1).searchParams.get('listing_type')).toBe('eq.restaurant');
  requests.mockResolvedValueOnce(error('42501',403));
  await expect(loadTodayCalls(signal)).rejects.toThrow();
  expect(requests).toHaveBeenCalledTimes(3);
});
it('counts recent failed notifications only and distinguishes missing counts from zero',async()=>{
  requests.mockResolvedValueOnce(json(0)).mockResolvedValueOnce(Response.json([]));
  const now=Date.UTC(2026,10,25);
  expect((await loadTodayDelivery(signal,now)).count).toBe(0);
  expect(Object.fromEntries(url(0).searchParams)).toMatchObject({created_at:'gte.2026-11-18T00:00:00.000Z',
    select:'id,bookings!inner(reference_code,listing_name)',or:'(state.eq.FAILED,delivery_state.in.(FAILED,BOUNCED,COMPLAINED))',
    'bookings.guest_name':'not.ilike.TEST ONLY%',limit:'3'});
  await expect(loadTodayDelivery(signal,now)).rejects.toThrow();
});
