import {requireSupabase} from '../lib/supabase';
import type {ReservationRow} from '../lib/adminReservations';

const basic='id,reference_code,listing_name,guest_name,guest_email,visit_date,guest_count,notes,status,created_at,updated_at';
const structured=basic+',guest_phone,visit_time';
const queueFields=structured+',callback_id,callback_at,callback_deferred';

export async function loadAdminReservations(status='',offset=0,signal?:AbortSignal,limit=50,reference?:string,includeTests=false){
 const client=requireSupabase();
 async function run(table:'admin_restaurant_call_queue'|'bookings',fields:string){
  let query=client.from(table).select(fields,{count:'exact'});
  if(table==='bookings')query=query.eq('listing_type','restaurant');
  if(reference)query=query.eq('reference_code',reference);
  else if(!includeTests)query=query.not('guest_name','ilike','TEST ONLY%').not('listing_name','ilike','TEST ONLY%');
  if(status)query=query.eq('status',status);
  if(status==='PENDING'){
   if(table==='admin_restaurant_call_queue')query=query.order('callback_deferred').order('call_priority_at');
   else{
    query=query.order('visit_date');
    if(fields===structured)query=query.order('visit_time',{nullsFirst:false});
   }
   query=query.order('created_at');
  }else query=query.order('created_at',{ascending:false});
  return await query.order('id').range(offset,offset+Math.max(1,Math.min(1000,limit))-1).abortSignal(signal??AbortSignal.timeout(12000));
 }
 let result=await run('admin_restaurant_call_queue',queueFields);
 let callbacksAvailable=true;
 if(result.error&&['42P01','PGRST205'].includes(result.error.code)){
  callbacksAvailable=false;
  result=await run('bookings',structured);
  if(result.error&&['42703','PGRST204'].includes(result.error.code))result=await run('bookings',basic);
 }
 if(result.error)throw result.error;
 return {rows:(result.data??[]) as unknown as ReservationRow[],total:result.count??null,callbacksAvailable};
}

export async function scheduleCallback(row:ReservationRow,callbackAt:string){
 const result=await requireSupabase().rpc('schedule_reservation_callback',{
  p_booking_id:row.id,p_callback_at:callbackAt,p_expected_callback_id:row.callback_id??null
 }).select('id,callback_at').abortSignal(AbortSignal.timeout(12000)).single();
 if(result.error||!result.data)throw Error('CALLBACK_NOT_SAVED');
 return result.data as {id:string;callback_at:string};
}

export async function changeReservationStatus(row:ReservationRow,status:string){
 const allowed=row.status==='PENDING'?['CONFIRMED','REJECTED','CANCELLED']:row.status==='CONFIRMED'?['CANCELLED']:[];
 if(!allowed.includes(status))throw Error('INVALID_TRANSITION');
 let query=requireSupabase().from('bookings').update({status}).eq('id',row.id).eq('status',row.status);
 if(row.updated_at)query=query.eq('updated_at',row.updated_at);
 const result=await query.select('id,status,updated_at').abortSignal(AbortSignal.timeout(12000)).single();
 if(result.error||!result.data)throw Error('CONFLICT_OR_UNAVAILABLE');
 return result.data;
}
