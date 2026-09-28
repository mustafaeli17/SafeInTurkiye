import photos from './placePhotos.json';
import {directory,type DirectoryEntry} from './directory';
export interface DirectoryPhoto {src:string;thumbnail?:string;width?:number;height?:number;source?:string;author?:string;license?:string;licenseUrl?:string;cityContext?:string}
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
 const actual=entry.imageUrl?[{src:entry.imageUrl},...registered]:registered;
 const context=cityPhoto(entry.city);
 return actual.length?actual:context?[context]:[];
}
export function publishedPhoto(id:string):DirectoryPhoto|undefined{
 const entry=directory.find(item=>item.id===id);
 return entry?entryPhotos(entry)[0]:undefined;
}
