import artwork from '../data/cityArtwork.json';

import {cityArtworkNotice} from '../lib/cityArtworkCopy';

export default function CityArtwork({city, lang='en', className, hero=false}: {city:string; lang?:string; className?:string; hero?:boolean}) {
  const photo=artwork.find(item=>item.name===city || item.slug===city);
  if (!photo) return null;
  return <img src={hero?photo.src:photo.thumbnail} srcSet={`${photo.thumbnail} 640w, ${photo.src} 1536w`} sizes={hero?'(max-width: 1024px) 100vw, 1100px':'(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px'} width={photo.width} height={photo.height} alt={`${photo.name} — ${cityArtworkNotice[lang]??cityArtworkNotice.en}`} title={cityArtworkNotice[lang]??cityArtworkNotice.en} loading={hero?'eager':'lazy'} decoding="async" className={className} />;
}
