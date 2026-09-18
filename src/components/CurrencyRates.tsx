import { useEffect, useState } from 'react';
import { Calculator, Loader2, RefreshCw } from 'lucide-react';
import { convertReferenceAmount, getReferenceRates, TravelDataError } from '../services/travelDataService';
import type { CurrencyCode, ReferenceRates } from '../services/travelDataService';

const currencies: CurrencyCode[] = ['EUR', 'USD', 'GBP', 'CHF', 'TRY'];

export default function CurrencyRates({ lang = 'en' }: { lang?: string }) {
  const labels: Record<string, { title: string; ref: string; converter: string; unavailable: string; loading: string; tryAgain: string; disclaimer: string }> = {
    en: { title: 'Daily reference rates', ref: 'Reference', converter: 'Reference converter', unavailable: 'Reference rates are unavailable right now.', loading: 'Loading daily reference rates…', tryAgain: 'Try again', disclaimer: 'This is not a bureau buy/sell offer.' },
    tr: { title: 'Günlük referans kurları', ref: 'Referans', converter: 'Referans çevirici', unavailable: 'Kur verisi şu anda alınamıyor.', loading: 'Günlük referans kurları yükleniyor…', tryAgain: 'Tekrar dene', disclaimer: 'Bu, döviz bürosu alış/satış teklifi değildir.' },
    de: { title: 'Tägliche Referenzkurse', ref: 'Referenz', converter: 'Referenzumrechner', unavailable: 'Referenzkurse sind derzeit nicht verfügbar.', loading: 'Referenzkurse werden geladen…', tryAgain: 'Erneut versuchen', disclaimer: 'Kein An- oder Verkaufskurs einer Wechselstube.' },
    fr: { title: 'Cours de référence du jour', ref: 'Référence', converter: 'Convertisseur de référence', unavailable: 'Cours indisponibles pour le moment.', loading: 'Chargement des cours…', tryAgain: 'Réessayer', disclaimer: 'Ce ne sont pas les cours d’achat/vente d’un bureau.' },
    ar: { title: 'أسعار الصرف المرجعية اليومية', ref: 'مرجعي', converter: 'محول مرجعي', unavailable: 'أسعار الصرف غير متاحة الآن.', loading: 'جارٍ تحميل الأسعار…', tryAgain: 'إعادة المحاولة', disclaimer: 'ليست أسعار شراء أو بيع مكتب صرافة.' },
    ru: { title: 'Дневные справочные курсы', ref: 'Справочный', converter: 'Справочный конвертер', unavailable: 'Курсы сейчас недоступны.', loading: 'Загрузка курсов…', tryAgain: 'Повторить', disclaimer: 'Это не курс покупки/продажи обменного пункта.' },
  };
  const t = labels[lang.toLowerCase()] ?? labels.en;
  const [rates, setRates] = useState<ReferenceRates | null>(null);
  const [error, setError] = useState<'unavailable' | 'timeout' | 'unconfigured' | null>(null);
  const [retry, setRetry] = useState(0);
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState<CurrencyCode>('EUR');
  const [to, setTo] = useState<CurrencyCode>('TRY');

  useEffect(() => {
    const controller = new AbortController();
    setRates(null);
    setError(null);
    getReferenceRates(controller.signal)
      .then(setRates)
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof TravelDataError && reason.kind !== 'invalid' ? reason.kind : 'unavailable');
      });
    return () => controller.abort();
  }, [retry]);

  const converted = rates ? convertReferenceAmount(Number(amount), from, to, rates) : null;
  return <section className="space-y-4" aria-live="polite">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {rates ? ['EUR', 'USD', 'GBP', 'CHF'].map((currency) => {
        const value = rates.perEuro.TRY / rates.perEuro[currency as CurrencyCode];
        return <div key={currency} className="p-4 bg-white rounded-2xl border border-sky-100 shadow-sm"><span className="text-[11px] font-bold text-slate-500 block">{currency} / TRY</span><strong className="text-[20px] font-black text-slate-900 block">{value.toFixed(4)} ₺</strong><span className="text-[11px] text-[#00A3E0]">{t.ref}</span></div>;
      }) : <div className="col-span-full p-4 bg-white rounded-2xl border border-sky-100 text-[13px] text-slate-600 flex gap-2 items-center">{!error && <Loader2 className="w-4 h-4 animate-spin text-[#00A3E0]" />}{error ? t.unavailable : t.loading}</div>}
    </div>
    {error && <button onClick={() => setRetry(value => value + 1)} className="inline-flex gap-2 items-center px-3 py-2 rounded-xl border border-sky-200 text-[12px] font-bold text-sky-700"><RefreshCw className="w-3.5 h-3.5" />{t.tryAgain}</button>}
    {rates && <p className="text-[11px] text-slate-500">{t.title}: {rates.date} · ECB/Frankfurter. {t.disclaimer}</p>}
    <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-3"><div className="flex gap-2 items-center font-extrabold text-[15px] text-slate-900"><Calculator className="w-5 h-5 text-[#00A3E0]" />{t.converter}</div><div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><input aria-label="Amount" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px]" /><select value={from} onChange={e => setFrom(e.target.value as CurrencyCode)} className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px]">{currencies.map(c => <option key={c}>{c}</option>)}</select><select value={to} onChange={e => setTo(e.target.value as CurrencyCode)} className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px]">{currencies.map(c => <option key={c}>{c}</option>)}</select></div>{converted !== null && <p className="text-sm text-slate-700"><strong>{amount || '0'} {from} ≈ {converted.toFixed(2)} {to}</strong> <span className="text-slate-500">{t.ref}</span></p>}</div>
  </section>;
}
