import {useEffect,useState} from 'react';
import {reservationCall} from '../lib/reservationClient';
import {customerStatusIndex,receiptCopy} from '../lib/reservationReceiptCopy';
export default function ReservationReceipt({requestId,receiptToken,reference,lang}:{requestId:string;receiptToken:string;reference:string;lang:string}){
 const [status,setStatus]=useState('PENDING'),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const t=receiptCopy[lang]??receiptCopy.en;
 useEffect(()=>{let active=true;void reservationCall({action:'status',requestId,receiptToken}).then(data=>{if(!['PENDING','CONFIRMED','REJECTED','CANCELLED'].includes(data.status))throw Error();if(active)setStatus(data.status);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[requestId,receiptToken]);
 async function refresh(){if(busy)return;setBusy(true);setError(false);try{const data=await reservationCall({action:'status',requestId,receiptToken});if(!['PENDING','CONFIRMED','REJECTED','CANCELLED'].includes(data.status))throw Error();setStatus(data.status);}catch{setError(true);}finally{setBusy(false);}}
 return <section dir={lang==='ar'?'rtl':'ltr'} className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-5 space-y-3"><p role="status" className="font-bold text-lg">{t[customerStatusIndex(status)]}</p><p className="text-sm"><bdi>{reference}</bdi></p>{status==='PENDING'&&<p className="text-sm text-slate-600">{t[5]}</p>}<button type="button" onClick={()=>void refresh()} disabled={busy} className="min-h-11 rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold">{busy?'…':t[4]}</button>{error&&<p role="alert" className="text-sm text-red-700">{t[6]}</p>}</section>;
}
