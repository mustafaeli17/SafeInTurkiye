import {useRef,useState} from 'react';
import {requireSupabase} from '../lib/supabase';
import {safeWebsite,safeTelephone} from '../services/nearbyPlaces';
type Info={name:string;city?:string;address?:string;phone?:string;website?:string;map?:string;provider:string;attributions?:{provider?:string;providerUri?:string}[]};
export default function AdminBusinessInfo({businessKey,source}:{businessKey?:string;source?:string}){
 const [info,setInfo]=useState<Info|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);
 async function load(){if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{const {data}=await requireSupabase().auth.getSession();if(!data.session)throw Error();
   const response=await fetch('/api/admin-business',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({key:businessKey,source}),signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error();const result=await response.json();if(typeof result.name!=='string')throw Error();setInfo(result);
  }catch{setError('İşletme bilgisi alınamadı. Eski kayıtta yer kimliği bulunmayabilir; kaynak bağlantısını kullanın.');}finally{lock.current=false;setBusy(false);}
 }
 const phone=safeTelephone(info?.phone),website=safeWebsite(info?.website),map=safeWebsite(info?.map);
 return <div className="my-2 text-sm space-y-2"><button className="admin-button min-h-11" disabled={busy} onClick={()=>void load()}>{busy?'Yükleniyor…':info?'İşletme bilgisini yenile':'İşletme adı ve iletişim bilgilerini getir'}</button>{error&&<p role="status">{error}</p>}{info&&<div className="rounded-xl border p-3 space-y-2"><strong>{info.name}{info.city?' · '+info.city:''}</strong>{info.address&&<p>{info.address}</p>}<div className="flex flex-wrap gap-3">{phone&&<a className="min-h-11 inline-flex items-center underline" href={phone.telephoneUrl}>İşletme telefonu: {phone.phone}</a>}{website&&<a className="min-h-11 inline-flex items-center underline" href={website} target="_blank" rel="noopener noreferrer">İşletme web sitesi ↗</a>}{map&&<a className="min-h-11 inline-flex items-center underline" href={map} target="_blank" rel="noopener noreferrer">Google Maps ↗</a>}</div><p className="text-xs">{info.provider} · Açık ekranda güncel olarak alındı.</p>{info.attributions?.map((a,i)=><p key={i}>{safeWebsite(a.providerUri)?<a href={safeWebsite(a.providerUri)!} target="_blank" rel="noopener noreferrer">{a.provider}</a>:a.provider}</p>)}</div>}</div>;
}
