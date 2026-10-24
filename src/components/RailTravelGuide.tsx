import { TrainFront, ExternalLink } from 'lucide-react'

import {railSources,railCopy} from '../lib/railTravelCopy';
export default function RailTravelGuide({locale}:{locale:string}) {
  const t=railCopy[locale]??railCopy.en
  return <section className="rounded-2xl border border-sky-100 bg-white p-5" aria-labelledby="rail-guide-title">
    <h2 id="rail-guide-title" className="flex items-center gap-2 font-bold text-slate-900"><TrainFront className="h-5 w-5 text-[#087FFF]" aria-hidden="true"/>{t[0]}</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate-600">{t[1]}</p>
    <details className="mt-2 text-sm text-slate-600"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-blue-700">{t[5]}</summary><p className="mb-3 leading-relaxed">{t[2]}</p><p className="leading-relaxed">{t[3]}</p></details>
    <a href={railSources.tickets} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-50 px-4 py-2 text-sm font-bold text-blue-700">{t[4]}<ExternalLink className="h-4 w-4" aria-hidden="true"/></a>
  </section>
}
