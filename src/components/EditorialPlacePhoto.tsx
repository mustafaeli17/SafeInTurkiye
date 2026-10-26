import {useState} from 'react';
import type {EditorialPlace} from '../lib/editorialDiscovery';
import {editorialDiscoveryCopy} from '../lib/editorialDiscoveryCopy';
export default function EditorialPlacePhoto({place,expanded,onOpen,lang}:{place:EditorialPlace;expanded:boolean;onOpen:()=>void;lang:string}){
 const [failed,setFailed]=useState<string[]>([]),t=editorialDiscoveryCopy[lang]??editorialDiscoveryCopy.en;
 const photos=(expanded?place.editorial.gallery:place.editorial.gallery.slice(0,1)).filter(src=>!failed.includes(src));
 if(!photos.length)return null;
 return <div className={expanded?'mb-3 grid gap-3 sm:grid-cols-2':'mb-3'}>{photos.map(src=><figure key={src} className="min-w-0"><button type="button" onClick={onOpen} className="block w-full overflow-hidden rounded-xl"><img src={src} alt={place.name??''} width={640} height={360} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="aspect-video w-full object-cover" onError={()=>setFailed(old=>[...old,src])}/></button><figcaption className="text-[11px] text-slate-500">{place.editorial.imageSource?<a className="underline" href={place.editorial.imageSource} target="_blank" rel="noopener noreferrer">{t[4]}</a>:t[0]}</figcaption></figure>)}</div>;
}
