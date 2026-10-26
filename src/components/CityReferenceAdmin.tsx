import {useEffect,useState} from 'react';
import {requireSupabase} from '../lib/supabase';
import {publicCities} from '../lib/publicRoutes';
type City={id:string;name:string;slug:string;active:boolean;status:string;updated_at:string};
export default function CityReferenceAdmin({role}:{role:string}){
 const [rows,setRows]=useState<City[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const writable=['admin','editor'].includes(role);
 async function load(){setBusy(true);setError('');try{const result=await requireSupabase().from('cities').select('id,name,slug,active,status,updated_at').order('name').abortSignal(AbortSignal.timeout(12000));if(result.error)throw Error();setRows(result.data??[]);}catch{setError('Şehir kayıtları alınamadı. Tekrar deneyin.');}finally{setBusy(false);}}
 useEffect(()=>{void load();},[]);
 async function save(slug:string){
  if(busy||!writable)return;const destination=publicCities.find(city=>city.slug===slug);if(!destination)return;
  const existing=rows.find(city=>city.slug===slug||city.name===destination.name);
  setBusy(true);setError('');setMessage('');
  try{const client=requireSupabase();const result=existing?await client.from('cities').update({active:true,status:'PUBLISHED'}).eq('id',existing.id).eq('updated_at',existing.updated_at).select('id').single():await client.from('cities').insert({name:destination.name,slug:destination.slug,status:'PUBLISHED',active:true}).select('id').single();if(result.error||!result.data)throw Error();await load();setMessage('Şehir referansı hazır. İşletme formunda bu şehri seçebilirsiniz.');}catch{setError('Şehir kaydedilemedi veya başka oturumda değişti. Yenileyip tekrar deneyin.');}finally{setBusy(false);}
 }
 return <section className="admin-panel"><div className="admin-section-heading"><div><h2>Şehir referansları</h2><p>Sitedeki mevcut destinasyonları işletme kayıtlarıyla ilişkilendirin. Bu işlem yeni şehir sayfası veya içerik üretmez.</p></div><button className="admin-button" disabled={busy} onClick={()=>void load()}>Yenile</button></div>{error&&<p role="alert" className="admin-error">{error}</p>}{message&&<p role="status" className="admin-success">{message}</p>}<div className="grid gap-3 sm:grid-cols-2">{publicCities.map(destination=>{const city=rows.find(row=>row.slug===destination.slug||row.name===destination.name),ready=city?.active&&city.status==='PUBLISHED';return <article className="rounded-xl border border-sky-100 p-4" key={destination.slug}><h3>{destination.name}</h3><p>{ready?'İşletme yayını için hazır':city?'Referans var; aktif ve yayında değil':'Veritabanı referansı eksik'}</p>{!ready&&<button className="admin-button" disabled={busy||!writable} onClick={()=>void save(destination.slug)}>{city?'Referansı yayına hazırla':'Şehir referansını oluştur'}</button>}</article>;})}</div></section>;
}
