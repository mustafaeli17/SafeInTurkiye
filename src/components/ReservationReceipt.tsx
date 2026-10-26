import {useEffect,useState} from 'react';
import {reservationCall} from '../lib/reservationClient';
import {customerStatusIndex,receiptCopy} from '../lib/reservationReceiptCopy';
import {reservationExperienceCopy} from '../lib/reservationExperienceCopy';
import {supportEmail} from '../lib/siteOperator';
import {restaurantRequestCopy} from '../lib/restaurantRequestCopy';
import type {SavedReceipt} from '../lib/reservationClient';
export default function ReservationReceipt({requestId,receiptToken,reference,summary,lang}:SavedReceipt&{lang:string}){
 const [status,setStatus]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 const t=receiptCopy[lang]??receiptCopy.en;
 const x=reservationExperienceCopy[lang]??reservationExperienceCopy.en;
 const formCopy=restaurantRequestCopy[lang]??restaurantRequestCopy.en;
 useEffect(()=>{let active=true;void reservationCall({action:'status',requestId,receiptToken}).then(data=>{if(!['PENDING','CONFIRMED','REJECTED','CANCELLED'].includes(data.status))throw Error();if(active)setStatus(data.status);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'REQUEST_UNAVAILABLE');});return()=>{active=false;};},[requestId,receiptToken]);
 async function refresh(){if(busy)return;setBusy(true);setError('');try{const data=await reservationCall({action:'status',requestId,receiptToken});if(!['PENDING','CONFIRMED','REJECTED','CANCELLED'].includes(data.status))throw Error();setStatus(data.status);}catch(e){setError(e instanceof Error?e.message:'REQUEST_UNAVAILABLE');}finally{setBusy(false);}}
 async function copy(){try{await navigator.clipboard.writeText(reference);setCopied(true);}catch{setCopied(false);}}
 const date=summary&&/^\d{4}-\d{2}-\d{2}$/.test(summary.date)&&/^\d{2}:\d{2}$/.test(summary.time)?new Date(`${summary.date}T${summary.time}:00+03:00`):null;
 return <section dir={lang==='ar'?'rtl':'ltr'} className="mt-4 min-w-0 rounded-2xl border border-sky-100 bg-sky-50 p-5 space-y-3"><p role="status" className="font-bold text-lg">{error?error==='REQUEST_NOT_FOUND'?x[12]:t[6]:status?t[customerStatusIndex(status)]:x[11]}</p><p className="text-sm break-all"><bdi>{reference}</bdi></p>{summary&&<div className="text-sm space-y-1"><p className="font-semibold break-words">{summary.listing}{summary.city?` · ${summary.city}`:''}</p>{date&&Number.isFinite(date.getTime())&&<p>{new Intl.DateTimeFormat(lang,{timeZone:'Europe/Istanbul',dateStyle:'medium',timeStyle:'short'}).format(date)} · {formCopy[7]}: {new Intl.NumberFormat(lang).format(summary.guests)} · {x[2]}</p>}</div>}{status==='PENDING'&&!error&&<p className="text-sm text-slate-600">{t[5]}</p>}<div className="flex flex-wrap gap-2"><button type="button" onClick={()=>void refresh()} disabled={busy} className="min-h-11 rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold">{busy?'…':t[4]}</button><button type="button" onClick={()=>void copy()} className="min-h-11 rounded-xl border border-sky-200 bg-white px-4 text-sm">{copied?x[7]:x[6]}</button></div><p className="text-xs text-slate-600">{x[8]}</p><p className="text-xs text-slate-600">{x[9]} <a className="underline text-blue-700" href={`mailto:${supportEmail}?subject=${encodeURIComponent(reference)}`}>{x[10]}</a></p></section>;
}
