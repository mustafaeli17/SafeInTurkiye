import { useEffect, useId, useRef, useState } from 'react'
import {addressSearchText,type AddressSearchState} from '../lib/addressSearchCopy'
export type TransitPlace={label:string;lat:number;lng:number;city:string;district?:string;mapQuery:string;provider:'google';attributions?:{provider:string;uri?:string}[]}
type Suggestion={label:string;placeId:string}
export default function TransitAddressInput({label,value,onChange,onSelect,selected,locale,placeholder,id:providedId,onSelectionPending}:{onSelectionPending?:(pending:Promise<TransitPlace|null>)=>void;label:string;value:string;onChange:(v:string)=>void;onSelect:(p:TransitPlace)=>void;selected:boolean;locale:string;placeholder:string;id?:string}) {
 const generatedId=useId(),id=providedId??generatedId
 const [items,setItems]=useState<Suggestion[]>([]),[state,setState]=useState<AddressSearchState>(''),[open,setOpen]=useState(false),[active,setActive]=useState(-1)
 const [attributions,setAttributions]=useState<NonNullable<TransitPlace['attributions']>>([])
 const session=useRef({token:'',started:0}),generation=useRef(0),selection=useRef<AbortController|null>(null)
 const language=['en','tr','de','fr','es','ar','ru','zh'].includes(locale)?locale:'en'
 useEffect(()=>{
  const version=++generation.current
  selection.current?.abort();setItems([]);setState('');setActive(-1)
  if(selected)return
  setAttributions([])
  if(value.trim().length<3){session.current={token:'',started:0};return}
  const controller=new AbortController()
  const timer=setTimeout(async()=>{
   if(!session.current.token||Date.now()-session.current.started>180000)session.current={token:crypto.randomUUID(),started:Date.now()}
   setState('loading')
   try{
    const response=await fetch('/api/address',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'suggest',query:value,language,sessionToken:session.current.token}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10000)])})
    if(!response.ok)throw Error()
    const data=await response.json();if(!Array.isArray(data.suggestions))throw Error()
    const found=data.suggestions.filter((p:Suggestion)=>typeof p.placeId==='string'&&typeof p.label==='string')
    if(!controller.signal.aborted&&version===generation.current){setItems(found);setState(found.length?'':'empty')}
   }catch{if(!controller.signal.aborted&&version===generation.current)setState('error')}
  },350)
  return()=>{clearTimeout(timer);controller.abort();selection.current?.abort();generation.current++}
 },[value,selected,language])
 const resolveSelection=async(item:Suggestion):Promise<TransitPlace|null>=>{
  selection.current?.abort();const controller=new AbortController();selection.current=controller
  const version=++generation.current,sessionToken=session.current.token
  session.current={token:'',started:0};setItems([]);setOpen(false);setState('loading')
  try{
   const response=await fetch('/api/address',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'resolve',placeId:item.placeId,language,sessionToken}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10000)])})
   if(!response.ok)throw Error()
   const {place}=await response.json()
   if(!place||!Number.isFinite(place.lat)||!Number.isFinite(place.lng)||place.provider!=='google'||place.mapQuery!==`place_id:${item.placeId}`)throw Error()
   if(!controller.signal.aborted&&version===generation.current){setState('');setAttributions(place.attributions??[]);const result={...place,label:item.label};onSelect(result);return result}
  }catch{if(!controller.signal.aborted&&version===generation.current)setState('error')}
  return null
 }
 const choose=(item:Suggestion)=>{const pending=resolveSelection(item);onSelectionPending?.(pending)}
 return <div className="relative min-w-0 flex-1"><label htmlFor={id} className="text-sm font-semibold">{label}</label><input id={id} required minLength={3} maxLength={250} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={open&&items.length>0} aria-controls={`${id}-list`} aria-activedescendant={open&&active>=0?`${id}-${active}`:undefined} value={value} placeholder={placeholder} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)} onChange={e=>{onChange(e.target.value);setOpen(true)}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);setActive(a=>Math.min(a+1,items.length-1))}if(e.key==='ArrowUp'){e.preventDefault();setActive(a=>Math.max(a-1,0))}if(e.key==='Enter'&&open&&active>=0&&items[active]){e.preventDefault();void choose(items[active])}}} className="mt-1 w-full min-w-0 rounded-xl border border-sky-100 bg-slate-50 p-3 text-sm text-slate-900"/>
 {open&&items.length>0&&<div className="absolute z-30 w-full rounded-xl border border-sky-100 bg-white p-1 shadow-lg"><ul id={`${id}-list`} role="listbox" aria-label={label}>{items.map((item,i)=><li key={item.placeId} id={`${id}-${i}`} role="option" aria-selected={active===i} onMouseDown={e=>e.preventDefault()} onClick={()=>void choose(item)} className={`min-h-11 cursor-pointer break-words rounded-lg p-3 text-sm ${active===i?'bg-sky-100':'hover:bg-sky-50'}`}>{item.label}</li>)}</ul><span translate="no" className="block whitespace-nowrap px-3 py-1 text-xs font-normal text-[#5e5e5e]">Google Maps</span></div>}
 {state&&<p role="status" className="mt-1 text-xs text-slate-500">{addressSearchText(locale,state)}</p>}
 {selected&&<div className="mt-1 text-xs font-normal text-[#5e5e5e]"><span translate="no">Google Maps</span>{attributions.map((a,i)=>a.uri?<a key={i} href={a.uri} target="_blank" rel="noreferrer"> · {a.provider}</a>:<span key={i}> · {a.provider}</span>)}</div>}
 </div>
}
