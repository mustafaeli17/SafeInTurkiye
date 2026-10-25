export interface GuestReservation {name:string;email:string;phone:string;date:string;time:string;guests:number;notes:string;listing:string;source:string;requestId:string;receiptToken:string}
export function newReceipt(){return {requestId:crypto.randomUUID(),receiptToken:Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('')};}
export type SavedReceipt={requestId:string;receiptToken:string;reference:string;expires:number};
export function readReceipt(key:string):SavedReceipt|null{try{const value=JSON.parse(sessionStorage.getItem('sit:request:'+key)??'null');return value&&/^[a-f0-9-]{36}$/.test(value.requestId)&&/^[a-f0-9]{64}$/.test(value.receiptToken)&&/^SIT-[A-Z0-9-]{1,40}$/.test(value.reference)&&Number.isFinite(value.expires)&&value.expires>Date.now()&&value.expires<=Date.now()+7*86400000?value:null;}catch{return null;}}
export function saveReceipt(key:string,receipt:SavedReceipt){try{sessionStorage.setItem('sit:request:'+key,JSON.stringify(receipt));}catch{/* In-memory receipt remains usable if tab storage is blocked. */}}
export async function reservationCall(body:unknown){
 const response=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
 const data=await response.json().catch(()=>null);
 if(!response.ok||!data)throw new Error('REQUEST_UNAVAILABLE');
 return data;
}
