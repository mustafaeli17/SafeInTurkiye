import { useEffect, useState } from 'react';
import {currencyInputCopy,invalidCurrencyAmount} from '../lib/currencyInput';
import { Calculator, Loader2, RefreshCw } from 'lucide-react';
import { convertReferenceAmount, getReferenceRates, referencePublicationAge, TravelDataError, supportedCurrencies } from '../services/travelDataService';
import type { CurrencyCode, ReferenceRates } from '../services/travelDataService';

const currencies = supportedCurrencies;
export function CurrencyResult({ amount, from, to, converted, lang, label }: { amount: number; from: CurrencyCode; to: CurrencyCode; converted: number; lang: string; label: string }) {
  return <output className="block min-w-0 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-5 sm:p-6" aria-live="polite" aria-atomic="true">
    <span className="block text-sm font-semibold text-slate-600" dir="ltr">{amount.toLocaleString(lang, { maximumFractionDigits: 8 })} {from} ≈</span>
    <strong className="mt-1 flex flex-wrap items-baseline gap-x-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#087FFF]" dir="ltr">
      <span className="min-w-0 break-all tabular-nums">{converted.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span className="text-xl font-bold">{to === 'TRY' ? 'TL' : to}</span>
    </strong>
    <span className="mt-2 block text-xs font-medium text-slate-500">{label}</span>
  </output>;
}
const converterLabels: Record<string, [string, string, string, string]> = {
  en: ['Amount', 'From currency', 'To currency', 'These rates are over 7 days old. Check a current quote before exchanging.'],
  tr: ['Tutar', 'Kaynak para birimi', 'Hedef para birimi', 'Bu kurlar 7 günden eski. İşlem öncesinde güncel fiyatı kontrol edin.'],
  es: ['Importe', 'Moneda de origen', 'Moneda de destino', 'Estos tipos tienen más de 7 días. Comprueba la cotización actual antes de cambiar dinero.'],
  de: ['Betrag', 'Ausgangswährung', 'Zielwährung', 'Diese Kurse sind über 7 Tage alt. Prüfen Sie vor dem Umtausch den aktuellen Kurs.'],
  fr: ['Montant', 'Devise de départ', 'Devise d’arrivée', 'Ces cours datent de plus de 7 jours. Vérifiez le cours actuel avant de changer votre argent.'],
  ar: ['المبلغ', 'من العملة', 'إلى العملة', 'هذه الأسعار أقدم من 7 أيام. تحقق من السعر الحالي قبل الصرف.'],
  ru: ['Сумма', 'Исходная валюта', 'Целевая валюта', 'Этим курсам больше 7 дней. Перед обменом уточните текущий курс.'],
  zh: ['金额', '原币种', '目标币种', '这些汇率已超过7天。兑换前请确认当前报价。'],
};

export default function CurrencyRates({ lang = 'en' }: { lang?: string }) {
  const labels: Record<string, { title: string; ref: string; converter: string; unavailable: string; loading: string; tryAgain: string; disclaimer: string }> = {
    es:{title:'Tipos de cambio de referencia diarios',ref:'Referencia',converter:'Conversor de referencia',unavailable:'Los tipos de cambio no están disponibles ahora.',loading:'Cargando tipos de cambio…',tryAgain:'Intentar de nuevo',disclaimer:'No son cotizaciones de compra o venta de una casa de cambio.'},
    en: { title: 'Daily reference rates', ref: 'Reference', converter: 'Reference converter', unavailable: 'Reference rates are unavailable right now.', loading: 'Loading daily reference rates…', tryAgain: 'Try again', disclaimer: 'This is not a bureau buy/sell offer.' },
    tr: { title: 'Günlük referans kurları', ref: 'Referans', converter: 'Referans çevirici', unavailable: 'Kur verisi şu anda alınamıyor.', loading: 'Günlük referans kurları yükleniyor…', tryAgain: 'Tekrar dene', disclaimer: 'Bu, döviz bürosu alış/satış teklifi değildir.' },
    de: { title: 'Tägliche Referenzkurse', ref: 'Referenz', converter: 'Referenzumrechner', unavailable: 'Referenzkurse sind derzeit nicht verfügbar.', loading: 'Referenzkurse werden geladen…', tryAgain: 'Erneut versuchen', disclaimer: 'Kein An- oder Verkaufskurs einer Wechselstube.' },
    fr: { title: 'Cours de référence du jour', ref: 'Référence', converter: 'Convertisseur de référence', unavailable: 'Cours indisponibles pour le moment.', loading: 'Chargement des cours…', tryAgain: 'Réessayer', disclaimer: 'Ce ne sont pas les cours d’achat/vente d’un bureau.' },
    ar: { title: 'أسعار الصرف المرجعية اليومية', ref: 'مرجعي', converter: 'محول مرجعي', unavailable: 'أسعار الصرف غير متاحة الآن.', loading: 'جارٍ تحميل الأسعار…', tryAgain: 'إعادة المحاولة', disclaimer: 'ليست أسعار شراء أو بيع مكتب صرافة.' },
    ru: { title: 'Дневные справочные курсы', ref: 'Справочный', converter: 'Справочный конвертер', unavailable: 'Курсы сейчас недоступны.', loading: 'Загрузка курсов…', tryAgain: 'Повторить', disclaimer: 'Это не курс покупки/продажи обменного пункта.' },
    zh: { title: '每日参考汇率', ref: '参考', converter: '参考换算器', unavailable: '当前无法获取参考汇率。', loading: '正在加载每日参考汇率…', tryAgain: '重试', disclaimer: '这不是兑换点的实际买入或卖出报价。' },
  };
  const t = labels[lang.toLowerCase()] ?? labels.en;
  const fields = converterLabels[lang.toLowerCase()] ?? converterLabels.en;
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

  const converted = rates && amount.trim() ? convertReferenceAmount(Number(amount), from, to, rates) : null;
  return <section className="space-y-4" aria-live="polite">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {rates ? currencies.filter(currency => currency !== 'TRY').map((currency) => {
        const value = rates.perEuro.TRY / rates.perEuro[currency as CurrencyCode];
        return <div key={currency} className="p-4 bg-white rounded-2xl border border-sky-100 shadow-sm"><span className="text-[11px] font-bold text-slate-500 block">{currency} / TRY</span><strong className="text-[20px] font-black text-slate-900 block">{value.toFixed(4)} ₺</strong><span className="text-[11px] text-[#00A3E0]">{t.ref}</span></div>;
      }) : <div className="col-span-full p-4 bg-white rounded-2xl border border-sky-100 text-[13px] text-slate-600 flex gap-2 items-center">{!error && <Loader2 className="w-4 h-4 animate-spin text-[#00A3E0]" />}{error ? t.unavailable : t.loading}</div>}
    </div>
    {error && <button onClick={() => setRetry(value => value + 1)} className="inline-flex gap-2 items-center px-3 py-2 rounded-xl border border-sky-200 text-[12px] font-bold text-sky-700"><RefreshCw className="w-3.5 h-3.5" />{t.tryAgain}</button>}
    {rates && <p className="text-[11px] text-slate-500">{t.title}: {rates.date} · <a href={rates.sourceUrl} target="_blank" rel="noreferrer" className="underline">{rates.source}</a>. {t.disclaimer}</p>}
    {rates && referencePublicationAge(rates.date) > 7 && <p role="status" className="text-sm text-amber-800">{fields[3]}</p>}
    <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-3">
      <div className="flex gap-2 items-center font-extrabold text-[15px] text-slate-900"><Calculator className="w-5 h-5 text-[#00A3E0]" />{t.converter}</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input aria-label={fields[0]} aria-invalid={invalidCurrencyAmount(amount)} aria-describedby={invalidCurrencyAmount(amount)?'currency-input-error':undefined} type="number" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px]" />
        <select aria-label={fields[1]} value={from} onChange={e => setFrom(e.target.value as CurrencyCode)} className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px]">{currencies.map(c => <option key={c}>{c}</option>)}</select>
        <select aria-label={fields[2]} value={to} onChange={e => setTo(e.target.value as CurrencyCode)} className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px]">{currencies.map(c => <option key={c}>{c}</option>)}</select>
      </div>
      {invalidCurrencyAmount(amount)&&<p id="currency-input-error" role="status" className="text-sm text-red-700">{currencyInputCopy[lang]??currencyInputCopy.en}</p>}
      {converted !== null && <CurrencyResult amount={Number(amount)} from={from} to={to} converted={converted} lang={lang} label={t.ref} />}
    </div>
  </section>;
}
