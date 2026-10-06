import { useEffect, useState } from 'react';
import { ExternalLink, MapPin, Phone } from 'lucide-react';
import HomeButton from './HomeButton';
import {translatedDescription,photoEditingCopy} from '../lib/contentTranslation';
import type { DirectoryEntry } from '../lib/directory';
import { entryPath } from '../lib/directory';
import {localizedDetailPath} from '../lib/publicRoutes';
import { entryPhotos,contextLabel,illustrativeLabel } from '../lib/directoryPhotos';
import siteLogo from '../assets/safeinturkiye-logo.png';
import { useDetailSeo } from '../lib/useDetailSeo';
import { safeTelephone } from '../services/nearbyPlaces';
import {catalogWebsite} from '../lib/catalogLinks';
import RestaurantRequest from './RestaurantRequest';

const copy:Record<string,string[]> = {
  en:['Back to directory','Official website / reservations','Address','Phone','Published opening hours','Source checked','Source','Confirm current prices, hours and availability with the business. Reservations and payments take place on its official website, not SafeInTürkiye.','A licensed photo gallery is not available yet.','Directions','About','Not yet verified','Details'],
  tr:['Listeye dön','Resmî site / rezervasyon','Adres','Telefon','Yayımlanan çalışma saatleri','Kaynak kontrolü','Kaynak','Güncel fiyat, saat ve müsaitliği işletmeden teyit edin. Rezervasyon ve ödeme SafeInTürkiye’de değil, işletmenin resmî sitesinde yapılır.','Kullanım izni uygun fotoğraf galerisi henüz bulunmuyor.','Yol tarifi','Hakkında','Henüz doğrulanmadı','Detaylar'],
  de:['Zurück zur Übersicht','Offizielle Website / Reservierung','Adresse','Telefon','Veröffentlichte Öffnungszeiten','Quelle geprüft','Quelle','Preise, Zeiten und Verfügbarkeit beim Anbieter bestätigen. Buchungen und Zahlungen erfolgen auf dessen Website, nicht bei SafeInTürkiye.','Eine lizenzierte Fotogalerie ist noch nicht verfügbar.','Wegbeschreibung','Überblick','Noch nicht geprüft','Details'],
  fr:['Retour à la liste','Site officiel / réservation','Adresse','Téléphone','Horaires publiés','Source vérifiée','Source','Confirmez prix, horaires et disponibilités auprès de l’établissement. Réservations et paiements sur son site officiel, pas sur SafeInTürkiye.','Galerie de photos sous licence non disponible.','Itinéraire','Présentation','Pas encore vérifié','Détails'],
  ar:['العودة للقائمة','الموقع الرسمي / الحجز','العنوان','الهاتف','ساعات العمل المنشورة','تاريخ التحقق','المصدر','أكد الأسعار والمواعيد والتوفر مع المنشأة. الحجز والدفع عبر موقعها الرسمي وليس SafeInTürkiye.','معرض صور مرخص غير متوفر بعد.','الاتجاهات','نبذة','لم يتم التحقق بعد','التفاصيل'],
  ru:['К списку','Официальный сайт / бронирование','Адрес','Телефон','Опубликованные часы работы','Дата проверки','Источник','Уточняйте цены, часы и наличие мест у организации. Бронирование и оплата на её официальном сайте, не в SafeInTürkiye.','Лицензированная фотогалерея пока недоступна.','Как добраться','Описание','Ещё не проверено','Подробнее'],
  zh:['返回列表','官方网站 / 预订','地址','电话','公布的营业时间','核实日期','来源','请向商家确认最新价格、时间和空位。预订和付款在商家官网进行，而非 SafeInTürkiye。','暂无获得许可的照片集。','路线','简介','尚未核实','详情'],
};

