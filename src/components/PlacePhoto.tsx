import { useState } from 'react';
import commonsPhotos from '../lib/placePhotos.json';
import officialPhotos from '../lib/officialPhotos.json';
import { Clapperboard } from 'lucide-react';
import { curatedDirectory } from '../lib/directory';
import { publishedPhoto,contextLabel,type DirectoryPhoto } from '../lib/directoryPhotos';
const photos = {...commonsPhotos,...officialPhotos};
const labels: Record<string,string> = {tr:'Mekân fotoğrafı henüz eklenmedi',en:'Venue photo not yet available',de:'Foto des Ortes noch nicht verfügbar',fr:'Photo du lieu pas encore disponible',ar:'صورة المكان غير متوفرة بعد',ru:'Фото места пока недоступно',zh:'暂无场所照片'};
const errorLabels: Record<string,string> = {tr:'Fotoğraf yüklenemedi',en:'Photo could not load',de:'Foto konnte nicht geladen werden',fr:'Impossible de charger la photo',ar:'تعذر تحميل الصورة',ru:'Не удалось загрузить фото',zh:'照片加载失败'};
const names: Record<string,string> = {izmir:'İzmir — Saat Kulesi',ankara:'Ankara — Anıtkabir',antalya:'Antalya — Kaleiçi',h2:'Swissôtel Büyük Efes',h3:'Çırağan Palace',a1:'Göreme Open Air Museum',a2:'Anadolu Medeniyetleri Müzesi',a3:'Topkapı Palace',modern:'İstanbul Modern',erciyes:'Erciyes'};
export default function PlacePhoto({id,name,lang='en'}:{id:string;name:string;lang?:string}) {
 const photoId=curatedDirectory.find(entry=>entry.id===id)?.gallery[0]??id;
 const photo:DirectoryPhoto|undefined=photos[photoId as keyof typeof photos]??publishedPhoto(id);
 const [failedSrc,setFailedSrc]=useState<string>();
 const failed=Boolean(photo && failedSrc===photo.src);
 if(!photo && id.startsWith('cinema')) return <div className="cinema-art" role="img" aria-label={name}><Clapperboard aria-hidden="true" /><strong>PARİBU CINEVERSE</strong><small>{lang==='tr'?'Sinema · temsili çizim':lang==='de'?'Kino · Illustration':lang==='fr'?'Cinéma · illustration':lang==='ar'?'سينما · رسم توضيحي':lang==='ru'?'Кино · иллюстрация':lang==='zh'?'影院 · 示意图':'Cinema · illustration'}</small></div>;
 if(!photo || failed) return <div className="place-photo-missing" role="status"><small>{failed ? (errorLabels[lang]||errorLabels.en) : (labels[lang]||labels.en)}</small></div>;
 const image=<img src={photo.thumbnail??photo.src} alt={photo.cityContext?contextLabel(lang,photo.cityContext):name} data-photo-id={id} loading="lazy" decoding="async" onError={()=>setFailedSrc(photo.src)} className="place-photo-image" />;
 return photo.cityContext?<div className="relative h-full w-full">{image}<span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-white text-[10px] leading-tight px-2 py-1">{contextLabel(lang,photo.cityContext)}</span></div>:image;
}
export function PhotoCredits(){
 return <details className="mt-2 text-[10px] text-slate-400"><summary className="cursor-pointer underline">Görsel bilgileri / Image credits</summary><ul className="mt-2 space-y-1">{Object.entries(photos).map(([id,p])=><li key={id}><a href={p.source} target="_blank" rel="noreferrer" className="underline">{names[id]||p.author} — {id==='h3'?'Wolfgang Moroder':p.author}</a> · <a href={p.licenseUrl} target="_blank" rel="noreferrer">{p.license}</a></li>)}</ul><p>Display framing only; source photographs are not retouched. / Fotoğraflara rötuş uygulanmadı.</p></details>;
}
