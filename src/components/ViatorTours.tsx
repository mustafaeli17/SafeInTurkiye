import { useEffect, useRef, useState } from 'react'
import { publicCities } from '../lib/publicRoutes'
import { toursLabel, tourFilterCopy } from '../lib/viatorCopy'
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
type Result = { products: { code:string; title:string; description?:string; productUrl:string; photo?:string; fromPrice?:number; currency?:string }[]; totalCount:number; sandbox:boolean; language:string }
const emptyFilters = { minPrice:'',maxPrice:'',duration:'any',rating:'any',date:'',sort:'recommended',currency:'EUR',private:false,freeCancellation:false,skipLine:false }
const affiliateLabel = (lang:string) => ({en:'Affiliate link',tr:'İş ortağı bağlantısı',de:'Affiliate-Link',fr:'Lien affilié',ar:'رابط تسويق بالعمولة',ru:'Партнёрская ссылка',zh:'联盟推广链接',es:'Enlace de afiliado'}[lang] ?? 'Affiliate link')
export default function ViatorTours({ lang, initialCity='istanbul' }: { lang:string; initialCity?:string }) {
  const t=copy[lang] ?? copy.en
  const f=tourFilterCopy(lang)
  const [city,setCity]=useState(initialCity), [result,setResult]=useState<Result|null>(null), [state,setState]=useState('idle'), [start,setStart]=useState(1)
  const [filters,setFilters]=useState(emptyFilters)
  const controller=useRef<AbortController|null>(null)
  useEffect(()=>{controller.current?.abort();setResult(null);setState('idle');setStart(1);return()=>controller.current?.abort()},[lang,city,filters])
  const inputClass='min-h-11 w-full min-w-0 rounded-xl border border-blue-200 bg-white p-3'
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'})
  const update=(key:keyof typeof emptyFilters,value:string|boolean)=>setFilters(previous=>({...previous,[key]:value}))
  async function search(offset=1) {
    controller.current?.abort(); const current=new AbortController();controller.current=current
    setState('loading');setResult(null)
    try {
      const query=new URLSearchParams({city,lang,start:String(offset)})
      Object.entries(filters).forEach(([key,value])=>{if(value!==''&&value!==false)query.set(key,String(value))})
      const r=await fetch(`/api/viator?${query}`,{signal:AbortSignal.any([current.signal,AbortSignal.timeout(20000)]),cache:'no-store'})
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
    <p className="mb-4 text-sm text-slate-600">{f[20]}</p>
    <form onSubmit={e=>{e.preventDefault();void search()}} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1 text-sm">{t[1]}<select value={city} onChange={e=>setCity(e.target.value)} className={inputClass}>
        {publicCities.map(c=><option key={c.slug} value={c.slug}>{c.name}{c.slug==='mugla'?' · Bodrum':c.slug==='aydin'?' · Kuşadası':c.slug==='denizli'?' · Pamukkale':''}</option>)}
      </select></label>
      <label className="grid gap-1 text-sm">{f[0]}<select value={filters.sort} onChange={e=>update('sort',e.target.value)} className={inputClass}>{['recommended','priceAsc','priceDesc','rating'].map((v,i)=><option key={v} value={v}>{f[1+i]}</option>)}</select></label>
      <label className="grid gap-1 text-sm">{f[17]}<select value={filters.currency} onChange={e=>update('currency',e.target.value)} className={inputClass}>{['EUR','USD','GBP','TRY','AED','CNY'].map(v=><option key={v}>{v}</option>)}</select></label>
      <label className="grid gap-1 text-sm">{f[5]} ({filters.currency})<input type="number" min="0" max={filters.maxPrice||100000} step="0.01" value={filters.minPrice} onChange={e=>update('minPrice',e.target.value)} className={inputClass}/></label>
      <label className="grid gap-1 text-sm">{f[6]} ({filters.currency})<input type="number" min={Number(filters.minPrice)||0.01} max="100000" step="0.01" value={filters.maxPrice} onChange={e=>update('maxPrice',e.target.value)} className={inputClass}/></label>
      <label className="grid gap-1 text-sm">{f[7]}<select value={filters.duration} onChange={e=>update('duration',e.target.value)} className={inputClass}>{['any','short','day','multi'].map((v,i)=><option key={v} value={v}>{f[8+i]}</option>)}</select></label>
      <label className="grid gap-1 text-sm">{f[12]}<select value={filters.rating} onChange={e=>update('rating',e.target.value)} className={inputClass}><option value="any">{f[8]}</option><option value="3">3+ / 5</option><option value="4">4+ / 5</option></select></label>
      <label className="grid gap-1 text-sm">{f[13]}<input type="date" min={today} value={filters.date} onChange={e=>update('date',e.target.value)} className={inputClass}/></label>
      <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">{(['private','freeCancellation','skipLine'] as const).map((key,i)=><label key={key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={filters[key]} onChange={e=>update(key,e.target.checked)} className="h-5 w-5"/>{f[14+i]}</label>)}</div>
      <button disabled={state==='loading'} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{state==='loading'?t[3]:t[2]}</button>
      <button type="button" onClick={()=>setFilters({...emptyFilters})} className="min-h-11 rounded-xl border border-blue-200 px-4 py-3 text-blue-700">{f[18]}</button>
    </form>
    <div role="status" className="my-3 text-sm text-slate-600">{state==='error'?t[5]:state==='loading'?t[3]:result?.products.length===0?t[4]:''}</div>
    {result?.sandbox&&<p className="mb-3 text-sm text-amber-800">{t[9]}</p>}
    {result?.language==='en'&&lang!=='en'&&<p className="mb-3 text-sm text-slate-600">{t[12]}</p>}
    {result&&result.products.length>0&&<p className="my-3 text-sm text-slate-600">{f[19]}: {new Intl.NumberFormat(lang).format(result.totalCount)} · {start}–{start+result.products.length-1}</p>}
    {result?.products.map(p=><article key={p.code} className="travel-catalog-row">
      <div className="travel-catalog-photo">{p.photo&&<img src={p.photo} alt={p.title} width={720} height={480} loading="lazy" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.visibility='hidden'}}/>}</div>
      <div className="travel-catalog-info"><h2 className="font-semibold">{p.title}</h2><span className="text-sm text-slate-600">Viator</span>{p.description&&<details className="mt-2 text-sm text-slate-600"><summary className="min-h-11 cursor-pointer py-2 text-blue-700">{f[21]}</summary><p>{p.description}</p></details>}</div>
      <div className="travel-catalog-action">{p.fromPrice!==undefined&&p.currency&&<span>{t[6]} {new Intl.NumberFormat(lang,{style:'currency',currency:p.currency}).format(p.fromPrice)}</span>}
        <a href={p.productUrl} target="_blank" rel="sponsored noopener noreferrer" className="rounded-xl border border-blue-200 px-4 py-3 font-semibold text-blue-700">{t[7]} ↗</a>
        <small className="block text-xs text-slate-500">{affiliateLabel(lang)} · Viator</small>
      </div>
    </article>)}
    {result&&<div className="mt-3 flex gap-3">{start>1&&<button className="rounded-xl border p-3" onClick={()=>void search(start-12)}>{t[11]}</button>}{result.products.length>0&&start+12<=result.totalCount&&start<9997&&<button className="rounded-xl border p-3" onClick={()=>void search(start+12)}>{t[10]}</button>}</div>}
  </section>
}
