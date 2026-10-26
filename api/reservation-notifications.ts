import {timingSafeEqual} from 'node:crypto';
import {processReservationNotifications,reservationDb} from '../server/restaurantRequests.js';
import type {ReservationHttpRequest,ReservationHttpResponse} from '../server/restaurantRequests.js';
export default async function handler(req:ReservationHttpRequest,res:ReservationHttpResponse){
 res.setHeader('Cache-Control','private, no-store');
 const expected=process.env.CRON_SECRET?'Bearer '+process.env.CRON_SECRET:'',given=String(req.headers.authorization??'');
 const expectedBytes=Buffer.from(expected),givenBytes=Buffer.from(given);
 if(req.method!=='GET'||!expected||expectedBytes.length!==givenBytes.length||!timingSafeEqual(expectedBytes,givenBytes))return res.status(403).json({error:'NOT_ALLOWED'});
 try{
  const notifications=await processReservationNotifications();
  const anonymized=await reservationDb('rpc/anonymize_expired_restaurant_requests',{});
  return res.status(200).json({...notifications,anonymized});
 }catch{return res.status(503).json({error:'UNAVAILABLE'});}
}
