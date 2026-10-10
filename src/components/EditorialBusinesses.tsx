import {useEffect,useRef} from 'react'
import type {DirectoryEntry} from '../lib/directory'
import {entryPath} from '../lib/directory'
import {foundationEnabled} from '../lib/foundationConfig'
import {entryPhotos} from '../lib/directoryPhotos'
import {trackBusinessEvent} from '../lib/businessEvents'
const copy:Record<string,string>={es:'Lugares seleccionados',en:'Selected places',tr:'Seçili yerler',de:'Ausgewählte Orte',fr:'Lieux sélectionnés',ar:'أماكن مختارة',ru:'Избранные места',zh:'精选地点'}
export default function EditorialBusinesses({entries,lang}:{entries:DirectoryEntry[];lang:string}){
 const root=useRef<HTMLElement>(null)
 useEffect(()=>{
  if(!foundationEnabled||!root.current||!('IntersectionObserver' in window))return
  const observer=new IntersectionObserver(items=>{for(const item of items)if(item.isIntersecting){const key=(item.target as HTMLElement).dataset.businessKey;if(key)trackBusinessEvent(key,'impression',key.split('/')[0]);observer.unobserve(item.target)}},{threshold:0.5})
  root.current.querySelectorAll('[data-business-key]').forEach(node=>observer.observe(node))
  return()=>observer.disconnect()
 },[entries])
 if(!foundationEnabled||!entries.length)return null
 return <section ref={root} className="mt-5 space-y-3"><h2 className="text-xl font-bold">{copy[lang]??copy.en}</h2><div className="grid gap-3 sm:grid-cols-2">{entries.map(entry=>{const photo=entryPhotos(entry)[0];return <a data-business-key={`${entry.kind}/${entry.id}`} href={entryPath(entry)} key={entry.id} className="rounded-xl border border-sky-100 bg-white overflow-hidden">{photo&&<img src={photo.src} alt={entry.name} width="640" height="360" loading="lazy" className="w-full h-40 object-cover"/>}<div className="p-4"><h3 className="font-bold">{entry.name}</h3><p className="text-sm">{entry.city}</p></div></a>})}</div></section>
}
