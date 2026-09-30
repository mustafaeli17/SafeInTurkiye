import { useState } from 'react';

import {photoEditingCopy} from '../lib/contentTranslation';
import photos from '../lib/reviewedPhotos.json';
import { publishedPhoto,contextLabel,illustrativeLabel,type DirectoryPhoto } from '../lib/directoryPhotos';
const labels: Record<string,string> = {tr:'Mekân fotoğrafı henüz eklenmedi',en:'Venue photo not yet available',de:'Foto des Ortes noch nicht verfügbar',fr:'Photo du lieu pas encore disponible',ar:'صورة المكان غير متوفرة بعد',ru:'Фото места пока недоступно',zh:'暂无场所照片'};
const errorLabels: Record<string,string> = {tr:'Fotoğraf yüklenemedi',en:'Photo could not load',de:'Foto konnte nicht geladen werden',fr:'Impossible de charger la photo',ar:'تعذر تحميل الصورة',ru:'Не удалось загрузить фото',zh:'照片加载失败'};
const names: Record<string,string> = {izmir:'İzmir — Saat Kulesi',ankara:'Ankara — Anıtkabir',antalya:'Antalya — Kaleiçi',h2:'Swissôtel Büyük Efes',h3:'Çırağan Palace',a1:'Göreme Open Air Museum',a2:'Anadolu Medeniyetleri Müzesi',a3:'Topkapı Palace',modern:'İstanbul Modern',erciyes:'Erciyes'};
export default function PlacePhoto({id,name,lang='en'}:{id:string;name:string;lang?:string}) {
 const photo:DirectoryPhoto|undefined=publishedPhoto(id);
 const [failedSrc,setFailedSrc]=useState<string>();
 const failed=Boolean(photo && failedSrc===photo.src);
 if(!photo || failed) return <div className="place-photo-missing" role="status"><small>{failed ? (errorLabels[lang]||errorLabels.en) : (labels[lang]||labels.en)}</small></div>;
 const image=<img src={photo.thumbnail??photo.src} srcSet={photo.variants?.map(v=>`${v.src} ${v.width}w`).join(', ')} sizes="(max-width: 640px) 110px, 320px" width={photo.width} height={photo.height} style={{objectPosition:`${photo.focalX??50}% ${photo.focalY??50}%`}} alt={lang==='en'?(photo.alt??name):name} data-photo-id={id} loading="lazy" decoding="async" onError={()=>setFailedSrc(photo.src)} className="place-photo-image" />;
 return photo.cityContext||photo.illustrative?<div className="relative h-full w-full">{image}<span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-white text-[10px] leading-tight px-2 py-1">{photo.illustrative?illustrativeLabel(lang):contextLabel(lang,photo.cityContext!)}</span></div>:image;
}
export function PhotoCredits({lang='en'}:{lang?:string}){
 const title:Record<string,string>={en:'Image credits',tr:'Görsel bilgileri',zh:'图片来源',de:'Bildnachweise',fr:'Crédits photo',ar:'مصادر الصور',ru:'Авторы фотографий'};
 return <details className="mt-2 text-[10px] text-slate-400"><summary className="cursor-pointer underline">{title[lang]??title.en}</summary><p>{lang==='tr'?'İstanbul panoraması: yapay zekâ ile oluşturulmuş dekoratif görsel.':lang==='zh'?'伊斯坦布尔全景：AI 生成的装饰图像。':'Istanbul panorama: AI-generated decorative image.'}</p><ul className="mt-2 space-y-1">{Object.entries(photos).map(([id,p])=><li key={id}><a href={p.source} target="_blank" rel="noreferrer" className="underline">{names[id]||p.alt} — {p.author}</a> · <a href={p.licenseUrl} target="_blank" rel="noreferrer">{p.license}</a></li>)}</ul><p>{photoEditingCopy[lang]??photoEditingCopy.en}</p></details>;
}
