import {requireSupabase} from '../lib/supabase';

export type TodayCall = {
  id:string; reference_code:string; listing_name:string; visit_date:string;
  visit_time:string|null; guest_count:number; callback_at?:string|null;
};
type Failure = {id:string; bookings:{listing_name:string;reference_code:string}|null};
export type TodayQueue = {rows:TodayCall[]; count:number};
export type TodayDelivery = {rows:Failure[]; count:number};

const excludesTest = <T extends {not:(field:string,operator:string,value:string)=>T}>(query:T, prefix='') =>
  query.not(prefix+'guest_name','ilike','TEST ONLY%').not(prefix+'listing_name','ilike','TEST ONLY%');

export async function loadTodayCalls(signal:AbortSignal):Promise<TodayQueue> {
  const client=requireSupabase();
  const fields='id,reference_code,listing_name,visit_date,visit_time,guest_count';
  const current=await excludesTest(client.from('admin_restaurant_call_queue')
    .select(fields+',callback_at',{count:'exact'}).eq('status','PENDING').eq('callback_deferred',false))
    .order('call_priority_at').order('created_at').order('id').limit(5).abortSignal(signal);
  if(!current.error && current.count!==null) return {rows:current.data as unknown as TodayCall[],count:current.count};
  // Preview and older environments can still process pending requests before the optional migration.
  if(!['42P01','PGRST205'].includes(current.error?.code??'')) throw Error('queue_unavailable');
  const pending=await excludesTest(client.from('bookings').select(fields,{count:'exact'})
    .eq('listing_type','restaurant').eq('status','PENDING'))
    .order('visit_date').order('visit_time',{nullsFirst:false}).order('created_at').order('id').limit(5).abortSignal(signal);
  if(pending.error || pending.count===null)throw Error('queue_unavailable');
  return {rows:pending.data as TodayCall[],count:pending.count};
}

export async function loadTodayDelivery(signal:AbortSignal,now=Date.now()):Promise<TodayDelivery> {
  const since=new Date(now-7*24*60*60*1000).toISOString();
  const result=await excludesTest(requireSupabase().from('reservation_notifications')
    .select('id,bookings!inner(reference_code,listing_name)',{count:'exact'})
    .or('state.eq.FAILED,delivery_state.in.(FAILED,BOUNCED,COMPLAINED)')
    .gte('created_at',since),'bookings.')
    .order('created_at',{ascending:false}).limit(3).abortSignal(signal);
  if(result.error || result.count===null)throw Error('notifications_unavailable');
  return {rows:result.data as unknown as Failure[],count:result.count};
}