export default function DirectoryDetail({entry,lang,onBack}:{entry:DirectoryEntry;lang:string;onBack:()=>void}) {
  const t = copy[lang] ?? copy.en;
  const description = translatedDescription(entry,lang);
  const gallery = entryPhotos(entry);
  const [selected,setSelected]=useState(0);
  const [failed,setFailed]=useState<string[]>([]);
  const website=catalogWebsite(entry.website);
  const phone=safeTelephone(entry.phone);
  const canonicalPath=localizedDetailPath(entryPath(entry),lang);
  useDetailSeo(`${entry.name} | SafeInTürkiye`,description,canonicalPath);
  useEffect(() => {
    window.scrollTo(0,0);
    const existing=document.getElementById('public-page-schema');
    const schema=existing instanceof HTMLScriptElement?existing:document.createElement('script'); schema.id='public-page-schema';schema.type='application/ld+json';schema.dataset.directory='true';
    schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':entry.kind==='hotels'?'Hotel':entry.kind==='restaurants'?'Restaurant':'Place',name:entry.name,url:`https://www.safeinturkiye.com${canonicalPath}`,description,...(entry.address?{address:entry.address}:{}),...(phone?{telephone:phone.phone}:{}),...(website?{sameAs:website}:{})});
    document.documentElement.lang=lang;
    document.head.appendChild(schema);
    return () => { schema.remove(); };
  },[entry,description,phone?.phone,website,canonicalPath,lang]);
  const current=gallery[selected]??gallery[0];
  return <main dir={lang==='ar'?'rtl':'ltr'} className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <a href="/" aria-label="SafeInTürkiye"><img src={siteLogo} alt="SafeInTürkiye" className="w-40 h-auto" /></a>
    <HomeButton lang={lang} onClick={onBack}/>
    {entry.description.tr&&<nav aria-label={lang==='tr'?'Dil':'Language'} className="flex gap-3 text-sm text-blue-700"><a href={entryPath(entry)} hrefLang="en" onClick={()=>localStorage.setItem('safeinturkiye-language','en')} aria-current={lang==='en'?'page':undefined}>English</a><a href={`/tr${entryPath(entry)}`} hrefLang="tr" onClick={()=>localStorage.setItem('safeinturkiye-language','tr')} aria-current={lang==='tr'?'page':undefined}>Türkçe</a></nav>}
    <header><p className="text-sm font-bold text-blue-600">{entry.city}</p><h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{entry.name}</h1></header>
    <section aria-label={entry.name} className="rounded-2xl overflow-hidden border border-sky-100 bg-white">
      {current && !failed.includes(current.src) ? <div className="relative"><img src={current.src} srcSet={current.variants?.map(v=>`${v.src} ${v.width}w`).join(', ')} sizes="(max-width: 1024px) 100vw, 1024px" width={current.width} height={current.height} style={{objectPosition:`${current.focalX??50}% ${current.focalY??50}%`}} alt={lang==='en'?(current.alt??entry.name):entry.name} decoding="async" onError={()=>setFailed(previous=>[...previous,current.src])} className="w-full h-64 sm:h-96 object-cover" />{current.cityContext&&<p className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-white text-xs px-4 py-2">{contextLabel(lang,current.cityContext)}</p>}</div> : <p className="p-8 text-sm text-slate-500">{t[8]}</p>}
      {current?.illustrative&&<p className="px-3 py-2 text-xs text-slate-600">{illustrativeLabel(lang)}</p>}
      {gallery.length>1 && <div className="flex flex-wrap gap-2 p-3">{gallery.map((photo,index)=><button key={photo.src} onClick={()=>setSelected(index)} aria-pressed={index===selected} className="min-h-11 min-w-11 rounded-lg border border-sky-200 px-3">{index+1}</button>)}</div>}
      {current?.source && <p className="p-3 text-xs text-slate-500"><a className="underline" href={current.source} target="_blank" rel="noreferrer">{current.author}</a> · <a href={current.licenseUrl} target="_blank" rel="noreferrer">{current.license}</a>{current.captureDate&&<> · {current.captureDate}</>}<br/>{photoEditingCopy[lang]??photoEditingCopy.en}</p>}
    </section>
    <div className="grid md:grid-cols-3 gap-6"><section className="md:col-span-2 rounded-2xl border border-sky-100 bg-white p-6 space-y-4"><h2 className="text-xl font-bold">{t[10]}</h2><p lang={lang} className="leading-relaxed text-slate-600">{description}</p><dl className="space-y-4 text-sm">{entry.address && <div><dt className="font-bold flex gap-2"><MapPin className="w-4 h-4" />{t[2]}</dt><dd>{entry.address}</dd></div>}{phone && <div><dt className="font-bold flex gap-2"><Phone className="w-4 h-4" />{t[3]}</dt><dd><a className="text-blue-700 underline" href={phone.telephoneUrl}>{phone.phone}</a></dd></div>}{entry.openingHours && <div><dt className="font-bold">{t[4]}</dt><dd>{entry.openingHours}</dd></div>}</dl></section>
    <aside className="rounded-2xl border border-sky-100 bg-white p-6 space-y-4">{website && <a href={website} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 bg-[#087FFF] text-white p-3 rounded-xl font-bold">{t[1]}<ExternalLink className="w-4 h-4 shrink-0" /></a>}{entry.address && <a className="block text-blue-700 underline min-h-11" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(entry.address)}`} target="_blank" rel="noreferrer">{t[9]}</a>}<p className="text-xs leading-relaxed text-slate-600">{t[7]}</p><p className="text-xs text-slate-500">{t[5]}: {entry.lastVerified ?? t[11]}</p>{catalogWebsite(entry.sourceUrl)&&<a className="text-xs text-blue-700 underline" href={catalogWebsite(entry.sourceUrl)!} target="_blank" rel="noreferrer">{t[6]}</a>}</aside></div>
    {entry.kind==='restaurants' && <RestaurantRequest name={entry.name} source={entry.sourceUrl} lang={lang}/>}
  </main>;
}
