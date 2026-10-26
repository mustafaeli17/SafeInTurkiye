import {useDiscardChanges} from './useDiscardChanges';
import {safeAdminUrl} from '../lib/adminReservations';
import { useEffect, useState } from 'react';
import { requireSupabase } from '../lib/supabase';
import {isValidCenter,safeTelephone} from '../services/nearbyPlaces';
import {secureEditorialImage,editorialId} from '../lib/editorialDiscovery';
import type {EditorialMetadata} from '../lib/editorialDiscovery';
import {sectionPath} from '../lib/sectionNavigation';

const sections = {
  hotels: ['Oteller', 'Otel adı', 'Oda türleri, giriş/çıkış saatleri, tesis olanakları, erişilebilirlik ve iptal koşulları.'],
  restaurants: ['Restoranlar', 'Restoran adı', 'Mutfak türü, menü, diyet seçenekleri, çalışma saatleri ve masa rezervasyonu koşulları.'],
  activities: ['Aktiviteler', 'Aktivite adı', 'Buluşma yeri, süre, rehber dili, dahil olan hizmetler, yaş sınırı ve iptal koşulları.'],
  exchange_offices: ['Döviz büroları', 'Büro adı', 'Çalışma saatleri, telefon, desteklenen para birimleri ve komisyon bilgisi. Tarihsiz fiyatı canlı kur diye yazmayın.'],
  attractions: ['Gezilecek yerler', 'Yer adı', 'Adres, ziyaret saatleri, ulaşım, erişilebilirlik ve resmî bilet bilgisi.'],
  museums: ['Müzeler', 'Müze adı', 'Ziyaret saatleri, kapalı günler, bilet kaynağı ve erişilebilirlik.'],
} as const;
type Table = keyof typeof sections;
interface Entry { updated_at?:string; id?: string; name: string; description: string; address: string; website: string; city_id: string | null; active: boolean; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; image_url?:string|null;editorial_metadata?:EditorialMetadata;latitude:string;longitude:string;galleryText:string }
const empty = (): Entry => ({ name: '', description: '', address: '', website: '', city_id: null, active: true, status: 'DRAFT',latitude:'',longitude:'',galleryText:'',editorial_metadata:{},image_url:'' });
function normalize(row:Entry):Entry{return {...row,description:row.description??'',address:row.address??'',website:row.website??'',image_url:row.image_url??'',editorial_metadata:row.editorial_metadata??{},latitude:row.editorial_metadata?.coordinates?.lat?.toString()??'',longitude:row.editorial_metadata?.coordinates?.lng?.toString()??'',galleryText:(row.editorial_metadata?.gallery??[]).join('\n')};}
export default function EditorialAdmin({role,onDirtyChange}:{role:string;onDirtyChange?:(dirty:boolean)=>void}) {
  const [table, setTable] = useState<Table>('hotels');
  const [rows, setRows] = useState<Entry[]>([]);
  const [cities, setCities] = useState<{id: string; name: string;slug:string;active:boolean;status:string}[]>([]);
  const [richReady,setRichReady]=useState(false);
  const [cityFilter,setCityFilter]=useState('');
  const [form, setForm] = useState<Entry>(empty);
  const [search,setSearch]=useState('');
  const [statusFilter,setStatusFilter]=useState('');
  const [baseForm,setBaseForm]=useState<Entry>(empty);
  const dirty=JSON.stringify(form)!==JSON.stringify(baseForm);
  useEffect(()=>{onDirtyChange?.(dirty);const leave=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return()=>{window.removeEventListener('beforeunload',leave);onDirtyChange?.(false);};},[dirty,onDirtyChange]);
  const discard=useDiscardChanges(dirty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const writable = role === 'admin' || role === 'editor';
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setRows([]); setForm(empty());setBaseForm(empty());setSearch(''); setMessage(''); setError('');
    let client;try{client=requireSupabase();}catch{setError('Veritabanı yapılandırılmamış.');setLoading(false);return;}
    void Promise.all([
      client.from(table).select('*').order('name').limit(500).abortSignal(AbortSignal.timeout(12000)),
      client.from('cities').select('id,name,slug,active,status').order('name').abortSignal(AbortSignal.timeout(12000)),
      client.from(table).select('editorial_metadata,image_url').limit(0).abortSignal(AbortSignal.timeout(12000)),
    ]).then(([list, cityList, rich]) => {
      if (cancelled) return;
      if (list.error || cityList.error) { setError('Kayıtlar alınamadı. Hesabınızın yetkisini ve veritabanı bağlantısını kontrol edin.'); return; }
      setRows((list.data??[]).map(row=>normalize(row as Entry)));setRichReady(!rich.error);setCities(cityList.data ?? []);
    }).catch(() => { if (!cancelled) setError('Bağlantı kurulamadı. Yeniden deneyin.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [table]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!writable || saving) return;
    setMessage(''); setError('');
    if(!form.name.trim()){setError('Kayıt adı boş olamaz.');return;}
    if (form.website && !safeAdminUrl(form.website)) { setError('Web adresi https:// veya http:// ile başlamalı.'); return; }
    if (form.status === 'PUBLISHED' && (!form.description.trim() || !form.address.trim() || !form.city_id)) { setError('Yayımlamak için şehir, adres ve açıklamayı doldurun. Eksik kaydı taslak olarak saklayabilirsiniz.'); return; }
    const coordinates={lat:Number(form.latitude),lng:Number(form.longitude)},hasCoordinates=Boolean(form.latitude.trim()&&form.longitude.trim()),metadata=form.editorial_metadata??{};
    if((form.latitude||form.longitude)&&(!hasCoordinates||!isValidCenter(coordinates))){setError('Geçerli enlem ve boylamı birlikte girin.');return;}
    if(metadata.phone&&!safeTelephone(metadata.phone)){setError('Telefon numarasını ülke koduyla kontrol edin.');return;}
    if(metadata.googlePlaceId&&!/^[A-Za-z0-9_-]{1,250}$/.test(metadata.googlePlaceId)){setError('Google Place ID biçimi geçersiz. Harita bağlantısını değil Place ID değerini girin.');return;}
    const gallery=form.galleryText.split('\n').map(value=>value.trim()).filter(Boolean);
    if(gallery.length>12||[form.image_url,...gallery,metadata.imageSource].filter(Boolean).some(value=>!secureEditorialImage(value))){setError('Görseller ve kaynak için geçerli HTTPS adresleri kullanın; galeri en fazla 12 görseldir.');return;}
    if((form.image_url||gallery.length)&&(!metadata.imageRights?.trim()||!metadata.imageSource?.trim())){setError('Görseller için kullanım izni/lisans bilgisini ve kaynak adresini kaydedin.');return;}
    if(form.status==='PUBLISHED'&&(!richReady||!hasCoordinates||!cities.some(city=>city.id===form.city_id&&city.active&&city.status==='PUBLISHED'))){setError('Listede yayın için koordinatlar, yayındaki aktif şehir ve keşif alanları şeması gerekli. Eksikleri taslak olarak saklayabilirsiniz.');return;}
    if(metadata.googlePlaceId&&rows.some(row=>row.id!==form.id&&row.active&&row.status==='PUBLISHED'&&row.editorial_metadata?.googlePlaceId===metadata.googlePlaceId)){setError('Bu Google Place ID ile zaten yayında bir kayıt var. Önce mevcut kaydı düzenleyin.');return;}
    setSaving(true);
    const payload = { name: form.name.trim(), description: form.description || null, address: form.address || null, website: form.website || null, city_id: form.city_id, active: form.active, status: form.status,...(richReady?{image_url:form.image_url||null,editorial_metadata:{...metadata,coordinates:hasCoordinates?coordinates:undefined,gallery}}:{}) };
    try {
      const client = requireSupabase();
      let query = form.id ? client.from(table).update(payload).eq('id', form.id) : client.from(table).insert(payload);
      if(form.id&&form.updated_at)query=query.eq('updated_at',form.updated_at);
      const result = await query.select('*').abortSignal(AbortSignal.timeout(12000)).single();
      if (result.error) throw result.error;
      if(!result.data)throw Error();const saved = normalize(result.data as Entry);
      setRows(old => [...old.filter(row => row.id !== saved.id), saved].sort((a,b) => a.name.localeCompare(b.name)));
      setForm(saved);setBaseForm(saved);
      setMessage(saved.active&&saved.status==='PUBLISHED'?'Kaydedildi. İlgili şehir/bölgede arama yenilendiğinde aynı sonuç listesinde görünür.':'Kaydedildi. Taslak, arşiv veya pasif kayıt ziyaretçi sonuçlarında görünmez.');
    } catch { setError('Kaydedilemedi. Yetki veya bağlantı sorunu olabilir; formunuz korunuyor. Kayıt başarılı sayılmadı.'); }
    finally { setSaving(false); }
  };
  const field = 'w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm';
  const metadata=form.editorial_metadata??{};
  const meta=(patch:Partial<EditorialMetadata>)=>setForm({...form,editorial_metadata:{...metadata,...patch}});
  const city=cities.find(item=>item.id===form.city_id);
  const discoveryLink=form.id&&city?`${sectionPath(table==='hotels'?'stay':table==='restaurants'?'food':table==='exchange_offices'?'currency':'experiences')}?${new URLSearchParams({city:city.slug,place:editorialId(table,form.id),...(table==='museums'?{category:'museum'}:{})})}`:null;
  return <section className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 pb-24">
    <p className="text-sm text-slate-600">Yayındaki aktif kayıtlar, konumlarına uygun aramalarda Google sonuçlarıyla aynı listede gösterilir. Google kayıtlarını burada değiştirmezsiniz; kendi işletme bilgilerinizi yönetirsiniz. Ücretli öne çıkarma ayrı Sponsorlu yerleşimler bölümündedir.</p>
    {!loading&&!richReady&&<p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">Bu bölümün keşif alanları şeması hazır değil. Temel taslak düzenleme kullanılabilir; yayın açılmaz. Hazırlanan 0007 migration’ı onaylı kurulum gerektirir.</p>}
    {!writable && <p className="p-3 bg-amber-50 rounded-xl">Hesabınız görüntüleme yetkisine sahip. Düzenleme için editör veya yönetici rolü gerekir.</p>}
    <nav className="flex gap-2 flex-wrap">{Object.entries(sections).map(([key, value]) => <button disabled={saving} type="button" aria-pressed={table === key} key={key} onClick={() => discard.protect(()=>setTable(key as Table))} className={`px-4 py-2 rounded-xl ${table === key ? 'bg-sky-600 text-white' : 'bg-white border border-sky-100'}`}>{value[0]}</button>)}</nav>
    <div className="admin-filter-bar"><label><span className="sr-only">İçerik ara</span><input placeholder="Yüklü içeriklerde ara" value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="İçerik durumu" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">Tüm durumlar</option><option value="DRAFT">Taslak</option><option value="PUBLISHED">Yayında</option><option value="ARCHIVED">Arşiv</option></select><select aria-label="İçerik şehri" value={cityFilter} onChange={e=>setCityFilter(e.target.value)}><option value="">Tüm şehirler</option>{cities.map(city=><option key={city.id} value={city.id}>{city.name}</option>)}</select></div><p className="admin-caption">{rows.length} kayıt yüklendi (en fazla 500). {dirty?'Kaydedilmemiş değişiklik var.':''}</p>
    {loading && <p role="status">Kayıtlar yükleniyor…</p>}
    {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-800">{error}</p>}
    {message && <p role="status" className="p-3 rounded-xl bg-green-50 text-green-800">{message}</p>}
    <div className="grid md:grid-cols-[minmax(220px,1fr)_2fr] gap-5">
      <aside className="space-y-2"><button disabled={saving || !writable} onClick={() => discard.protect(()=>{setForm(empty());setBaseForm(empty());setMessage('');setError('');})} className="w-full p-3 border border-sky-200 bg-white rounded-xl text-sky-800 font-bold">+ Yeni kayıt</button>{!loading && rows.length === 0 && <p className="text-sm p-3">Bu bölümde kayıt yok.</p>}{rows.filter(row=>(!cityFilter||row.city_id===cityFilter)&&(!statusFilter||row.status===statusFilter)&&row.name.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))).map(row => <button disabled={saving} onClick={() => discard.protect(()=>{const normalized=normalize(row);setForm(normalized);setBaseForm(normalized);setMessage('');})} key={row.id} className="w-full p-3 text-left bg-white border border-sky-100 rounded-xl"><strong className="block break-words">{row.name}</strong><span className="text-xs">{row.status === 'DRAFT' ? 'Taslak' : row.status === 'PUBLISHED' ? 'Yayında' : 'Arşiv'}{!row.active && ' · Pasif'}</span></button>)}</aside>
      <form onSubmit={save} className="p-5 bg-white rounded-2xl border border-sky-100 space-y-4"><h2 className="font-bold text-lg">{form.id ? 'Kaydı düzenle' : sections[table][1] + ' ekle'}</h2><fieldset disabled={!writable || saving || loading} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm font-semibold">{sections[table][1]}<input required maxLength={200} className={field} value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></label>
        <label className="block text-sm font-semibold">Şehir<select className={field} value={form.city_id ?? ''} onChange={e => setForm({...form,city_id:e.target.value || null})}><option value="">Şehir seçin</option>{cities.map(city => <option value={city.id} key={city.id}>{city.name}</option>)}</select></label>
        <label className="block text-sm font-semibold">Açık adres<input className={field} value={form.address} onChange={e => setForm({...form,address:e.target.value})} /></label>
        <label className="block text-sm font-semibold">Resmî web sitesi<input type="url" placeholder="https://" className={field} value={form.website} onChange={e => setForm({...form,website:e.target.value})} /></label>
        <fieldset disabled={!richReady} className="space-y-4 disabled:opacity-50"><legend className="font-bold">Liste konumu ve iletişim</legend><div className="grid sm:grid-cols-2 gap-3"><label className="text-sm font-semibold">Enlem<input inputMode="decimal" className={field} placeholder="41.0082" value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})}/></label><label className="text-sm font-semibold">Boylam<input inputMode="decimal" className={field} placeholder="28.9784" value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})}/></label></div><p className="text-xs text-slate-500">İşletmenin gerçek koordinatlarını girin; şehir merkezi otomatik olarak atanmaz.</p><label className="block text-sm font-semibold">Telefon<input type="tel" className={field} value={metadata.phone??''} onChange={e=>meta({phone:e.target.value})}/></label><label className="block text-sm font-semibold">Çalışma saatleri<input className={field} value={metadata.openingHours??''} onChange={e=>meta({openingHours:e.target.value})}/></label><label className="block text-sm font-semibold">Google Place ID (isteğe bağlı)<input className={field} value={metadata.googlePlaceId??''} onChange={e=>meta({googlePlaceId:e.target.value.trim()})}/></label><p className="text-xs text-slate-500">Aynı işletmenin Google kaydı varsa yalnız o kaydın Place ID değerini girin. Puan, yorum ve Google fotoğrafları veritabanına kopyalanmaz.</p>{table==='activities'&&<label className="block text-sm font-semibold">Aktivite kategorisi<select className={field} value={metadata.category??'activity'} onChange={e=>meta({category:e.target.value as EditorialMetadata['category']})}>{[['activity','Genel aktivite'],['museum','Müze'],['historical','Tarihi yer'],['park','Park / doğa'],['cinema','Sinema'],['entertainment','Eğlence']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}</fieldset>
        <details className="rounded-xl border border-sky-100 p-4"><summary className="cursor-pointer font-semibold">Fotoğraflar ve kullanım izni</summary><fieldset disabled={!richReady} className="mt-4 space-y-3"><label className="block text-sm">Kapak görseli (HTTPS)<input type="url" className={field} value={form.image_url??''} onChange={e=>setForm({...form,image_url:e.target.value})}/></label><label className="block text-sm">Galeri (her satıra bir HTTPS adresi; en fazla 12)<textarea className={field} rows={4} value={form.galleryText} onChange={e=>setForm({...form,galleryText:e.target.value})}/></label><label className="block text-sm">Görsel kaynağı<input type="url" className={field} value={metadata.imageSource??''} onChange={e=>meta({imageSource:e.target.value})}/></label><label className="block text-sm">Kullanım izni / lisans kaydı<textarea className={field} value={metadata.imageRights??''} onChange={e=>meta({imageRights:e.target.value})}/></label><p className="text-xs text-slate-500">Yalnız kullanım hakkınız olan gerçek işletme görsellerini ekleyin. Google fotoğraf URL’lerini kopyalamayın.</p></fieldset></details>
        <label className="block text-sm font-semibold">{sections[table][0]} bilgileri<textarea rows={8} className={field} placeholder={sections[table][2]} value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></label><p className="text-xs text-slate-500">{sections[table][2]}</p>
        <label className="block text-sm font-semibold">Durum<select className={field} value={form.status} onChange={e => setForm({...form,status:e.target.value as Entry['status']})}><option value="DRAFT">Taslak — ziyaretçiler görmez</option><option value="PUBLISHED">Yayında — ziyaretçiler okuyabilir</option><option value="ARCHIVED">Arşiv — ziyaretçiler görmez</option></select></label>
        <details className="rounded-xl border border-sky-100 p-4"><summary className="cursor-pointer font-semibold">Diğer dillerde açıklama</summary><fieldset disabled={!richReady} className="mt-3 space-y-3">{[['tr','Türkçe'],['en','English'],['es','Español'],['de','Deutsch'],['fr','Français'],['ar','العربية'],['ru','Русский'],['zh','中文']].map(([language,label])=><label key={language} className="block text-sm">{label}<textarea lang={language} dir={language==='ar'?'rtl':'ltr'} className={field} value={metadata.description?.[language]??''} onChange={e=>meta({description:{...metadata.description,[language]:e.target.value}})}/></label>)}</fieldset></details>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm({...form,active:e.target.checked})} />Kayıt aktif</label>
        <button className="bg-sky-600 text-white px-5 py-3 rounded-xl font-bold" type="submit">{saving ? 'Kaydediliyor…' : 'Veritabanına kaydet'}</button>
        {discoveryLink&&form.status==='PUBLISHED'&&form.active&&!dirty&&<a className="admin-button ml-2" target="_blank" rel="noopener noreferrer" href={discoveryLink}>Ziyaretçi listesinde aç ↗</a>}
      </fieldset></form>
    </div>
  {discard.dialog}</section>;
}
