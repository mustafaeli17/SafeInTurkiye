import { Info, MapPinned, ShieldCheck } from 'lucide-react'
import TransitJourney from './TransitJourney'

export default function TransitPlanner({ lang }: { lang: string }) {
  const tr = lang.toLowerCase() === 'tr'

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24">
      <TransitJourney lang={lang} />
      <section className="grid gap-3 sm:grid-cols-3" aria-label={tr ? 'Rota bilgileri' : 'Route information'}>
        <article className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <MapPinned className="h-5 w-5 text-[#00A3E0]" />
          <h2 className="mt-2 text-sm font-extrabold text-slate-900">{tr ? 'Kendi başlangıcını seç' : 'Choose your own origin'}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{tr ? 'Konumunu kullanabilir veya adres, durak ve mekân adını kendin yazabilirsin.' : 'Use your location or enter any address, stop or place.'}</p>
        </article>
        <article className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <Info className="h-5 w-5 text-[#00A3E0]" />
          <h2 className="mt-2 text-sm font-extrabold text-slate-900">{tr ? 'Aktarma ve saatler' : 'Transfers and times'}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{tr ? 'Sağlayıcı bilgi verirse hat, durak, kalkış, varış ve aktarma adımları ayrı gösterilir.' : 'Lines, stops, departures, arrivals and transfers are shown when supplied.'}</p>
        </article>
        <article className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-[#00A3E0]" />
          <h2 className="mt-2 text-sm font-extrabold text-slate-900">{tr ? 'Tahmin, garanti değil' : 'Estimate, not a guarantee'}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{tr ? 'Sefer ve ücretler değişebilir. Yola çıkmadan ilgili belediye işletmesinin duyurusunu kontrol et.' : 'Departures and fares can change. Check the local operator before travel.'}</p>
        </article>
      </section>
    </main>
  )
}
