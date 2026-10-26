import {Webhook} from 'svix';
import {reservationDb,reservationBackend} from '../server/restaurantRequests.js';
const states:Record<string,string>={'email.delivery_delayed':'DELAYED','email.delivered':'DELIVERED','email.failed':'FAILED','email.bounced':'BOUNCED','email.complained':'COMPLAINED'};
const reply=(status:number,ok=false)=>Response.json({ok},{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request){
 const secret=process.env.RESEND_WEBHOOK_SECRET;if(!secret)return reply(503);
 // Do not parse/re-serialize before verification; signatures cover exact bytes.
 let payload:string;
 try{const reader=request.body?.getReader();if(!reader)return reply(400);const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();return reply(413);}chunks.push(value);}
  payload=Buffer.concat(chunks).toString('utf8');
 }catch{console.warn('reservation_delivery_rejected',{stage:'body'});return reply(400);}
 let event:any;
 try{new Webhook(secret).verify(payload,{'svix-id':request.headers.get('svix-id')??'','svix-timestamp':request.headers.get('svix-timestamp')??'','svix-signature':request.headers.get('svix-signature')??''});event=JSON.parse(payload);}catch{console.warn('reservation_delivery_rejected',{stage:'signature',secretFormatValid:secret.startsWith('whsec_'),headersPresent:['svix-id','svix-timestamp','svix-signature'].every(name=>Boolean(request.headers.get(name)))});return reply(400);}
 const state=states[event?.type];if(!state)return reply(200,true);
 const backend=reservationBackend();if(!backend)return reply(503);
 // A shared Resend account can send production and test mail. Never mix them.
 if(event.data?.tags?.sit_project!==new URL(backend.url).hostname.split('.')[0])return reply(200,true);
 if(typeof event.data?.email_id!=='string'||!/^[a-f0-9-]{36}$/.test(event.data.email_id)||typeof event.created_at!=='string'||!Number.isFinite(Date.parse(event.created_at)))return reply(400);
 try{
  const applied=await reservationDb('rpc/record_reservation_delivery',{p_email_id:event.data.email_id,p_state:state,p_event_at:new Date(event.created_at).toISOString()});
  // Provider may deliver before the sender saved its ID. Non-2xx requests a retry.
  return reply(applied===true?200:503,applied===true);
 }catch{return reply(503);}
}
