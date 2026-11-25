import {cityWalkCopy, cityWalkSources} from '../data/cityWalkGuide';
import {localizePath} from '../lib/searchLocales';

export default function CityWalkGuide({city, lang}: {city: string; lang: string}) {
  if (city !== 'İstanbul' && city !== 'Antalya') return null;
  const t = cityWalkCopy[lang] ?? cityWalkCopy.en;
  const isIstanbul = city === 'İstanbul';
  const transitPath = '/transport?city=' + (isIstanbul ? 'istanbul' : 'antalya');

  return <details dir={lang === 'ar' ? 'rtl' : undefined} className="rounded-2xl border border-sky-100 bg-white p-5 text-sm text-slate-700">
    <summary className="min-h-11 cursor-pointer font-bold">{t[0]}</summary>
    <p className="my-3 leading-relaxed">{t[isIstanbul ? 1 : 2]}</p>
    <p className="text-xs leading-relaxed text-slate-600">{t[3]}</p>
    <div className="mt-3 flex flex-wrap gap-4">
      <a className="inline-flex min-h-11 items-center font-semibold text-blue-700" href={localizePath(transitPath, lang)}>{t[4]} →</a>
      <a className="inline-flex min-h-11 items-center underline" href={cityWalkSources[city].url} target="_blank" rel="noopener noreferrer">{t[5]} ↗</a>
    </div>
  </details>;
}
