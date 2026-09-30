import photos from './reviewedPhotos.json';
import {directory,type DirectoryEntry} from './directory';
export interface DirectoryPhoto {src:string;thumbnail?:string;width?:number;height?:number;source?:string;author?:string;license?:string;licenseUrl?:string;cityContext?:string;alt?:string;variants?:{src:string;width:number;height:number}[];focalX?:number;focalY?:number;changes?:string;captureDate?:string;illustrative?:boolean}
export function illustrativeLabel(lang:string){
 const labels:Record<string,string>={tr:'Temsili görsel · Mekân fotoğrafı değildir',en:'Illustrative image · Not a venue photo',de:'Symbolbild · Kein Foto des Betriebs',fr:'Image illustrative · Pas une photo du lieu',ar:'صورة توضيحية · ليست صورة للمكان',ru:'Иллюстрация · Не фото заведения',zh:'示意图片 · 非场所照片'};
 return labels[lang]??labels.en;
}
const cityImages:Record<string,keyof typeof photos>={'İstanbul':'a3','Istanbul':'a3','Ankara':'ankara','İzmir':'izmir','Antalya':'antalya','Cappadocia':'a1','Kapadokya':'a1','Muğla':'mugla','Aydın':'aydin','Denizli':'denizli','Trabzon':'trabzon','Konya':'konya','Bursa':'bursa','Kayseri':'erciyes'};
export function cityPhoto(city:string):DirectoryPhoto|undefined{
 const photo=photos[cityImages[city]];
 return photo?{...photo,cityContext:city}:undefined;
}
export function contextLabel(lang:string,city:string){
 const labels:Record<string,string>={tr:'Şehir görseli · Mekân fotoğrafı değildir',en:'City image · Not a venue photo',de:'Stadtbild · Kein Foto des Betriebs',fr:'Vue de la ville · Pas une photo du lieu',ar:'صورة المدينة · ليست صورة للمكان',ru:'Вид города · Не фото заведения',zh:'城市图片 · 非场所照片'};
 return `${city} — ${labels[lang]??labels.en}`;
}
export function entryPhotos(entry:DirectoryEntry):DirectoryPhoto[]{
 const registered=entry.gallery.flatMap(id=>{const photo=photos[id as keyof typeof photos];return photo?[photo]:[];});
 // An arbitrary CMS HTTPS URL does not establish identity or reuse rights.
 // Business galleries never silently fall back to destination photography.
 return registered.filter((photo:DirectoryPhoto)=>!photo.illustrative||(entry.kind==='activities'&&['Cinema','Summer','Winter','Entertainment'].includes(entry.category??'')));
}
export function publishedPhoto(id:string):DirectoryPhoto|undefined{
 const entry=directory.find(item=>item.id===id);
 return entry?entryPhotos(entry)[0]:undefined;
}
