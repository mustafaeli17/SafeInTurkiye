import {cityArtworkNotice} from '../lib/cityArtworkCopy';
import photos from '../data/directoryPhotos.json';
const labels:Record<string,string>={en:'Image credits',tr:'Görsel bilgileri',es:'Créditos de imágenes',de:'Bildnachweise',fr:'Crédits photo',ar:'مصادر الصور',ru:'Авторы изображений',zh:'图片来源'};
const licenseLabels:Record<string,string>={en:'Photo licence',tr:'Fotoğraf lisansı',es:'Licencia de la foto',de:'Fotolizenz',fr:'Licence photo',ar:'ترخيص الصورة',ru:'Лицензия фотографии',zh:'照片许可'};
export default function PhotoCredits({lang='en',section}:{lang?:string;section?:string}){
  const photo = photos.find(item => item.section === section);
  return <details className="mt-2 text-xs text-slate-500">
    <summary className="min-h-8 cursor-pointer underline">{labels[lang]??labels.en}</summary>
    {photo ? <p><a className="underline" href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author} · Unsplash</a>
      {' · '}<a className="underline" href={photo.license} target="_blank" rel="noopener noreferrer">{licenseLabels[lang]??licenseLabels.en}</a></p>
      : <p>{cityArtworkNotice[lang]??cityArtworkNotice.en}</p>}
  </details>;
}
