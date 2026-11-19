import type { CurrencyCode } from '../services/travelDataService';
/** Local vector flags: no external image requests; currency codes remain visible. */
export default function CurrencyFlag({code}:{code:CurrencyCode}) {
 const stars=(cx:number,cy:number,r:number,color:string)=><polygon fill={color} points={Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2;const radius=i%2?r*.4:r;return `${cx+Math.cos(a)*radius},${cy+Math.sin(a)*radius}`}).join(' ')}/>;
 return <svg className="exchange-currency-flag" viewBox="0 0 60 40" aria-hidden="true" focusable="false" data-currency={code}>
 {code==='EUR'&&<><path fill="#003399" d="M0 0h60v40H0z"/>{Array.from({length:12},(_,i)=><g key={i}>{stars(30+12*Math.sin(i*Math.PI/6),20-12*Math.cos(i*Math.PI/6),2.3,'#ffcc00')}</g>)}</>}
 {code==='USD'&&<><path fill="white" d="M0 0h60v40H0z"/>{Array.from({length:7},(_,i)=><path key={i} fill="#b22234" d={`M0 ${i*80/13}h60v${40/13}H0z`}/>)}<path fill="#3c3b6e" d="M0 0h25v22H0z"/>{Array.from({length:9},(_,row)=>Array.from({length:row%2?5:6},(_,col)=><g key={`${row}-${col}`}>{stars(2+col*4+(row%2?2:0),2+row*2.2,.9,'white')}</g>))}</>}
 {code==='GBP'&&<><path fill="#012169" d="M0 0h60v40H0z"/><path stroke="white" strokeWidth="9" d="m0 0 60 40M60 0 0 40"/><path stroke="#c8102e" strokeWidth="3" d="m0 0 60 40M60 0 0 40"/><path stroke="white" strokeWidth="14" d="M30 0v40M0 20h60"/><path stroke="#c8102e" strokeWidth="8" d="M30 0v40M0 20h60"/></>}
 {code==='CHF'&&<><path fill="#da291c" d="M0 0h60v40H0z"/><path fill="white" d="M26 8h8v8h8v8h-8v8h-8v-8h-8v-8h8z"/></>}
 {code==='TRY'&&<><path fill="#e30a17" d="M0 0h60v40H0z"/><circle cx="25" cy="20" r="11" fill="white"/><circle cx="28" cy="20" r="9" fill="#e30a17"/>{stars(39,20,5.5,'white')}</>}
 {code==='AED'&&<><path fill="#00732f" d="M0 0h60v14H0z"/><path fill="white" d="M0 14h60v13H0z"/><path fill="black" d="M0 27h60v13H0z"/><path fill="#ff0000" d="M0 0h15v40H0z"/></>}
 {code==='SAR'&&<><path fill="#006c35" d="M0 0h60v40H0z"/><text x="30" y="20" fill="white" fontSize="9" textAnchor="middle" fontFamily="serif">لا إله إلا الله</text><path stroke="white" strokeWidth="2" d="M15 28h30m0-2v3"/></>}
 {code==='CNY'&&<><path fill="#ee1c25" d="M0 0h60v40H0z"/>{stars(11,11,6,'#ffff00')}{[[21,4],[26,10],[26,18],[21,24]].map(([x,y],i)=><g key={i}>{stars(x,y,2.2,'#ffff00')}</g>)}</>}
 </svg>;
}
