import {lazy,Suspense,useCallback,useEffect,useState} from 'react';
import {BarChart3,Bell,BookOpen,CheckCircle2,ExternalLink,LayoutDashboard,LogOut,Settings,ShieldCheck,Ticket,TriangleAlert} from 'lucide-react';
import {requireSupabase} from '../lib/supabase';
import {foundationEnabled} from '../lib/foundationConfig';
import {restaurantRequestsEnabled} from '../lib/reservationAvailability';
import {publicCities} from '../lib/publicRoutes';
import {useDiscardChanges} from './useDiscardChanges';
import './ContentAdmin.css';
const EditorialAdmin=lazy(()=>import('./EditorialAdmin'));
const BookingAdmin=lazy(()=>import('./BookingAdmin'));
const SponsorshipAdmin=lazy(()=>import('./SponsorshipAdmin'));
const BusinessMetricsAdmin=lazy(()=>import('./BusinessMetricsAdmin'));
const tabs=[['overview','Genel bakış',LayoutDashboard],['reservations','Rezervasyonlar',Bell],['content','İçerik yönetimi',BookOpen],['sponsors','Sponsorlu yerleşimler',Ticket],['analytics','İstatistikler',BarChart3],['system','Sistem ve yayın',Settings]] as const;
export default function ContentAdmin({role,onSignOut}:{role:string;onSignOut?:()=>unknown}){
 const [tab,setTab]=useState('overview'),[dirty,setDirty]=useState(false),[count,setCount]=useState<number|null>(null),[cityCount,setCityCount]=useState<number|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const onDirty=useCallback((value:boolean)=>setDirty(value),[]);
 const discard=useDiscardChanges(dirty);
 const permitted=['admin','editor','moderator'].includes(role);
 async function refresh(){
  setLoading(true);setError('');
  try{
   const client=requireSupabase();
   const [requests,cities]=await Promise.all([client.from('bookings').select('id',{count:'exact',head:true}).eq('listing_type','restaurant').eq('status','PENDING').abortSignal(AbortSignal.timeout(10000)),client.from('cities').select('id',{count:'exact',head:true}).abortSignal(AbortSignal.timeout(10000))]);
   if(requests.error||cities.error)throw Error();setCount(requests.count??null);setCityCount(cities.count??null);
  }catch{setError('Özet verileri alınamadı. Bilinmeyen değerler sıfır kabul edilmedi.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{if(permitted)void refresh();},[permitted]);
 function navigate(next:string){discard.protect(()=>{setDirty(false);setTab(next);});}
 if(!permitted)return <p role="alert">Bu panel için yetkiniz yok.</p>;
 return <main className="admin-studio">
  <header className="admin-studio-header"><div><p className="admin-eyebrow">SAFEINTÜRKİYE · YÖNETİM</p><h1>Kontrol merkezi</h1><p>Rezervasyonlar, içerikler ve işletme yönetimi.</p></div><div className="admin-header-actions"><span className="admin-role"><ShieldCheck size={15}/>{role}</span>{onSignOut&&<button className="admin-button" onClick={()=>discard.protect(()=>{void onSignOut();})}><LogOut size={15}/>Çıkış</button>}</div></header>
  <div className="admin-studio-layout"><nav className="admin-side-nav" aria-label="Yönetim bölümleri">{tabs.map(([id,label,Icon])=><button key={id} aria-pressed={tab===id} onClick={()=>navigate(id)}><Icon size={18}/><span>{label}</span>{id==='reservations'&&count!==null&&count>0&&<b>{count}</b>}</button>)}</nav>
  <div className="admin-workspace">
   {tab==='overview'&&<><div className="admin-section-heading"><div><h2>Bugünün çalışma alanı</h2><p>Gerçek kayıtlar; bilinmeyen sayılar “—” ile gösterilir.</p></div><button disabled={loading} className="admin-button" onClick={()=>void refresh()}>{loading?'Yükleniyor…':'Özeti yenile'}</button></div>{error&&<p role="alert" className="admin-error">{error}</p>}<div className="admin-stat-grid"><button onClick={()=>navigate('reservations')} className="admin-stat"><Bell/><strong>{count??'—'}</strong><span>Bekleyen restoran talebi</span></button><div className="admin-stat"><BookOpen/><strong>{cityCount??'—'}</strong><span>Veritabanındaki şehir</span></div><div className="admin-stat"><LayoutDashboard/><strong>{publicCities.length}</strong><span>Sitedeki destinasyon</span></div></div><section className="admin-panel"><h2>Önce rezervasyonlar</h2><p>Talebi açın, restoranı arayın ve sonucu kaydedin. “Talep alındı” kesin rezervasyon anlamına gelmez.</p><button className="admin-button admin-primary" onClick={()=>navigate('reservations')}>Talepleri aç</button></section><div className="admin-health-grid"><section className="admin-panel"><CheckCircle2/><h3>Yetki koruması</h3><p>Oturum ve veritabanı RLS kuralları geçerlidir. Bu ekran yetki vermez.</p></section><section className="admin-panel"><TriangleAlert/><h3>Yayın durumu</h3><p>{restaurantRequestsEnabled?'Talep arayüzü etkin; sunucu ayrıca hazır olmalıdır.':'Rezervasyon hizmeti aktivasyon bekliyor.'} Google kayıtları bu panelde düzenlenmez.</p></section></div></>}
   <Suspense fallback={<p role="status" className="admin-panel">Bölüm yükleniyor…</p>}>
    {tab==='reservations'&&<BookingAdmin onChanged={()=>void refresh()}/>}
    {tab==='content'&&<EditorialAdmin role={role} onDirtyChange={onDirty}/>}
    {tab==='sponsors'&&(foundationEnabled?<SponsorshipAdmin/>:<section className="admin-panel"><h2>Sponsorlu yerleşimler</h2><p>Foundation şeması bu ortamda etkin değil. Yanlış tabloya veya Google kayıtlarına reklam yazılmayacak.</p></section>)}
    {tab==='analytics'&&<><section className="admin-panel"><h2>Ziyaretçi istatistikleri</h2><p>Vercel’de ölçülen ziyaretçi, ülke, cihaz ve yönlendirme verileri. Fiziksel işletme ziyareti anlamına gelmez.</p><a className="admin-button" href="https://vercel.com/eli-1196/safe-in-turkiye/analytics" target="_blank" rel="noopener noreferrer">Vercel Analytics<ExternalLink size={15}/></a></section>{foundationEnabled&&<BusinessMetricsAdmin/>}</>}
   </Suspense>
   {tab==='system'&&<section className="admin-panel admin-system"><h2>Sistem ve yayın</h2><dl><div><dt>İçerik kaynağı</dt><dd>Google Places keşfi + ayrı editoryal CMS kayıtları</dd></div><div><dt>Foundation</dt><dd>{foundationEnabled?'Etkin':'Etkin değil'}</dd></div><div><dt>Rezervasyon arayüzü</dt><dd>{restaurantRequestsEnabled?'Etkin':'Aktivasyon bekliyor'}</dd></div><div><dt>İçerik güncellemeleri</dt><dd>CMS kayıtları kalıcıdır. SEO/site haritası için onaylı build/yayın gerekir.</dd></div></dl><p>Şehir tasarımları, çeviriler, API anahtarları ve güvenlik ayarları burada değiştirilmez. Gerçekte çalışmayan “tüm siteyi değiştir” düğmeleri gösterilmez.</p><a className="admin-button" href="https://vercel.com/eli-1196/safe-in-turkiye" target="_blank" rel="noopener noreferrer">Yayın ve API ortamı<ExternalLink size={15}/></a></section>}
  </div></div>
 {discard.dialog}</main>;
}
