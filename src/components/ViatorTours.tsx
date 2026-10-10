import { useEffect, useRef, useState } from 'react'
import { publicCities } from '../lib/publicRoutes'
import { toursLabel } from '../lib/viatorCopy'
const copy: Record<string, string[]> = {
  en: ['Tours & experiences · Viator','Destination','Find tours','Searching…','No tours found for this destination.','Tours are temporarily unavailable. Please try again later.','From','View on Viator','We may earn a commission from qualifying bookings. Final price and availability are confirmed on Viator.','Sandbox preview — test results, not live availability.','Next','Previous','Product information is provided in English for this language.'],
  tr: ['Turlar ve deneyimler · Viator','Destinasyon','Turları bul','Aranıyor…','Bu destinasyonda tur bulunamadı.','Turlara şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.','Başlangıç fiyatı','Viator’da incele','Uygun rezervasyonlardan komisyon kazanabiliriz. Son fiyat ve müsaitlik Viator’da doğrulanır.','Test önizlemesi — sonuçlar canlı müsaitlik bilgisi değildir.','Sonraki','Önceki','Bu dil için ürün bilgileri İngilizce sunulmaktadır.'],
  es: ['Excursiones y experiencias · Viator','Destino','Buscar excursiones','Buscando…','No se encontraron excursiones en este destino.','Las excursiones no están disponibles temporalmente. Inténtalo más tarde.','Desde','Ver en Viator','Podemos recibir una comisión por las reservas que cumplan los requisitos. El precio final y la disponibilidad se confirman en Viator.','Vista previa de prueba: no muestra disponibilidad real.','Siguiente','Anterior','La información del producto se ofrece en inglés para este idioma.'],
  de: ['Touren und Erlebnisse · Viator','Reiseziel','Touren suchen','Suche läuft…','Keine Touren für dieses Reiseziel gefunden.','Touren sind vorübergehend nicht verfügbar. Bitte später erneut versuchen.','Ab','Bei Viator ansehen','Bei berechtigten Buchungen erhalten wir möglicherweise eine Provision. Endpreis und Verfügbarkeit werden bei Viator bestätigt.','Testvorschau — keine aktuelle Verfügbarkeit.','Weiter','Zurück','Produktinformationen werden für diese Sprache auf Englisch angezeigt.'],
  fr: ['Excursions et expériences · Viator','Destination','Rechercher','Recherche…','Aucune excursion trouvée pour cette destination.','Les excursions sont temporairement indisponibles. Réessayez plus tard.','À partir de','Voir sur Viator','Nous pouvons percevoir une commission sur les réservations éligibles. Le prix final et la disponibilité sont confirmés sur Viator.','Aperçu de test — pas de disponibilité réelle.','Suivant','Précédent','Les informations sur les produits sont fournies en anglais pour cette langue.'],
  ar: ['الجولات والتجارب · Viator','الوجهة','ابحث عن الجولات','جارٍ البحث…','لم يتم العثور على جولات لهذه الوجهة.','الجولات غير متاحة مؤقتًا. يرجى المحاولة لاحقًا.','ابتداءً من','عرض على Viator','قد نحصل على عمولة مقابل الحجوزات المؤهلة. يتم تأكيد السعر النهائي والتوافر على Viator.','معاينة تجريبية — ليست معلومات توافر فعلية.','التالي','السابق','تُعرض معلومات المنتجات باللغة الإنجليزية لهذه اللغة.'],
  ru: ['Экскурсии и впечатления · Viator','Направление','Найти экскурсии','Поиск…','Экскурсий для этого направления не найдено.','Экскурсии временно недоступны. Попробуйте позже.','От','Посмотреть на Viator','Мы можем получить комиссию за подходящие бронирования. Итоговая цена и наличие подтверждаются на Viator.','Тестовый просмотр — не фактическое наличие.','Далее','Назад','Информация о продуктах для этого языка предоставляется на английском.'],
  zh: ['旅游与体验 · Viator','目的地','搜索行程','搜索中…','未找到该目的地的行程。','行程暂时无法加载，请稍后重试。','起价','在 Viator 查看','符合条件的预订可能为我们带来佣金。最终价格和可订情况以 Viator 为准。','测试预览——不代表实际可订情况。','下一页','上一页','此语言的产品信息以英语提供。'],
}
type Result = { products: { code:string; title:string; productUrl:string; photo?:string; fromPrice?:number; currency?:string }[]; totalCount:number; sandbox:boolean; language:string }
const affiliateLabel = (lang:string) => ({en:'Affiliate link',tr:'İş ortağı bağlantısı',de:'Affiliate-Link',fr:'Lien affilié',ar:'رابط تسويق بالعمولة',ru:'Партнёрская ссылка',zh:'联盟推广链接',es:'Enlace de afiliado'}[lang] ?? 'Affiliate link')
export default function ViatorTours({ lang }: { lang:string }) {
  const t=copy[lang] ?? copy.en
  const [city,setCity]=useState('istanbul'), [result,setResult]=useState<Result|null>(null), [state,setState]=useState('idle'), [start,setStart]=useState(1)
  const controller=useRef<AbortController|null>(null)
  useEffect(()=>{controller.current?.abort();setResult(null);setState('idle');setStart(1);return()=>controller.current?.abort()},[lang,city])
  async function search(offset=1) {
    controller.current?.abort(); const current=new AbortController();controller.current=current
    setState('loading');setResult(null)
    try {
      const r=await fetch(`/api/viator?${new URLSearchParams({city,lang,currency:'EUR',start:String(offset)})}`,{signal:AbortSignal.any([current.signal,AbortSignal.timeout(20000)]),cache:'no-store'})
      if(!r.ok) {
        const failure=await r.json().catch(()=>null)
        const known=['NOT_CONFIGURED','ACCESS_PENDING','BUSY','PROVIDER_UNAVAILABLE','TIMEOUT','INVALID_INPUT']
        // Log only our allowlisted diagnostic code, never the upstream response or key.
        console.warn(`Viator request unavailable: HTTP ${r.status}; ${known.includes(failure?.error)?failure.error:'UNKNOWN'}`)
        throw new Error('unavailable')
      }
      const data=await r.json() as Result
      if(!Array.isArray(data.products)) throw new Error('invalid')
      if(current.signal.aborted) return
      setResult(data);setStart(offset);setState('ready')
    } catch {if(!current.signal.aborted) setState('error')}
  }
  return <section aria-labelledby="viator-heading" className="my-6 rounded-2xl border border-blue-100 bg-white p-4 sm:p-6">
    <h1 id="viator-heading" className="mb-4 text-3xl font-extrabold text-slate-900">{toursLabel(lang)}</h1>
    <form onSubmit={e=>{e.preventDefault();void search()}} className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm">{t[1]}<select value={city} onChange={e=>setCity(e.target.value)} className="rounded-xl border border-blue-200 p-3">
        {publicCities.map(c=><option key={c.slug} value={c.slug}>{c.name}{c.slug==='mugla'?' · Bodrum':c.slug==='aydin'?' · Kuşadası':c.slug==='denizli'?' · Pamukkale':''}</option>)}
      </select></label>
      <button disabled={state==='loading'} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{state==='loading'?t[3]:t[2]}</button>
    </form>
    <div role="status" className="my-3 text-sm text-slate-600">{state==='error'?t[5]:state==='loading'?t[3]:result?.products.length===0?t[4]:''}</div>
    {result?.sandbox&&<p className="mb-3 text-sm text-amber-800">{t[9]}</p>}
    {result?.language==='en'&&lang!=='en'&&<p className="mb-3 text-sm text-slate-600">{t[12]}</p>}
    {result?.products.map(p=><article key={p.code} className="travel-catalog-row">
      <div className="travel-catalog-photo">{p.photo&&<img src={p.photo} alt={p.title} width={720} height={480} loading="lazy" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.visibility='hidden'}}/>}</div>
      <div className="travel-catalog-info"><h3 className="font-semibold">{p.title}</h3><span className="text-sm text-slate-600">Viator</span></div>
      <div className="travel-catalog-action">{p.fromPrice!==undefined&&p.currency&&<span>{t[6]} {new Intl.NumberFormat(lang,{style:'currency',currency:p.currency}).format(p.fromPrice)}</span>}
        <a href={p.productUrl} target="_blank" rel="sponsored noopener noreferrer" className="rounded-xl border border-blue-200 px-4 py-3 font-semibold text-blue-700">{t[7]} ↗</a>
        <small className="block text-xs text-slate-500">{affiliateLabel(lang)} · Viator</small>
      </div>
    </article>)}
    {result&&<div className="mt-3 flex gap-3">{start>1&&<button className="rounded-xl border p-3" onClick={()=>void search(start-12)}>{t[11]}</button>}{result.products.length>0&&start+12<=result.totalCount&&start<97&&<button className="rounded-xl border p-3" onClick={()=>void search(start+12)}>{t[10]}</button>}</div>}
  </section>
}
