import {cityArtworkNotice} from '../lib/cityArtworkCopy';
const labels:Record<string,string>={en:'Image credits',tr:'Görsel bilgileri',es:'Créditos de imágenes',de:'Bildnachweise',fr:'Crédits photo',ar:'مصادر الصور',ru:'Авторы изображений',zh:'图片来源'};
export default function PhotoCredits({lang='en'}:{lang?:string}){
 return <details className="mt-2 text-xs text-slate-500"><summary className="min-h-8 cursor-pointer underline">{labels[lang]??labels.en}</summary><p>{cityArtworkNotice[lang]??cityArtworkNotice.en}</p></details>;
}
