// Personal form fields live in memory only. Never serialize into URLs/storage/analytics.
export type ReservationDraft={name:string;email:string;phone:string;date:string;time:string;guests:string;notes:string};
const empty=():ReservationDraft=>({name:'',email:'',phone:'',date:'',time:'',guests:'2',notes:''});
const drafts=new Map<string,{value:ReservationDraft;until:number}>();
const attempts=new Map<string,{requestId:string;receiptToken:string}>();
export function reservationAttempt(key:string,create:()=>{requestId:string;receiptToken:string}){
 let attempt=attempts.get(key);if(!attempt){attempt=create();attempts.set(key,attempt);}return attempt;
}
export function readReservationDraft(key:string,now=Date.now()):ReservationDraft{
 for(const [id,row]of drafts)if(row.until<=now)drafts.delete(id);
 return {...(drafts.get(key)?.value??empty())};
}
export function writeReservationDraft(key:string,value:ReservationDraft,now=Date.now()){
 if(!drafts.has(key)&&drafts.size>=20)drafts.delete(drafts.keys().next().value!);
 drafts.set(key,{value:{...value},until:now+30*60000});
}
export function clearReservationDraft(key:string){drafts.delete(key);attempts.delete(key);}
