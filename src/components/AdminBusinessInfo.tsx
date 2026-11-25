import {useEffect,useState} from 'react';
import {ExternalLink,Phone} from 'lucide-react';
import {requireSupabase} from '../lib/supabase';
import {safeWebsite,safeTelephone} from '../services/nearbyPlaces';

type Info={name:string;city?:string;address?:string;phone?:string;website?:string;map?:string;provider:string;attributions?:{provider?:string;providerUri?:string}[]};
type Lookup={version:number;kind:'ready';info:Info}|{version:number;kind:'missing'|'error'};

export default function AdminBusinessInfo({businessKey,source,name,autoLoad=false}:{businessKey?:string;source?:string;name?:string;autoLoad?:boolean}){
 const link=safeWebsite(source);
 const canLookUp=Boolean(businessKey||link);
 const [version,setVersion]=useState(autoLoad&&canLookUp?1:0);
 const [result,setResult]=useState<Lookup|null>(null);
 const busy=version>0&&result?.version!==version;
 useEffect(()=>{
  if(!version||!canLookUp)return;
  const abort=new AbortController();
  async function load(){
   try{
    const {data}=await requireSupabase().auth.getSession();
    if(abort.signal.aborted)return;
    if(!data.session)throw Error('NO_SESSION');
    const response=await fetch('/api/admin-business',{method:'POST',cache:'no-store',
     headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},
     body:JSON.stringify({key:businessKey,source}),signal:AbortSignal.any([abort.signal,AbortSignal.timeout(12000)])});
    if(response.status===404){if(!abort.signal.aborted)setResult({version,kind:'missing'});return;}
    if(!response.ok)throw Error('UNAVAILABLE');
    const info:Info=await response.json();
    if(typeof info.name!=='string')throw Error('INVALID_CONTACT');
    if(!abort.signal.aborted)setResult({version,kind:'ready',info});
   }catch{if(!abort.signal.aborted)setResult({version,kind:'error'});}
  }
  void load();
  return ()=>abort.abort();
 },[version,businessKey,source,canLookUp]);
 const info=result?.kind==='ready'&&result.version===version?result.info:null;
 const phone=safeTelephone(info?.phone),website=safeWebsite(info?.website),map=safeWebsite(info?.map);
 const mapName=info?.name||name;
 const mapSearch=mapName?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([mapName,info?.city,'Türkiye'].filter(Boolean).join(', ')):null;
 const subject=name?'Restoran':'İşletme';
 return <div className="booking-contact">
  {canLookUp&&!info&&<button className="admin-button admin-primary" disabled={busy} onClick={()=>setVersion(v=>v+1)}><Phone size={17}/>{busy?subject+' telefonu alınıyor…':version?'Telefonu tekrar sorgula':subject+' telefonunu getir'}</button>}
  {phone&&<a className="admin-button admin-primary" href={phone.telephoneUrl}><Phone size={17}/>{name?'Restoranı ara':'İşletmeyi ara'} <bdi>{phone.phone}</bdi></a>}
  {!busy&&(info||!canLookUp||result)&&!phone&&<p role="status">{result?.kind==='error'?'İletişim bilgileri şu anda alınamadı.':'Bu kayıt için '+subject.toLocaleLowerCase('tr')+' telefonu bulunamadı.'}</p>}
  {!busy&&(info||!canLookUp||result)&&<div className="booking-contact-links">
   {website&&<a href={website} target="_blank" rel="noopener noreferrer">{subject} sitesi <ExternalLink size={13}/></a>}
   {link&&link!==website&&link!==map&&<a href={link} target="_blank" rel="noopener noreferrer">Kaynağı aç <ExternalLink size={13}/></a>}
   {(map||(!phone&&mapSearch))&&<a href={map??mapSearch!} target="_blank" rel="noopener noreferrer">{map?'Haritada aç':name?'Haritada restoranı ara':'Haritada işletmeyi ara'} <ExternalLink size={13}/></a>}
  </div>}
  {info&&<div className="booking-provider"><span>{info.provider} · {info.name}{info.city?' · '+info.city:''}{info.address?' · '+info.address:''}</span>{info.attributions?.map((a,i)=><span key={i}>{safeWebsite(a.providerUri)?<a href={safeWebsite(a.providerUri)!} target="_blank" rel="noopener noreferrer">{a.provider}</a>:a.provider}</span>)}{!name&&<button className="admin-button" onClick={()=>setVersion(v=>v+1)}>İletişim bilgilerini yenile</button>}</div>}
 </div>;
}
