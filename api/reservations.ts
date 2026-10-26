import {clientLimitHash,emailConfigured,processReservationNotifications,receiptHash,reservationBackend,reservationDb,reservationOrigin,reservationSchemaReady,reservationStaff,validateGuestRequest,withinReservationBudget} from '../server/restaurantRequests.js';
import type {ReservationHttpRequest,ReservationHttpResponse} from '../server/restaurantRequests.js';
let readiness:{until:number;enabled:boolean}|undefined;
export default async function handler(req:ReservationHttpRequest,res:ReservationHttpResponse){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET'){
  if(process.env.RESERVATIONS_ENABLED!=='true'||!reservationBackend()||!emailConfigured()){
   console.warn('reservation_readiness_config',{enabled:process.env.RESERVATIONS_ENABLED==='true',backend:Boolean(reservationBackend()),email:emailConfigured()});
   return res.status(200).json({enabled:false});
  }
  if(!readiness||readiness.until<Date.now())readiness={until:Date.now()+30000,enabled:await reservationSchemaReady()};
  return res.status(200).json({enabled:readiness.enabled});
 }
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 if(!reservationOrigin(req))return res.status(403).json({error:'NOT_ALLOWED'});
 if(!reservationBackend())return res.status(503).json({error:'UNAVAILABLE'});
 if(!withinReservationBudget(req))return res.status(429).json({error:'BUSY'});
 let input:any;try{input=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!input||JSON.stringify(input).length>6500)throw Error();}catch{return res.status(400).json({error:'INVALID_INPUT'});}
 try{
  if(input.action==='notifications'){
   if(!await reservationStaff(req))return res.status(403).json({error:'NOT_ALLOWED'});
   return res.status(200).json(await processReservationNotifications());
  }
  if(input.action==='status'){
   if(!/^[a-f0-9-]{36}$/.test(input.requestId??'')||!/^[a-f0-9]{64}$/.test(input.receiptToken??''))return res.status(404).json({error:'NOT_FOUND'});
   const rows=await reservationDb(`bookings?select=status&request_id=eq.${input.requestId}&receipt_hash=eq.${receiptHash(input.receiptToken)}&listing_type=eq.restaurant&created_at=gte.${encodeURIComponent(new Date(Date.now()-7*86400000).toISOString())}&limit=1`);
   if(!rows[0])return res.status(404).json({error:'NOT_FOUND'});
   return res.status(200).json({status:rows[0].status});
  }
  if(input.action!=='create'||!validateGuestRequest(input)||input.website)return res.status(400).json({error:'INVALID_INPUT'});
  if(process.env.RESERVATIONS_ENABLED!=='true'||!emailConfigured()||!await reservationSchemaReady())return res.status(503).json({error:'UNAVAILABLE'});
  const rows=await reservationDb('rpc/submit_restaurant_request',{p_request_id:input.requestId,p_receipt_hash:receiptHash(input.receiptToken),p_client_hash:clientLimitHash(req),p_listing:input.listing,p_name:input.name,p_email:input.email,p_phone:input.phone,p_date:input.date,p_time:input.time,p_guests:input.guests,p_notes:JSON.stringify({source:input.source,notes:input.notes})});
  if(!rows[0]?.reference_code)throw Error('UNAVAILABLE');
  const visits=await reservationDb(`bookings?select=listing_name,visit_date,visit_time,guest_count&request_id=eq.${input.requestId}&receipt_hash=eq.${receiptHash(input.receiptToken)}&limit=1`);
  const visit=visits[0];if(!visit||typeof visit.listing_name!=='string'||typeof visit.visit_date!=='string'||typeof visit.visit_time!=='string'||!Number.isInteger(visit.guest_count))throw Error('UNAVAILABLE');
  const summary={listing:visit.listing_name,date:visit.visit_date.slice(0,10),time:visit.visit_time.slice(0,5),guests:visit.guest_count};
  // Booking + queue commit atomically. Email failure must not discard a saved request.
  let notificationQueued=true;try{const result=await processReservationNotifications(rows[0].id);notificationQueued=result.failed>0;}catch{/* Retried by worker/admin. */}
  return res.status(200).json({reference:rows[0].reference_code,status:rows[0].status,notificationQueued,summary});
 }catch(error){return res.status(error instanceof Error&&error.message==='RATE_LIMIT'?429:503).json({error:error instanceof Error&&error.message==='RATE_LIMIT'?'BUSY':'UNAVAILABLE'});}
}
