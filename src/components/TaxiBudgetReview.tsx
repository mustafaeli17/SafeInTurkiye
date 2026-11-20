import {useState} from 'react';
import {budgetIsCurrent,budgetReviewExpiresAt,taxiBudgets} from '../lib/taxiBudget';

const localDate=new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Istanbul'});
const dayMs=86_400_000;

export default function TaxiBudgetReview(){
  const [now,setNow]=useState(()=>Date.now());
  const rows=Object.entries(taxiBudgets).map(([city,budget])=>{
    const due=budgetReviewExpiresAt(budget.reviewedAt);
    const current=budgetIsCurrent(budget.reviewedAt,now);
    const status=current ? (due-now<=7*dayMs?'7 gün içinde':'Güncel') : (now>=due?'Süresi doldu':'Tarihi kontrol edin');
    return {city,budget,due,status};
  }).sort((a,b)=>a.due-b.due||a.city.localeCompare(b.city,'tr'));
  const needingReview=rows.filter(row=>row.status!=='Güncel').length;
  return <details className="admin-panel" onToggle={event=>{if(event.currentTarget.open)setNow(Date.now());}}>
    <summary className="min-h-11 cursor-pointer font-bold">Taksi tahminleri · {rows.length} şehir{needingReview>0&&<span className="ms-2 text-amber-800">Kontrol bekleyen {needingReview}</span>}</summary>
    <p>Hesaplayıcı öncelikle CMS’teki geçerli tarifeyi kullanır. Buradaki yerel örnekler, o tarife bulunamadığında bütçe tahmini için kullanılır. Kaynakları sonraki kontrol tarihinden önce yeniden inceleyin.</p>
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-start text-sm">
        <caption className="sr-only">Yerel taksi tahminleri için kaynak kontrol tarihleri, Türkiye saati</caption>
        <thead><tr>{['Şehir','Son kontrol','Sonraki kontrol','Durum','Kaynaklar'].map(label=><th key={label} scope="col" className="p-2 text-start">{label}</th>)}</tr></thead>
        <tbody>{rows.map(({city,budget,due,status})=><tr key={city} className="border-t border-slate-200 align-top">
          <th scope="row" className="p-2 text-start">{city}</th>
          <td className="p-2"><time dateTime={budget.reviewedAt}>{localDate.format(Date.parse(budget.reviewedAt+'T00:00:00+03:00'))}</time></td>
          <td className="p-2">{localDate.format(due)}</td>
          <td className={'whitespace-nowrap p-2 '+(status==='Güncel'?'text-slate-600':'font-semibold text-amber-800')}>{status}</td>
          <td className="p-2">{budget.sources.map(url=><a key={url} className="block py-1 text-blue-700 underline" href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname.replace(/^www\./,'')}</a>)}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </details>;
}
