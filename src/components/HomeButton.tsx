import { ArrowLeft } from 'lucide-react';
const labels:Record<string,string>={es:'Volver al inicio',tr:'Ana sayfaya dön',en:'Back to home',de:'Zur Startseite',fr:'Retour à l’accueil',ar:'العودة للرئيسية',ru:'На главную',zh:'返回首页'};
export default function HomeButton({lang='en',onClick}:{lang?:string;onClick?:()=>void}){
 const label=labels[lang]??labels.en;
 const style='inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-blue-700 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-blue-700';
 return onClick?<button type="button" onClick={onClick} className={style}><ArrowLeft size={17}/>{label}</button>:<a href="/" className={style}><ArrowLeft size={17}/>{label}</a>;
}
