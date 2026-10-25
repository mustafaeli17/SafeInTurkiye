import {requireSupabase} from '../lib/supabase';
import type {ReservationRow} from '../lib/adminReservations';
const basic='id,reference_code,listing_name,guest_name,guest_email,visit_date,guest_count,notes,status,created_at,updated_at';
export async function loadAdminReservations(status='',offset=0,signal?:AbortSignal,limit=50){
 const client=requireSupabase();
 async function run(fields:string){let query=client.from('bookings').select(fields,{count:'exact'}).eq('listing_type','restaurant');if(status)query=query.eq('status',status);query=query.order('created_at',{ascending:false}).order('id').range(offset,offset+Math.max(1,Math.min(1000,limit))-1);return await query.abortSignal(signal??AbortSignal.timeout(12000));}
 let result=await run(basic+',guest_phone,visit_time');
 if(result.error&&['42703','PGRST204'].includes(result.error.code))result=await run(basic);
 if(result.error)throw result.error;
 return {rows:(result.data??[]) as unknown as ReservationRow[],total:result.count??null};
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
