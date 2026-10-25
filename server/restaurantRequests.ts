import {createHash,createHmac} from 'node:crypto';
import {validBookingTime} from '../src/lib/bookingTime.ts';
import {supportEmail} from '../src/lib/siteOperator.ts';
export type ReservationHttpRequest={method?:string;headers:Record<string,string|string[]|undefined>;body?:unknown};
export type ReservationHttpResponse={status:(n:number)=>ReservationHttpResponse;json:(body:unknown)=>unknown;setHeader:(name:string,value:string)=>void};
export function reservationBackend(){
 const url=(process.env.SUPABASE_URL??process.env.VITE_SUPABASE_URL??'').replace(/\/$/,'');
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!key)return null;
 return {url,key};
}
export async function reservationDb(path:string,body?:unknown,method=body===undefined?'GET':'POST'){
 const config=reservationBackend();if(!config)throw Error('UNAVAILABLE');
 const response=await fetch(config.url+'/rest/v1/'+path,{method,headers:{apikey:config.key,Authorization:'Bearer '+config.key,'Content-Type':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(8000)});
 if(!response.ok){const data=await response.json().catch(()=>null);throw Error(data?.message==='RATE_LIMIT'?'RATE_LIMIT':'UNAVAILABLE');}
 return response.status===204?[]:await response.json();
}
export const emailConfigured=()=>Boolean(process.env.RESEND_API_KEY&&process.env.RESERVATION_EMAIL_FROM&&!/[\r\n]/.test(process.env.RESERVATION_EMAIL_FROM));
export function reservationOrigin(req:ReservationHttpRequest){
 const allowed=['https://www.safeinturkiye.com','https://safeinturkiye.com',...[process.env.VERCEL_URL,process.env.VERCEL_BRANCH_URL].filter(Boolean).map(host=>'https://'+host),...(process.env.RESERVATION_ALLOWED_ORIGINS??'').split(',').filter(Boolean)];
 return allowed.includes(String(req.headers.origin??''));
}
export async function reservationSchemaReady(){try{await reservationDb('bookings?select=request_id,receipt_hash,visit_time,guest_phone&limit=0');await reservationDb('reservation_notifications?select=id&limit=0');return true;}catch{return false;}}
export async function reservationStaff(req:ReservationHttpRequest){
 const config=reservationBackend(),authorization=String(req.headers.authorization??'');
 if(!config||!/^Bearer [^\s]+$/.test(authorization))return false;
 try{
  const user=await fetch(config.url+'/auth/v1/user',{headers:{apikey:config.key,Authorization:authorization},signal:AbortSignal.timeout(5000)});
  if(!user.ok)return false;const data=await user.json();
  if(typeof data.id!=='string'||!/^[a-f0-9-]{36}$/.test(data.id))return false;
  const roles=await reservationDb('profiles?select=role&id=eq.'+data.id);
  return ['admin','editor','moderator'].includes(roles[0]?.role);
 }catch{return false;}
}
export async function processReservationNotifications(bookingId?:string){
 if(!emailConfigured())return {sent:0,failed:0,configured:false};
 const jobs=await reservationDb('rpc/claim_restaurant_notifications',{p_booking_id:bookingId??null});
 let sent=0,failed=0;
 for(const job of jobs){
  const cleanName=String(job.listing_name).replace(/[\r\n]/g,' ').slice(0,200);
  let accepted=false;
  try{
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'reservation-'+job.booking_id},body:JSON.stringify({from:process.env.RESERVATION_EMAIL_FROM,to:[supportEmail],subject:'Yeni restoran talebi · '+job.reference_code,text:`Yeni rezervasyon talebi: ${job.reference_code}\nRestoran: ${cleanName}\n\nYetkili paneli: https://www.safeinturkiye.com/#admin\nMüşteri iletişim bilgileri yalnız yetkili panelindedir.`}),signal:AbortSignal.timeout(7000)});
   accepted=response.ok&&typeof (await response.json()).id==='string';
  }catch{/* Keep the durable job retryable. Never log email payload or keys. */}
  await reservationDb(`reservation_notifications?id=eq.${job.id}&lease_id=eq.${job.lease_id}&state=eq.PROCESSING`,{state:accepted?'SENT':'FAILED',available_at:new Date(Date.now()+10*60000).toISOString(),...(accepted?{sent_at:new Date().toISOString()}:{} )},'PATCH');
  if(accepted)sent++;else failed++;
 }
 return {sent,failed,configured:true};
}
export const receiptHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export function validateGuestRequest(input:any){
 const string=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!Array.from(v).some(ch=>ch.charCodeAt(0)<32);
 if(!input||!string(input.name,100)||!string(input.listing,200)||!string(input.email,254)||!/^\S+@[^\s@]+\.[^\s@]+$/.test(input.email)||!/^\+?[\d ()-]{5,40}$/.test(input.phone??'')||!Number.isInteger(input.guests)||input.guests<1||input.guests>20||!input.time||!validBookingTime(input.date,input.time)||Date.parse(input.date)>Date.now()+366*86400000)return false;
 if(typeof input.notes!=='string'||input.notes.length>1000||typeof input.source!=='string'||input.source.length>1000)return false;
 try{const url=new URL(input.source);if(url.protocol!=='https:'||url.username||url.password)return false;}catch{return false;}
 return /^[a-f0-9-]{36}$/.test(input.requestId??'')&&/^[a-f0-9]{64}$/.test(input.receiptToken??'');
}
export function clientLimitHash(req:ReservationHttpRequest){return createHmac('sha256',reservationBackend()!.key).update(String(req.headers['x-vercel-forwarded-for']??req.headers['x-forwarded-for']??'unknown').split(',')[0].trim()).digest('hex');}
const limits=new Map<string,{until:number;count:number}>();
export function withinReservationBudget(req:ReservationHttpRequest){
 const now=Date.now();for(const [key,value]of limits)if(value.until<=now)limits.delete(key);
 const key=clientLimitHash(req),row=limits.get(key);
 if(limits.size>=2000||(row&&row.count>=60))return false;
 limits.set(key,{until:row?.until??now+60000,count:(row?.count??0)+1});return true;
}
