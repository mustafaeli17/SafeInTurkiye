import {track} from '@vercel/analytics';
import {trackingOptOut} from './analytics';
import {parseLocalePath,searchLanguages} from './searchLocales';

export const metricsConsentKey = 'sit-product-counts-opt-in';
export const metricsAvailable = import.meta.env.PROD && import.meta.env.VITE_PRODUCT_METRICS_ENABLED === 'true';
const events = ['taxi_search','taxi_estimate','taxi_no_fare','taxi_error','tours_search','tours_results','tours_empty','tours_error','viator_open'] as const;
type ProductEvent = typeof events[number];

export function productPageUrl(raw: string): string | null {
 try {
  const url = new URL(raw);
  if (!['https://www.safeinturkiye.com','https://safeinturkiye.com'].includes(url.origin) || url.username || url.password || url.hash) return null;
  if (!['/taxi','/tours'].includes(parseLocalePath(url.pathname).path)) return null;
  return url.origin + url.pathname;
 } catch { return null; }
}

export function productConsent(): boolean {
 if (!metricsAvailable || typeof window === 'undefined' || trackingOptOut(navigator)) return false;
 try { return localStorage.getItem(metricsConsentKey) === 'yes'; } catch { return false; }
}

// Only event names and language codes are eligible. Addresses, amounts, contact
// details and provider search text have no representation in this interface.
export function trackProduct(event: ProductEvent, language: string) {
 if (!productConsent() || !events.includes(event) || !searchLanguages.some(lang=>lang===language)) return;
 const url = productPageUrl(window.location.href);
 if (!url || !url.endsWith(event.startsWith('taxi_')?'/taxi':'/tours')) return;
 try { track(event, { language }); } catch { /* Measurement must not interrupt travel tools. */ }
}

export const metricsLabel:Record<string,string>={
 en:'Share anonymous taxi and tour usage counts with Vercel Analytics',tr:'Taksi ve tur kullanım sayılarını Vercel Analytics ile anonim olarak paylaş',
 de:'Anonyme Nutzungszahlen zu Taxis und Touren mit Vercel Analytics teilen',fr:'Partager les statistiques anonymes des taxis et des excursions avec Vercel Analytics',
 es:'Compartir estadísticas anónimas de uso de taxis y excursiones con Vercel Analytics',ru:'Делиться анонимной статистикой использования такси и туров с Vercel Analytics',
 ar:'مشاركة إحصاءات مجهولة عن استخدام خدمات التاكسي والجولات مع Vercel Analytics',zh:'与 Vercel Analytics 分享匿名的出租车和游览使用次数'
};
