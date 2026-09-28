import { ExternalLink, MapPin } from 'lucide-react';
import guides from '../data/cityGuides.json';
import { WeatherCard } from './WeatherCard';
import NearbyPlaces from './NearbyPlaces';
import { useDetailSeo } from '../lib/useDetailSeo';
import siteLogo from '../assets/safeinturkiye-logo.png';
import photos from '../lib/placePhotos.json';
import HomeButton from './HomeButton';
import { curatedDirectory, openDirectoryEntry } from '../lib/directory';
import PlacePhoto from './PlacePhoto';
import { detailLabel } from '../lib/directoryLabels';

export default function CityGuide({city,language,onBack}:{city:typeof guides[number];language:string;onBack:()=>void}) {
  const tr=language==='tr';
  const description=tr?city.description.tr:city.description.en;
  const photo=photos[city.slug as keyof typeof photos];
  useDetailSeo(`${city.name} | SafeInTürkiye`,description,`/cities/${city.slug}`);
  return <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <a href="/" aria-label="SafeInTürkiye"><img src={siteLogo} alt="SafeInTürkiye" className="w-40 h-auto" /></a>
    <HomeButton lang={language} onClick={onBack}/>
    <header className="city-photo-banner relative rounded-3xl overflow-hidden shadow-sm flex items-end p-6 text-white">
      <img src={photo.src} width={photo.width} height={photo.height} alt={`${city.name} — ${city.focus}`} className="absolute inset-0 w-full h-full object-cover" fetchPriority="high"/>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent"/>
      <div className="relative z-10"><h1 className="text-3xl font-black">{city.name}</h1><p className="text-sm text-white">{city.focus}</p></div>
    </header>
    <p lang={tr?'tr':'en'} className="text-sm text-slate-600 leading-relaxed">{description}</p>
    {(['hotels','restaurants','activities'] as const).map(kind=>{
      const entries=curatedDirectory.filter(entry=>entry.city===city.name&&entry.kind===kind);
      if(!entries.length)return null;
      const title=kind==='hotels'?(tr?'Oteller':'Hotels'):kind==='restaurants'?(tr?'Restoranlar':'Restaurants'):(tr?'Gezilecek yerler ve aktiviteler':'Places and activities');
      return <section key={kind} className="space-y-3"><h2 className="text-xl font-bold text-slate-900">{title}</h2><div className="grid sm:grid-cols-3 gap-3">{entries.map(entry=><article key={entry.id} className="bg-white border border-sky-100 rounded-2xl overflow-hidden">
        <div className="h-40 overflow-hidden"><PlacePhoto id={entry.id} name={entry.name} lang={language}/></div>
        <div className="p-4"><h3 className="font-bold text-sm text-slate-900">{entry.name}</h3><p lang={tr?'tr':'en'} className="mt-2 text-xs text-slate-600 leading-relaxed">{entry.description[language]??entry.description.en}</p><button onClick={()=>openDirectoryEntry(entry.id)} className="min-h-11 mt-2 text-sm font-bold text-blue-700">{detailLabel(language)} →</button></div>
      </article>)}</div></section>;
    })}
    <section className="grid sm:grid-cols-2 gap-6"><WeatherCard lat={city.lat} lng={city.lng} cityName={city.focus} lang={language}/><div className="bg-white border border-sky-100 rounded-2xl p-5"><h2 className="font-bold text-xl">{tr?'Öne çıkan yerler':'Places to explore'}</h2><ul className="mt-3 space-y-3">{city.places.map(place=><li key={place} className="flex gap-2"><MapPin size={18} className="text-blue-600 shrink-0"/>{place}</li>)}</ul></div></section>
    <details className="text-xs text-slate-500"><summary className="cursor-pointer">{tr?'Kaynak ve görsel bilgileri':'Sources and photo credits'}</summary><a className="inline-flex gap-2 items-center min-h-11 text-blue-700 underline" href={city.source} target="_blank" rel="noreferrer">GoTürkiye <ExternalLink size={14}/></a><p>{tr?'Kaynak kontrolü':'Source checked'}: {city.verified}</p><p><a href={photo.source} target="_blank" rel="noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a> · WebP</p></details>
    <NearbyPlaces lang={language} kind="essential" center={{lat:city.lat,lng:city.lng}} cityName={city.name==='Muğla'?'Bodrum':city.name==='Aydın'?'Kuşadası':city.name==='Denizli'?'Pamukkale':city.name}/>
    <NearbyPlaces lang={language} kind="exchange" center={{lat:city.lat,lng:city.lng}} cityName={city.name==='Muğla'?'Bodrum':city.name==='Aydın'?'Kuşadası':city.name==='Denizli'?'Pamukkale':city.name}/>
  </main>;
}
