import {useEffect,useState} from 'react';
import {ExternalLink,RotateCw} from 'lucide-react';
import {restaurantRequestsEnabled} from '../lib/reservationAvailability';
import {foundationEnabled} from '../lib/foundationConfig';

type Health='checking'|'open'|'closed'|'unavailable';
const label:Record<Health,string>={
  checking:'Kontrol ediliyor…',open:'Talep kabulüne hazır',closed:'Talep alımı kapalı',unavailable:'Sunucu yanıtı doğrulanamadı',
};

export default function AdminSystemStatus(){
  const [health,setHealth]=useState<Health>('checking');
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    async function check(){
      try{
        const response=await fetch('/api/reservations',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10000)])});
        if(!response.ok)throw Error('unavailable');
        const data=await response.json();
        if(typeof data?.enabled!=='boolean')throw Error('invalid_readiness');
        if(!controller.signal.aborted)setHealth(data.enabled?'open':'closed');
      }catch{if(!controller.signal.aborted)setHealth('unavailable');}
    }
    void check();
    return ()=>controller.abort();
  },[attempt]);
  return <section className="admin-panel admin-system">
    <div className="admin-section-heading"><h2>Sistem ve yayın</h2>
      <button type="button" className="admin-button" disabled={health==='checking'} onClick={()=>{setHealth('checking');setAttempt(n=>n+1);}}><RotateCw size={16}/>Durumu kontrol et</button>
    </div>
    <dl>
      <div><dt>Rezervasyon formu</dt><dd>{restaurantRequestsEnabled?'Etkin':'Kapalı'}</dd></div>
      <div><dt>Rezervasyon sunucusu</dt><dd role="status">{label[health]}</dd></div>
      <div><dt>Sponsor yönetimi</dt><dd>{foundationEnabled?'Etkin':'Kapalı'}</dd></div>
      <div><dt>İçerik yayını</dt><dd>İşletme kayıtları CMS’te saklanır. Site haritası bir sonraki site yayınında güncellenir.</dd></div>
    </dl>
    <a className="admin-button mt-4" href="https://vercel.com/eli-1196/safe-in-turkiye" target="_blank" rel="noopener noreferrer">Vercel yayınları <ExternalLink size={15}/></a>
  </section>;
}
