import { useEffect, useState } from 'react';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, Droplets, Loader2, Moon, RefreshCw, Sun, Wind } from 'lucide-react';
import { getCurrentWeather, TravelDataError } from '../services/travelDataService';
import type { CurrentWeather } from '../services/travelDataService';

const labels = {
  en: { title: 'Current weather', loading: 'Loading weather…', unavailable: 'Weather is unavailable right now.', timeout: 'The weather service took too long to respond.', retry: 'Try again', humidity: 'Humidity', wind: 'Wind', source: 'Weather model · Open-Meteo', asOf: 'Conditions for', stale: 'Older weather data — check the time shown.', pending: 'Weather service is not connected yet.', clear: 'Clear', cloudy: 'Cloudy', fog: 'Fog', rain: 'Rain', snow: 'Snow', storm: 'Thunderstorm', unknown: 'Conditions unavailable' },
  tr: { title: 'Güncel hava durumu', loading: 'Hava durumu yükleniyor…', unavailable: 'Hava durumu şu anda alınamıyor.', timeout: 'Hava durumu hizmeti zamanında yanıt vermedi.', retry: 'Tekrar dene', humidity: 'Nem', wind: 'Rüzgâr', source: 'Hava tahmin modeli · Open-Meteo', asOf: 'Veri zamanı', stale: 'Eski hava verisi — gösterilen zamanı kontrol edin.', pending: 'Hava durumu hizmeti henüz bağlanmadı.', clear: 'Açık', cloudy: 'Bulutlu', fog: 'Sisli', rain: 'Yağmurlu', snow: 'Karlı', storm: 'Gök gürültülü', unknown: 'Hava koşulları bilinmiyor' },
  de: { title: 'Aktuelles Wetter', loading: 'Wetter wird geladen…', unavailable: 'Wetter derzeit nicht verfügbar.', timeout: 'Der Wetterdienst antwortet nicht rechtzeitig.', retry: 'Erneut versuchen', humidity: 'Feuchtigkeit', wind: 'Wind', source: 'Wettermodell · Open-Meteo', asOf: 'Datenstand', stale: 'Ältere Wetterdaten — Zeitpunkt prüfen.', pending: 'Der Wetterdienst ist noch nicht verbunden.', clear: 'Klar', cloudy: 'Bewölkt', fog: 'Nebel', rain: 'Regen', snow: 'Schnee', storm: 'Gewitter', unknown: 'Wetterlage unbekannt' },
  fr: { title: 'Météo actuelle', loading: 'Chargement de la météo…', unavailable: 'Météo indisponible pour le moment.', timeout: 'Le service météo met trop de temps à répondre.', retry: 'Réessayer', humidity: 'Humidité', wind: 'Vent', source: 'Modèle météo · Open-Meteo', asOf: 'Données du', stale: 'Données météo anciennes — vérifiez la date.', pending: 'Le service météo n’est pas encore connecté.', clear: 'Dégagé', cloudy: 'Nuageux', fog: 'Brouillard', rain: 'Pluie', snow: 'Neige', storm: 'Orage', unknown: 'Conditions indisponibles' },
  ar: { title: 'الطقس الحالي', loading: 'جارٍ تحميل الطقس…', unavailable: 'الطقس غير متاح الآن.', timeout: 'استغرق الرد من خدمة الطقس وقتًا طويلاً.', retry: 'إعادة المحاولة', humidity: 'الرطوبة', wind: 'الرياح', source: 'نموذج الطقس · Open-Meteo', asOf: 'وقت البيانات', stale: 'بيانات طقس قديمة — تحقق من الوقت المعروض.', pending: 'خدمة الطقس غير متصلة بعد.', clear: 'صافٍ', cloudy: 'غائم', fog: 'ضباب', rain: 'مطر', snow: 'ثلج', storm: 'عاصفة رعدية', unknown: 'حالة الطقس غير متاحة' },
  ru: { title: 'Текущая погода', loading: 'Загрузка погоды…', unavailable: 'Погода сейчас недоступна.', timeout: 'Сервис погоды не ответил вовремя.', retry: 'Повторить', humidity: 'Влажность', wind: 'Ветер', source: 'Модель погоды · Open-Meteo', asOf: 'Время данных', stale: 'Устаревшие данные — проверьте время.', pending: 'Сервис погоды пока не подключён.', clear: 'Ясно', cloudy: 'Облачно', fog: 'Туман', rain: 'Дождь', snow: 'Снег', storm: 'Гроза', unknown: 'Условия неизвестны' },
  zh: { title: '当前天气', loading: '正在加载天气…', unavailable: '当前无法获取天气。', timeout: '天气服务响应超时。', retry: '重试', humidity: '湿度', wind: '风速', source: '天气模型 · Open-Meteo', asOf: '数据时间', stale: '天气数据较旧，请查看显示时间。', pending: '天气服务尚未连接。', clear: '晴朗', cloudy: '多云', fog: '有雾', rain: '有雨', snow: '下雪', storm: '雷暴', unknown: '天气未知' },
};

