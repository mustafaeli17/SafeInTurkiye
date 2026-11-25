import {lazy,Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {BarChart3,Bell,BookOpen,ExternalLink,LayoutDashboard,LogOut,Settings,ShieldCheck,Ticket,Menu,MapPin} from 'lucide-react';
import AdminToday from './AdminToday';
import ReservationNotificationHealth from './ReservationNotificationHealth';
import {foundationEnabled} from '../lib/foundationConfig';
import AdminSystemStatus from './AdminSystemStatus';
import {useDiscardChanges} from './useDiscardChanges';
import TaxiBudgetReview from './TaxiBudgetReview';
import './ContentAdmin.css';
import './AdminToday.css';
const EditorialAdmin=lazy(()=>import('./EditorialAdmin'));
const BookingAdmin=lazy(()=>import('./BookingAdmin'));
const SponsorshipAdmin=lazy(()=>import('./SponsorshipAdmin'));
const BusinessMetricsAdmin=lazy(()=>import('./BusinessMetricsAdmin'));
const CityReferenceAdmin=lazy(()=>import('./CityReferenceAdmin'));
const tabs=[['overview','Bugün',LayoutDashboard],['reservations','Talepler',Bell],['content','İşletmeler',BookOpen],['cities','Şehirler',MapPin],['sponsors','Sponsorlar',Ticket],['analytics','İstatistikler',BarChart3],['system','Sistem ve yayın',Settings]] as const;
function readSection() {
  const params=new URLSearchParams(window.location.hash.split('?')[1]);
  const tab=tabs.find(([id])=>id===params.get('section'))?.[0]??'overview';
  return {tab,request:params.get('request')??'',all:params.get('view')==='all',notifications:params.get('view')==='notifications'};
}
export default function ContentAdmin({role,onSignOut,signingOut=false,siteHref='/'}:{role:string;onSignOut?:()=>unknown;signingOut?:boolean;siteHref?:string}){
 const [route,setRoute]=useState(readSection),[dirty,setDirty]=useState(false),[more,setMore]=useState(false);
 const {tab}=route;
 const [pendingCount,setPendingCount]=useState<number|null>(null);
 const workspace=useRef<HTMLDivElement>(null);
 const linkFocus=useRef(false);
 const lastHash=useRef(window.location.hash);
 const moreButton=useRef<HTMLButtonElement>(null);
 const discard=useDiscardChanges(dirty);
 const protectRef=useRef(discard.protect);
 useEffect(()=>{protectRef.current=discard.protect;},[discard.protect]);
 useEffect(()=>{
   if(!dirty)return;
   const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
   window.addEventListener('beforeunload',guard);
   return ()=>window.removeEventListener('beforeunload',guard);
 },[dirty]);
 useEffect(()=>{
   const sync=()=>{
     const next=window.location.hash;
     if(next.split('?')[0]!=='#admin'||next===lastHash.current)return;
     const previous=lastHash.current;
     window.history.replaceState(window.history.state,'',previous);
     protectRef.current(()=>{
       window.history.replaceState(window.history.state,'',next);
       lastHash.current=next;setDirty(false);setMore(false);setRoute(readSection());
     });
   };
   window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);
   return ()=>{window.removeEventListener('popstate',sync);window.removeEventListener('hashchange',sync);};
 },[]);
 useEffect(()=>{if(linkFocus.current){workspace.current?.focus({preventScroll:true});workspace.current?.scrollIntoView({block:'start'});linkFocus.current=false;}},[route]);
 const onDirty=useCallback((value:boolean)=>setDirty(value),[]);
 const permitted=['admin','editor','moderator'].includes(role);
 function navigate(next:string, param?:{request?:string;view?:string}){
   const params=new URLSearchParams({section:next});
   if(param?.request)params.set('request',param.request);
   if(param?.view)params.set('view',param.view);
   const hash='#admin?'+params;
   if(window.location.hash===hash){setMore(false);return;}
   discard.protect(()=>{
     setDirty(false);setMore(false);
     if(window.location.hash!==hash)window.history.pushState(window.history.state,'',hash);
     lastHash.current=hash;
     linkFocus.current=true;setRoute(readSection());
   });
 }
 function navButton([id,label,Icon]:typeof tabs[number],mobile=false){
   return <button key={id} type="button" aria-current={tab===id?'page':undefined} aria-pressed={tab===id} onClick={()=>navigate(id)}><Icon size={18}/><span>{label}</span>{!mobile&&id==='reservations'&&pendingCount!==null&&pendingCount>0&&<b>{pendingCount}</b>}</button>;
 }
 if(!permitted)return <p role="alert">Bu panel için yetkiniz yok.</p>;
 const activeLabel=tabs.find(([id])=>id===tab)![1];
 const inMore=tabs.slice(3).some(([id])=>id===tab);
 return <main className="admin-studio" lang="tr" dir="ltr">
  <header className="admin-studio-header">
    <div><p className="admin-eyebrow">SafeInTürkiye</p><h1>Yönetim paneli</h1></div>
    <div className="admin-header-actions">
      <span className="admin-role"><ShieldCheck size={15}/>{{admin:'Yönetici',editor:'Editör',moderator:'Moderatör'}[role]}</span>
      <a className="admin-button" href={siteHref} target="_blank" rel="noopener noreferrer">Siteyi aç <ExternalLink size={15}/><span className="sr-only">(yeni sekme)</span></a>
      {onSignOut&&<button type="button" className="admin-button" disabled={signingOut} onClick={()=>discard.protect(()=>{void onSignOut();})}><LogOut size={15}/>{signingOut?'Çıkış yapılıyor…':'Çıkış'}</button>}
    </div>
  </header>
  <div className="admin-studio-layout">
    <nav className="admin-side-nav" aria-label="Yönetim bölümleri">{tabs.map(item=>navButton(item))}</nav>
    <nav className="admin-mobile-nav" aria-label="Mobil yönetim bölümleri" onKeyDown={event=>{if(more&&event.key==='Escape'){setMore(false);moreButton.current?.focus();}}}>{tabs.slice(0,3).map(item=>navButton(item,true))}
      <button ref={moreButton} type="button" aria-label={inMore?'Diğer bölümler · '+activeLabel:'Diğer'} className={inMore?'admin-more-current':undefined} aria-expanded={more} aria-controls="admin-extra-sections" onClick={()=>setMore(!more)}><Menu size={18}/><span>{inMore?activeLabel:'Diğer'}</span></button>
      <div id="admin-extra-sections" hidden={!more}>{tabs.slice(3).map(item=>navButton(item,true))}</div>
    </nav>
    <div className="admin-workspace" ref={workspace} tabIndex={-1}>
    {tab==='overview'&&<AdminToday onTotal={setPendingCount} onOpen={request=>navigate('reservations',request?{request}:{view:'all'})} onNotifications={()=>navigate('system',{view:'notifications'})}/>}
   <Suspense fallback={<p role="status" className="admin-panel">Bölüm yükleniyor…</p>}>
    {tab==='reservations'&&<BookingAdmin key={route.request+String(route.all)} initialStatus={route.all||route.request?'':'PENDING'} onChanged={()=>setPendingCount(null)}/>}
    {tab==='content'&&<EditorialAdmin role={role} onDirtyChange={onDirty}/>}
    {tab==='cities'&&<CityReferenceAdmin role={role}/>}
    {tab==='sponsors'&&(foundationEnabled?<SponsorshipAdmin onDirtyChange={onDirty}/>:<section className="admin-panel"><h2>Sponsorlar</h2><p>Bu ortamda sponsor yönetimi etkin değil.</p></section>)}
    {tab==='analytics'&&<><section className="admin-panel"><h2>Ziyaretçi istatistikleri</h2><p>Vercel’de ölçülen ziyaretçi, ülke, cihaz ve yönlendirme verileri. Fiziksel işletme ziyareti anlamına gelmez.</p><a className="admin-button" href="https://vercel.com/eli-1196/safe-in-turkiye/analytics" target="_blank" rel="noopener noreferrer">Vercel Analytics<ExternalLink size={15}/></a></section>{foundationEnabled&&<BusinessMetricsAdmin/>}</>}
   </Suspense>
   {tab==='system'&&<ReservationNotificationHealth key={String(route.notifications)} initiallyOpen={route.notifications}/>}
   {tab==='system'&&<AdminSystemStatus/>}
   {tab==='system'&&<TaxiBudgetReview/>}
  </div></div>
 {discard.dialog}</main>;
}
