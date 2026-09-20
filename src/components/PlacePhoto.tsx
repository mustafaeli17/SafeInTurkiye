import { useState } from 'react';
import photos from '../lib/placePhotos.json';
const labels: Record<string,string> = {tr:'Mekân fotoğrafı henüz eklenmedi',en:'Venue photo not yet available',de:'Foto des Ortes noch nicht verfügbar',fr:'Photo du lieu pas encore disponible',ar:'صورة المكان غير متوفرة بعد',ru:'Фото места пока недоступно',zh:'暂无场所照片'};
const errorLabels: Record<string,string> = {tr:'Fotoğraf yüklenemedi',en:'Photo could not load',de:'Foto konnte nicht geladen werden',fr:'Impossible de charger la photo',ar:'تعذر تحميل الصورة',ru:'Не удалось загрузить фото',zh:'照片加载失败'};
const names: Record<string,string> = {izmir:'İzmir — Saat Kulesi',ankara:'Ankara — Anıtkabir',antalya:'Antalya — Kaleiçi',h2:'Swissôtel Büyük Efes',h3:'Çırağan Palace',a1:'Göreme Open Air Museum',a2:'Anadolu Medeniyetleri Müzesi',a3:'Topkapı Palace',modern:'İstanbul Modern',erciyes:'Erciyes'};
export default function PlacePhoto({id,name,lang='en'}:{id:string;name:string;lang?:string}) {
 const photo=photos[id as keyof typeof photos];
 const [failedSrc,setFailedSrc]=useState<string>();
 const failed=Boolean(photo && failedSrc===photo.src);
 if(!photo || failed) return <div className="place-photo-missing" role="status"><small>{failed ? (errorLabels[lang]||errorLabels.en) : (labels[lang]||labels.en)}</small></div>;
 return <img src={photo.src} alt={name} data-photo-id={id} loading="lazy" decoding="async" onError={()=>setFailedSrc(photo.src)} className="place-photo-image" />;
}
export function PhotoCredits(){
 return <details className="mt-3"><summary className="cursor-pointer">📷 Photo credits / Fotoğraf kaynakları</summary><ul className="mt-2 space-y-1">{Object.entries(photos).map(([id,p])=><li key={id}><a href={p.source} target="_blank" rel="noreferrer" className="underline">{names[id]} — {id==='h3'?'Wolfgang Moroder':p.author}</a> · <a href={p.licenseUrl} target="_blank" rel="noreferrer">{p.license}</a></li>)}</ul><p>Display framing only; source photographs are not retouched. / Fotoğraflara rötuş uygulanmadı.</p></details>;
}