function condition(code: number): 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm' | 'unknown' {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([95, 96, 99].includes(code)) return 'storm';
  return 'unknown';
}

export function WeatherCard({ lat, lng, cityName, lang = 'en' }: { lat: number; lng: number; cityName: string; lang?: string }) {
  const locale = lang in labels ? lang as keyof typeof labels : 'en';
  const t = labels[locale];
  const requestKey = `${lat},${lng}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; data?: CurrentWeather; error?: string }>({ key: '' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ key: requestKey });
    getCurrentWeather(lat, lng, controller.signal)
      .then(data => { if (!controller.signal.aborted) setState({ key: requestKey, data }); })
      .catch(error => { if (!controller.signal.aborted) setState({ key: requestKey, error: error instanceof TravelDataError ? error.kind : 'unavailable' }); });
    return () => controller.abort();
  }, [lat, lng, requestKey, attempt]);

  // A prop change renders before its effect runs. Never show the previous city's
  // temperature even for that first render, or after an obsolete response.
  const visible = state.key === requestKey ? state : { key: requestKey };
  const weather = visible.data;
  const kind = weather ? condition(weather.code) : 'unknown';
  const Icon = kind === 'clear' ? (weather?.isDay ? Sun : Moon) : kind === 'rain' ? CloudRain : kind === 'snow' ? CloudSnow : kind === 'storm' ? CloudLightning : kind === 'fog' ? CloudFog : Cloud;

  return <section className="p-5 bg-white rounded-2xl border border-sky-100 shadow-sm space-y-3 min-w-0" aria-label={`${cityName} — ${t.title}`} aria-live="polite">
    <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">{t.title}</span>
    {!weather && !visible.error && <p className="flex items-center gap-2 text-sm text-slate-600 py-4"><Loader2 className="w-5 h-5 animate-spin text-[#00A3E0]" />{t.loading}</p>}
    {visible.error && <div className="space-y-3 py-2">
      <p className="text-[13px] text-slate-600">{visible.error === 'timeout' ? t.timeout : visible.error === 'unconfigured' ? t.pending : t.unavailable}</p>
      <button type="button" onClick={() => setAttempt(value => value + 1)} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-sky-700 rounded-lg border border-sky-200 px-3 py-2 hover:bg-sky-50"><RefreshCw className="w-3.5 h-3.5" />{t.retry}</button>
    </div>}
    {weather && <>
      <div className="flex items-center gap-3"><Icon className={`w-10 h-10 ${kind === 'clear' ? 'text-amber-500' : 'text-[#00A3E0]'}`} /><div><span className="text-3xl font-black text-slate-900">{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(weather.temperature)}°C</span><span className="text-[12px] text-slate-500 block">{t[kind]}</span></div></div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 border-t border-slate-100 text-[12px] text-slate-600"><span className="flex items-center gap-1.5"><Droplets className="w-4 h-4 text-[#00A3E0]" />{t.humidity}: {weather.humidity}%</span><span className="flex items-center gap-1.5"><Wind className="w-4 h-4 text-[#00A3E0]" />{t.wind}: {weather.windSpeed} km/h</span></div>
      <p className="text-[11px] text-slate-500">{t.asOf}: <time dateTime={new Date(weather.time).toISOString()}>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(weather.time)}</time> (UTC+3)</p>
    </>}
    <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="block text-[10px] text-slate-500 underline underline-offset-2">{t.source}</a>
  </section>;
}
