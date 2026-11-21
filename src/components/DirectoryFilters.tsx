import {ArrowDownUp, Clock3, Star, X} from 'lucide-react'
import {discoveryFilterCopy} from '../lib/discoveryFilters'
import {updateLocationQuery} from '../lib/browserNavigation'

export default function DirectoryFilters({lang, params}: {lang:string; params:URLSearchParams}) {
  const t=discoveryFilterCopy[lang]??discoveryFilterCopy.en
  const order=params.get('order')??'recommended', rating=params.get('minRating')??'0', open=params.get('open')==='true'
  return <div className="directory-filters" role="group" aria-label={t[0]}>
    <label><ArrowDownUp size={16} aria-hidden="true"/><span>{t[1]}</span>
      <select aria-label={t[1]} value={order} onChange={e=>updateLocationQuery({order:e.target.value==='recommended'?null:e.target.value})}>
        {['recommended','distance','rating'].map((v,i)=><option key={v} value={v}>{t[2+i]}</option>)}
      </select>
    </label>
    <label><Star size={16} aria-hidden="true"/><span>{t[6]}</span>
      <select aria-label={t[6]} value={rating} onChange={e=>updateLocationQuery({minRating:e.target.value==='0'?null:e.target.value})}>
        <option value="0">{t[7]}</option>{['3','4','4.5'].map(v=><option key={v} value={v}>{Number(v).toLocaleString(lang)}+</option>)}
      </select>
    </label>
    <button type="button" aria-pressed={open} onClick={()=>updateLocationQuery({open:open?null:'true'})}><Clock3 size={16} aria-hidden="true"/>{t[5]}</button>
    {(order!=='recommended'||rating!=='0'||open)&&<button type="button" onClick={()=>updateLocationQuery({order:null,minRating:null,open:null})}><X size={16} aria-hidden="true"/>{t[8]}</button>}
  </div>
}
