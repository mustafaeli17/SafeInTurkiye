import { useEffect, useId, useState } from 'react'
import { taxiSearchUrl } from '../lib/taxiSearch'

export type TransitPlace = {label:string;lat:number;lng:number}
function parseTransitPlaces(data:any):TransitPlace[] {
  const seen=new Set<string>()
  return (Array.isArray(data?.features)?data.features:[]).flatMap((f:any)=>{
    const [lng,lat]=f?.geometry?.coordinates??[]
    const p=f?.properties??{}
    const label=[p.name,p.street,p.housenumber,p.district,p.city,p.state].filter((v,i,a)=>typeof v==='string'&&v&&a.indexOf(v)===i).join(', ')
    const id=`${lat},${lng},${label}`
    if(!label||typeof lat!=='number'||typeof lng!=='number'||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180||seen.has(id))return []
    seen.add(id);return [{label,lat,lng}]
  }).slice(0,5)
}
const messages:Record<string,[string,string,string]>={en:['Searching addresses…','No suggestions. Include the city or enter the full address.','Suggestions unavailable. You can still enter the full address.'],tr:['Adresler aranıyor…','Öneri bulunamadı. Şehir ekle veya tam adresi yaz.','Adres önerileri alınamadı. Tam adresi yazarak devam edebilirsin.'],de:['Adressen werden gesucht…','Keine Vorschläge. Stadt oder vollständige Adresse eingeben.','Vorschläge nicht verfügbar. Vollständige Adresse eingeben.'],fr:['Recherche d’adresses…','Aucune suggestion. Ajoutez la ville ou l’adresse complète.','Suggestions indisponibles. Saisissez l’adresse complète.'],ar:['جارٍ البحث عن العناوين…','لا توجد اقتراحات. أضف المدينة أو العنوان الكامل.','الاقتراحات غير متاحة. يمكنك إدخال العنوان الكامل.'],ru:['Поиск адресов…','Нет вариантов. Добавьте город или полный адрес.','Подсказки недоступны. Введите полный адрес.'],zh:['正在搜索地址…','没有建议。请添加城市或输入完整地址。','暂时无法提供建议，仍可输入完整地址。']}
export default function TransitAddressInput({label,value,onChange,onSelect,selected,locale,placeholder}:{label:string;value:string;onChange:(v:string)=>void;onSelect:(p:TransitPlace)=>void;selected:boolean;locale:string;placeholder:string}) {
  const id=useId(),[items,setItems]=useState<TransitPlace[]>([]),[state,setState]=useState(''),[open,setOpen]=useState(false),[active,setActive]=useState(-1)
  const t=messages[locale]??messages.en
  useEffect(()=>{
    setItems([]);setState('');setActive(-1)
    if(selected||value.trim().length<3)return
    const controller=new AbortController()
    const timer=setTimeout(async()=>{
      setState('loading')
      try{const res=await fetch(taxiSearchUrl(value),{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])});if(!res.ok)throw Error();const found=parseTransitPlaces(await res.json());if(!controller.signal.aborted){setItems(found);setState(found.length?'':'empty')}}catch{if(!controller.signal.aborted)setState('error')}
    },350)
    return()=>{clearTimeout(timer);controller.abort()}
  },[value,selected])
  const choose=(p:TransitPlace)=>{onSelect(p);setOpen(false);setItems([])}
  return <div className="relative min-w-0 flex-1"><label htmlFor={id} className="text-sm font-semibold">{label}</label><input id={id} required minLength={3} maxLength={250} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={open&&items.length>0} aria-controls={`${id}-list`} aria-activedescendant={open&&active>=0?`${id}-${active}`:undefined} value={value} placeholder={placeholder} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)} onChange={e=>{onChange(e.target.value);setOpen(true)}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);setActive(a=>Math.min(a+1,items.length-1))}if(e.key==='ArrowUp'){e.preventDefault();setActive(a=>Math.max(a-1,0))}if(e.key==='Enter'&&open&&active>=0&&items[active]){e.preventDefault();choose(items[active])}}} className="mt-1 w-full min-w-0 rounded-xl border border-sky-100 bg-slate-50 p-3 text-sm text-slate-900"/>
    {open&&items.length>0&&<div className="absolute z-30 w-full rounded-xl border border-sky-100 bg-white p-1 shadow-lg"><ul id={`${id}-list`} role="listbox" aria-label={label}>{items.map((item,i)=><li key={`${item.lat},${item.lng},${item.label}`} id={`${id}-${i}`} role="option" aria-selected={active===i} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(item)} className={`min-h-11 cursor-pointer break-words rounded-lg p-3 text-sm ${active===i?'bg-sky-100':'hover:bg-sky-50'}`}>{item.label}</li>)}</ul><a className="block px-3 py-1 text-xs text-slate-500" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap · Photon</a></div>}
    {open&&state&&<p role="status" className="mt-1 text-xs text-slate-500">{t[state==='loading'?0:state==='empty'?1:2]}</p>}
  </div>
}
