import {useEffect} from 'react';
import {localizePath, type SearchLanguage} from '../lib/searchLocales';

const labels: Record<SearchLanguage, {missing:string; temporary:string; retry:string; home:string}> = {
  en:{missing:'Page not found',temporary:'This page could not be loaded',retry:'Try again',home:'Back to home'},
  tr:{missing:'Sayfa bulunamadı',temporary:'Sayfa yüklenemedi',retry:'Tekrar dene',home:'Ana sayfaya dön'},
  de:{missing:'Seite nicht gefunden',temporary:'Die Seite konnte nicht geladen werden',retry:'Erneut versuchen',home:'Zur Startseite'},
  fr:{missing:'Page introuvable',temporary:'Impossible de charger cette page',retry:'Réessayer',home:'Retour à l’accueil'},
  es:{missing:'Página no encontrada',temporary:'No se pudo cargar la página',retry:'Volver a intentar',home:'Volver al inicio'},
  ar:{missing:'الصفحة غير موجودة',temporary:'تعذّر تحميل الصفحة',retry:'إعادة المحاولة',home:'العودة إلى الصفحة الرئيسية'},
  ru:{missing:'Страница не найдена',temporary:'Не удалось загрузить страницу',retry:'Попробовать снова',home:'На главную'},
  zh:{missing:'找不到此页面',temporary:'暂时无法加载此页面',retry:'重试',home:'返回首页'},
};

export default function PageNotice({lang,onRetry}:{lang:SearchLanguage;onRetry?:()=>void}) {
  const t=labels[lang];
  const heading=onRetry?t.temporary:t.missing;
  const home=localizePath('/',lang);
  useEffect(()=>{
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    document.title=heading+' | SafeInTürkiye';
  },[lang,heading]);
  return <main lang={lang} dir={lang==='ar'?'rtl':'ltr'} className="mx-auto max-w-xl px-6 py-16 text-slate-900">
    <a href={home} className="inline-flex min-h-11 items-center"><img src="/brand-logo.webp" width="150" height="50" alt="SafeInTürkiye"/></a>
    <h1 className="mt-8 text-3xl font-bold">{heading}</h1>
    <div className="mt-6 flex flex-wrap items-center gap-4">
      {onRetry && <button type="button" onClick={onRetry} className="min-h-11 rounded-xl bg-blue-700 px-5 py-2 font-semibold text-white">{t.retry}</button>}
      <a className="inline-flex min-h-11 items-center font-semibold text-blue-700 underline" href={home}>{t.home}</a>
    </div>
  </main>;
}
