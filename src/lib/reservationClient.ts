export interface GuestReservation {name:string;email:string;phone:string;date:string;time:string;guests:number;notes:string;listing:string;source:string;requestId:string;receiptToken:string}
export function newReceipt():{requestId:string;receiptToken:string}{return {requestId:crypto.randomUUID(),receiptToken:Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('')};}
// Persist only opaque deduplication credentials, never the unsubmitted personal form.
export function pendingReceipt(key:string){
 try{const saved=JSON.parse(sessionStorage.getItem('sit:pending:'+key)??'null');if(saved&&/^[a-f0-9-]{36}$/.test(saved.requestId)&&/^[a-f0-9]{64}$/.test(saved.receiptToken)&&Number.isFinite(saved.expires)&&saved.expires>Date.now()&&saved.expires<=Date.now()+7*86400000)return {requestId:String(saved.requestId),receiptToken:String(saved.receiptToken)};}catch{/* Storage may be unavailable. */}
 const created=newReceipt();try{sessionStorage.setItem('sit:pending:'+key,JSON.stringify({...created,expires:Date.now()+7*86400000}));}catch{/* In-memory identity still prevents double clicks. */}return created;
}
export type SavedReceipt={requestId:string;receiptToken:string;reference:string;expires:number;summary?:{listing:string;city?:string;date:string;time:string;guests:number}};
export function makeSavedReceipt(credentials:{requestId:string;receiptToken:string},reference:string,summary:SavedReceipt['summary']):SavedReceipt{return {...credentials,reference,expires:Date.now()+7*86400000,summary};}
export function receiptWasExpired(key:string){try{const value=JSON.parse(sessionStorage.getItem('sit:request:'+key)??'null');return Boolean(value&&Number.isFinite(value.expires)&&value.expires<=Date.now());}catch{return false;}}
export function readReceipt(key:string):SavedReceipt|null{
 try{
  const value=JSON.parse(sessionStorage.getItem('sit:request:'+key)??'null');
  if(value&&Number.isFinite(value.expires)&&value.expires<=Date.now()){sessionStorage.removeItem('sit:request:'+key);return null;}
  if(!value||!/^[a-f0-9-]{36}$/.test(value.requestId)||!/^[a-f0-9]{64}$/.test(value.receiptToken)||!/^SIT-[A-Z0-9-]{1,40}$/.test(value.reference)||!Number.isFinite(value.expires)||value.expires>Date.now()+7*86400000)return null;
  const s=value.summary;
  const summary=s&&typeof s.listing==='string'&&s.listing.length<=200&&/^\\d{4}-\\d{2}-\\d{2}$/.test(s.date)&&/^([01]\\d|2[0-3]):[0-5]\\d$/.test(s.time)&&Number.isInteger(s.guests)&&s.guests>=1&&s.guests<=20?{listing:s.listing,date:s.date,time:s.time,guests:s.guests,...(typeof s.city==='string'&&s.city.length<100?{city:s.city}:{})}:undefined;
  return {requestId:value.requestId,receiptToken:value.receiptToken,reference:value.reference,expires:value.expires,summary};
 }catch{return null;}
}
export function saveReceipt(key:string,receipt:SavedReceipt){try{sessionStorage.setItem('sit:request:'+key,JSON.stringify(receipt));sessionStorage.removeItem('sit:pending:'+key);}catch{/* In-memory receipt remains usable if tab storage is blocked. */}}
export async function reservationCall(body:unknown){
 const response=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
 const data=await response.json().catch(()=>null);
 if(!response.ok||!data)throw new Error(response.status===404?'REQUEST_NOT_FOUND':'REQUEST_UNAVAILABLE');
 return data;
}
