import {timingSafeEqual} from 'node:crypto';
import {processReservationNotifications} from '../server/restaurantRequests.ts';
import type {ReservationHttpRequest,ReservationHttpResponse} from '../server/restaurantRequests.ts';
export default async function handler(req:ReservationHttpRequest,res:ReservationHttpResponse){
 res.setHeader('Cache-Control','private, no-store');
 const expected=process.env.CRON_SECRET?'Bearer '+process.env.CRON_SECRET:'',given=String(req.headers.authorization??'');
 if(req.method!=='GET'||!expected||expected.length!==given.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(given)))return res.status(403).json({error:'NOT_ALLOWED'});
 try{return res.status(200).json(await processReservationNotifications());}catch{return res.status(503).json({error:'UNAVAILABLE'});}
}
