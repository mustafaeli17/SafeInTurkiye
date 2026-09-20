import { useState } from 'react';
import photos from '../lib/placePhotos.json';
const labels: Record<string,string> = {tr:'Fotoğraf resmî sitede',en:'Photos on official site',de:'Fotos auf offizieller Website',fr:'Photos sur le site officiel',ar:'الصور على الموقع الرسمي',ru:'Фото на официальном сайте',zh:'照片请见官网'};
const names: Record<string,string> = {izmir:'İzmir — Saat Kulesi',ankara:'Ankara — Anıtkabir',antalya:'Antalya — Kaleiçi',h2:'Swissôtel Büyük Efes',h3:'Çırağan Palace',a1:'Göreme Open Air Museum',a2:'Anadolu Medeniyetleri Müzesi',a3:'Topkapı Palace',modern:'İstanbul Modern',erciyes:'Erciyes'};
export default function PlacePhoto({id,name,lang='en'}:{id:string;name:string;lang?:string}) {
 const photo=photos[id as keyof typeof photos];
 const [failed,setFailed]=useState(false);
 if(!photo || failed) return <div className="place-photo-missing"><span aria-hidden="true">▧</span><small>{labels[lang]||labels.en}</small></div>;
 return <img src={photo.src} alt={name} loading="lazy" decoding="async" onError={()=>setFailed(true)} className="place-photo-image" />;
}
export function PhotoCredits(){
 return <details className="mt-3"><summary className="cursor-pointer">📷 Photo credits / Fotoğraf kaynakları</summary><ul className="mt-2 space-y-1">{Object.entries(photos).map(([id,p])=><li key={id}><a href={p.source} target="_blank" rel="noreferrer" className="underline">{names[id]} — {id==='h3'?'Wolfgang Moroder':p.author}</a> · <a href={p.licenseUrl} target="_blank" rel="noreferrer">{p.license}</a></li>)}</ul><p>Display framing only; source photographs are not retouched. / Fotoğraflara rötuş uygulanmadı.</p></details>;
}
