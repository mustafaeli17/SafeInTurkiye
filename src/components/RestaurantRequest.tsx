import {useEffect,useRef,useState} from 'react';
import {siteInformation} from '../lib/siteInformation';
import {restaurantToday,validBookingTime} from '../lib/bookingTime';
import {clearReservationDraft,readReservationDraft,reservationAttempt,writeReservationDraft} from '../lib/reservationDraft';
import {reservationExperienceCopy} from '../lib/reservationExperienceCopy';
import {restaurantRequestsEnabled,reservationUnavailable} from '../lib/reservationAvailability';
import {restaurantRequestCopy} from '../lib/restaurantRequestCopy';
import {makeSavedReceipt,newReceipt,pendingReceipt,readReceipt,receiptWasExpired,reservationCall,saveReceipt} from '../lib/reservationClient';
import {supportEmail} from '../lib/siteOperator';
import type {SavedReceipt} from '../lib/reservationClient';
import {receiptCopy,reservationIntro,requestRetryCopy} from '../lib/reservationReceiptCopy';
import ReservationReceipt from './ReservationReceipt';
import {trackBusinessEvent} from '../lib/businessEvents';

type Props={name:string;source:string;lang:string;businessKey?:string;city?:string};
export default function RestaurantRequest(props:Props){return <RequestForm key={props.businessKey??props.source+props.name} {...props}/>;}
function RequestForm({name,source,lang,businessKey,city}:Props){
 const t=restaurantRequestCopy[lang]??restaurantRequestCopy.en;
 const copy=receiptCopy[lang]??receiptCopy.en,key=businessKey??source+name;
 const experience=reservationExperienceCopy[lang]??reservationExperienceCopy.en;
 const [draft,setDraft]=useState(()=>readReservationDraft(key));
 function change(field:string,value:string){setDraft(old=>{const next={...old,[field]:value};writeReservationDraft(key,next);return next;});setMessage(null);}
 const [expiredReceipt]=useState(()=>receiptWasExpired(key));
 const [receipt,setReceipt]=useState<SavedReceipt|null>(()=>readReceipt(key));
 const [ready,setReady]=useState(false),[checking,setChecking]=useState(restaurantRequestsEnabled);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState<number|null>(null);
 const submitting=useRef(false),credentials=useRef<ReturnType<typeof newReceipt>|null>(null),started=useRef(false);
 useEffect(()=>{
  if(!restaurantRequestsEnabled||receipt){setChecking(false);return;}
  const controller=new AbortController();
  void fetch('/api/reservations',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10000)])}).then(r=>r.ok?r.json():null).then(data=>{if(!controller.signal.aborted)setReady(data?.enabled===true);}).catch(()=>{}).finally(()=>{if(!controller.signal.aborted)setChecking(false);});
  return()=>controller.abort();
 },[receipt]);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!ready||submitting.current||receipt)return;
  const form=event.currentTarget,data=new FormData(form);
  if(!validBookingTime(String(data.get('date')),String(data.get('time')))){setMessage(10);return;}
  credentials.current??=reservationAttempt(key,()=>pendingReceipt(key));submitting.current=true;setBusy(true);setMessage(null);
  try{
   const result=await reservationCall({action:'create',...credentials.current,listing:name,source,name:String(data.get('name')).trim(),email:String(data.get('email')).trim(),phone:String(data.get('phone')).trim(),date:String(data.get('date')),time:String(data.get('time')),guests:Number(data.get('guests')),notes:String(data.get('notes')??''),website:String(data.get('website')??'')});
   if(typeof result.reference!=='string'||!/^SIT-[A-Z0-9-]{1,40}$/.test(result.reference))throw Error();
   const visit=result.summary;
   if(!visit||typeof visit.listing!=='string'||typeof visit.date!=='string'||typeof visit.time!=='string'||!Number.isInteger(visit.guests))throw Error();
   const saved=makeSavedReceipt(credentials.current,result.reference,visit);
   saveReceipt(key,saved);setReceipt(saved);clearReservationDraft(key);
   if(businessKey)trackBusinessEvent(businessKey,'reservation_submitted');
  }catch{setMessage(12);}finally{submitting.current=false;setBusy(false);}
 }
 if(receipt)return <ReservationReceipt {...receipt} lang={lang}/>;
 if(checking)return <p role="status" className="mt-4 text-sm">…</p>;
 if(!restaurantRequestsEnabled||!ready)return <p className="mt-4 text-sm text-slate-600">{reservationUnavailable[lang]??reservationUnavailable.en}</p>;
 const fields=[['name',t[2],'text'],['email',t[3],'email'],['phone',t[4],'tel'],['date',t[5],'date'],['time',t[6],'time'],['guests',t[7],'number']];
 return <form onInput={event=>{const field=event.target as HTMLInputElement;if(field.name in draft)change(field.name,field.value);}} onInvalid={event=>{const field=event.target as HTMLInputElement;if(['date','time'].includes(field.name)&&draft.date&&draft.time&&!validBookingTime(draft.date,draft.time))setMessage(10);}} onFocus={()=>{if(!started.current&&businessKey){started.current=true;trackBusinessEvent(businessKey,'reservation_started');}}} lang={lang} dir={lang==='ar'?'rtl':'ltr'} onSubmit={submit} className="mt-5 rounded-2xl border border-sky-100 bg-white p-5 space-y-4">
  <h4 className="font-bold text-lg">{t[0]}</h4><p className="font-semibold break-words">{name}{city?` · ${city}`:''}</p><p className="text-sm text-slate-600">{reservationIntro[lang]??reservationIntro.en}</p>
  {expiredReceipt&&<p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">{experience[12]} <a href={`mailto:${supportEmail}`} className="underline">{experience[10]}</a></p>}
  <details className="text-sm text-slate-600"><summary className="min-h-11 cursor-pointer">{experience[0]}</summary><p>{experience[1]}</p></details>
  <div className="grid sm:grid-cols-2 gap-3">{fields.map(([field,label,type])=><label key={field} className="min-w-0 text-sm font-semibold">{label} <span aria-label={experience[5]}>*</span><input className="mt-1 block w-full min-w-0 min-h-11 rounded-xl border border-sky-100 p-3 font-normal" name={field} type={type} required maxLength={field==='name'?100:field==='phone'?40:254} min={field==='guests'?1:field==='date'?restaurantToday():undefined} max={field==='guests'?20:undefined} value={draft[field as keyof typeof draft]} onChange={e=>change(field,e.target.value)} aria-invalid={message===10&&['date','time'].includes(field)||undefined} aria-describedby={['date','time'].includes(field)?'request-time-help':undefined} autoComplete={field==='name'?'name':field==='email'?'email':field==='phone'?'tel':undefined}/>{field==='phone'&&<span className="block mt-1 text-xs font-normal text-slate-600">{experience[4]}</span>}</label>)}</div>
  <p id="request-time-help" className="text-xs text-slate-600">{experience[2]}</p>{message===10&&<p role="alert" className="text-sm text-red-700">{experience[3]}</p>}
  <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
  <label className="block text-sm font-semibold">{t[8]}<textarea name="notes" maxLength={1000} value={draft.notes} onChange={e=>change('notes',e.target.value)} className="mt-1 block w-full rounded-xl border border-sky-100 p-3 font-normal"/></label>
  <p className="text-xs text-slate-500">{copy[7]} <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">{(siteInformation[lang]??siteInformation.en).labels[0]}</a></p>
  <button disabled={busy} className="min-h-12 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-50">{busy?'…':t[9]}</button>
  {message!==null&&message!==10&&<p role="alert" className="text-sm text-red-700">{message===12?(requestRetryCopy[lang]??requestRetryCopy.en):t[message]}</p>}
 </form>;
}
