import {firstVisitPlanSources,firstVisitPlanCopy} from '../data/firstVisitPlans';
export default function FirstVisitPlan({city,lang}:{city:string;lang:string}){
 const source=firstVisitPlanSources[city as keyof typeof firstVisitPlanSources];if(!source)return null;
 const t=firstVisitPlanCopy[lang]??firstVisitPlanCopy.en;
 return <details dir={lang==='ar'?'rtl':undefined} className="rounded-2xl border border-sky-100 bg-white p-5 text-sm text-slate-700"><summary className="min-h-11 cursor-pointer font-bold">{t[0]}</summary><p className="my-3 leading-relaxed">{t[city==='İstanbul'?1:2]}</p><p className="text-xs leading-relaxed text-slate-600">{t[3]}</p><div className="mt-3 flex flex-wrap gap-4"><a className="inline-flex min-h-11 items-center font-semibold text-blue-700" href={`/transport?city=${city==='İstanbul'?'istanbul':'antalya'}`}>{t[4]} →</a><a className="inline-flex min-h-11 items-center underline" href={source.url} target="_blank" rel="noopener noreferrer">{t[5]} ↗</a></div></details>;
}
