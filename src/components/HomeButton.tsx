import { ArrowLeft } from 'lucide-react';
const labels:Record<string,string>={es:'Volver al inicio',tr:'Ana sayfaya dön',en:'Back to home',de:'Zur Startseite',fr:'Retour à l’accueil',ar:'العودة للرئيسية',ru:'На главную',zh:'返回首页'};
export default function HomeButton({lang='en',onClick,currentPage}:{lang?:string;onClick?:()=>void;currentPage?:string}){
 const label=labels[lang]??labels.en;
 const style='inline-flex min-h-11 items-center gap-1 font-bold text-[#087FFF] hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-700';
 return <nav aria-label={label} dir={lang==='ar'?'rtl':'ltr'} className="flex flex-wrap items-center gap-x-2 text-[12px] text-slate-500">
 {onClick?<button type="button" onClick={onClick} className={style}><ArrowLeft aria-hidden="true" className="w-3.5 h-3.5 shrink-0"/>{label}</button>:<a href="/" className={style}><ArrowLeft aria-hidden="true" className="w-3.5 h-3.5 shrink-0"/>{label}</a>}
 {currentPage&&<><span aria-hidden="true">/</span><span aria-current="page" className="font-bold text-slate-800 break-words min-w-0">{currentPage}</span></>}
 </nav>;
}
