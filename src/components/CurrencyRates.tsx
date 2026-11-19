import { useEffect, useState, type ReactNode } from 'react';
import { exchangeCopy } from '../lib/exchangeCopy';
import './ExchangePage.css';
import {exchangeArtwork} from '../lib/exchangeArtwork';
import {cityArtworkNotice} from '../lib/cityArtworkCopy';
import CurrencyFlag from './CurrencyFlag';
import {currencyInputCopy,invalidCurrencyAmount} from '../lib/currencyInput';
import { ArrowLeftRight, ChartNoAxesColumnIncreasing, Coins, Info, Loader2, MapPin, RefreshCw } from 'lucide-react';
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

export default function CurrencyRates({ lang = 'en', nearby, guide, city = 'İstanbul' }: { city?: string; lang?: string; nearby?: ReactNode; guide?: ReactNode }) {
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
  const [section,setSection]=useState('exchange-converter');
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
  const copy = exchangeCopy[lang] ?? exchangeCopy.en;
  const artwork = exchangeArtwork(city);

  const names = new Intl.DisplayNames([lang], {type:'currency'});
  const unit = rates ? convertReferenceAmount(1, from, to, rates) : null;
  const status = <div className="exchange-status" role="status">{!error && <Loader2 className="animate-spin" aria-hidden="true"/>}{error ? t.unavailable : t.loading}{error && <button type="button" onClick={()=>setRetry(v=>v+1)}><RefreshCw size={16} aria-hidden="true"/>{t.tryAgain}</button>}</div>;
  return <div className="exchange-experience" dir={lang==='ar'?'rtl':'ltr'}>
    <header className="exchange-hero">
      {artwork&&<img className="exchange-hero-image" src={artwork.src} width={artwork.width} height={artwork.height} alt={`${artwork.name} — ${cityArtworkNotice[lang]??cityArtworkNotice.en}`} title={cityArtworkNotice[lang]??cityArtworkNotice.en} decoding="async"/>}
      <div className="exchange-hero-wash"/>
      <div className="exchange-hero-copy"><h1>{copy[1]} <span>{copy[2]}</span></h1></div>
    </header>
    <p className="exchange-hero-description">{copy[3]}</p>
    <div className="exchange-nav" role="tablist" aria-label={copy[0]} onKeyDown={event=>{
      const tabs=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      const index=tabs.indexOf(event.target as HTMLButtonElement);
      const step=event.key==='ArrowRight'?(lang==='ar'?-1:1):event.key==='ArrowLeft'?(lang==='ar'?1:-1):0;
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:step?(index+step+tabs.length)%tabs.length:-1;
      if(next>=0){event.preventDefault();tabs[next].click();tabs[next].focus()}
    }}>{[
      {id:'exchange-converter',label:copy[4],icon:<ArrowLeftRight aria-hidden="true"/>},
      {id:'exchange-rates',label:copy[5],icon:<ChartNoAxesColumnIncreasing aria-hidden="true"/>},
      ...(nearby?[{id:'exchange-bureaux',label:copy[6],icon:<MapPin aria-hidden="true"/>}]:[]),
    ].map(tab=><button key={tab.id} id={`${tab.id}-tab`} type="button" role="tab" aria-selected={section===tab.id} aria-controls={tab.id} tabIndex={section===tab.id?0:-1} className={section===tab.id?'exchange-nav-primary':undefined} onClick={()=>setSection(tab.id)}>{tab.icon}{tab.label}</button>)}</div>
    <section id="exchange-converter" role="tabpanel" aria-labelledby="exchange-converter-tab" hidden={section!=='exchange-converter'} tabIndex={0} className="exchange-card exchange-converter">
      <div className="exchange-converter-grid">
        <div><label className="exchange-field-label" htmlFor="exchange-amount">{copy[7]}</label><div className="exchange-value-box"><input id="exchange-amount" aria-label={fields[0]} aria-invalid={invalidCurrencyAmount(amount)} aria-describedby={invalidCurrencyAmount(amount)?'currency-input-error':undefined} type="number" min="0" step="any" value={amount} onChange={e=>setAmount(e.target.value)}/><CurrencyFlag code={from}/><select aria-label={fields[1]} value={from} onChange={e=>setFrom(e.target.value as CurrencyCode)}>{currencies.map(c=><option key={c}>{c}</option>)}</select></div></div>
        <button className="exchange-swap" type="button" title={copy[9]} onClick={()=>{setFrom(to);setTo(from)}}><ArrowLeftRight aria-hidden="true"/><span className="sr-only">{copy[9]}</span></button>
        <div><span className="exchange-field-label">{copy[8]}</span><div className="exchange-value-box exchange-output"><output aria-live="polite" aria-atomic="true"><span className="sr-only">{copy[8]} </span>{converted===null?'—':converted.toLocaleString(lang,{minimumFractionDigits:2,maximumFractionDigits:2})}<span className="sr-only"> {to}</span></output><CurrencyFlag code={to}/><select aria-label={fields[2]} value={to} onChange={e=>setTo(e.target.value as CurrencyCode)}>{currencies.map(c=><option key={c}>{c}</option>)}</select></div></div>
      </div>
      {invalidCurrencyAmount(amount)&&<p id="currency-input-error" role="status" className="text-sm text-red-700">{currencyInputCopy[lang]??currencyInputCopy.en}</p>}
      <div className="exchange-converter-meta">{unit!==null&&<strong dir="ltr">1 {from} ≈ {unit.toLocaleString(lang,{maximumFractionDigits:4})} {to}</strong>}<p><Info size={18} aria-hidden="true"/>{t.disclaimer}</p></div>
      {!rates&&status}
      {rates&&referencePublicationAge(rates.date)>7&&<p role="status" className="text-sm text-amber-800">{fields[3]}</p>}
    </section>

      <section id="exchange-rates" role="tabpanel" aria-labelledby="exchange-rates-tab" hidden={section!=='exchange-rates'} tabIndex={0} className="exchange-card exchange-rates"><div className="exchange-section-heading"><ChartNoAxesColumnIncreasing aria-hidden="true"/><div><h2>{copy[5]}</h2><p>{copy[11]}</p></div></div>
        {rates?<ul>{currencies.filter(c=>c!=='TRY').map(c=><li key={c}><CurrencyFlag code={c}/><strong>{c}</strong><span className="exchange-currency-name">{names.of(c)}</span><span className="exchange-rate-value" dir="ltr"><strong>{(rates.perEuro.TRY/rates.perEuro[c]).toLocaleString(lang,{minimumFractionDigits:2,maximumFractionDigits:4})}</strong> TRY</span></li>)}</ul>:status}
        {rates&&<p className="exchange-source"><time dateTime={rates.date}>{rates.date}</time> · <a href={rates.sourceUrl} target="_blank" rel="noreferrer">{rates.source}</a></p>}
      </section>
      {nearby&&<section id="exchange-bureaux" role="tabpanel" aria-labelledby="exchange-bureaux-tab" hidden={section!=='exchange-bureaux'} tabIndex={0} className="exchange-card exchange-bureaux">{nearby}</section>}
    <aside className="exchange-card exchange-good"><Info aria-hidden="true"/><div><h2>{copy[10]}</h2><p>{t.disclaimer}</p>{guide}</div><Coins className="exchange-good-art" aria-hidden="true"/></aside>
  </div>;
}
