import {useDiscardChanges} from './useDiscardChanges';
import {safeAdminUrl} from '../lib/adminReservations';
import { useEffect, useRef, useState } from 'react';
import { requireSupabase } from '../lib/supabase';
import {isValidCenter,safeTelephone} from '../services/nearbyPlaces';
import {secureEditorialImage,editorialId} from '../lib/editorialDiscovery';
import type {EditorialMetadata} from '../lib/editorialDiscovery';
import {sectionPath} from '../lib/sectionNavigation';
import {isRetiredDirectoryEntry} from '../lib/retiredDirectory';
import {loadAdminCities} from '../repositories/adminCityReferences';
import type {AdminCity} from '../repositories/adminCityReferences';
import {catalogPageSize, hasPublishedGoogleId, loadCatalogPage} from '../repositories/adminEditorialCatalog';
import type {CatalogFilters} from '../repositories/adminEditorialCatalog';

const sections = {
  hotels: ['Oteller', 'Otel adı', 'Oda türleri, giriş/çıkış saatleri, tesis olanakları, erişilebilirlik ve iptal koşulları.'],
  restaurants: ['Restoranlar', 'Restoran adı', 'Mutfak türü, menü, diyet seçenekleri, çalışma saatleri ve masa rezervasyonu koşulları.'],
  activities: ['Aktiviteler', 'Aktivite adı', 'Buluşma yeri, süre, rehber dili, dahil olan hizmetler, yaş sınırı ve iptal koşulları.'],
  exchange_offices: ['Döviz büroları', 'Büro adı', 'Çalışma saatleri, telefon, desteklenen para birimleri ve komisyon bilgisi. Tarihsiz fiyatı canlı kur diye yazmayın.'],
  attractions: ['Gezilecek yerler', 'Yer adı', 'Adres, ziyaret saatleri, ulaşım, erişilebilirlik ve resmî bilet bilgisi.'],
  museums: ['Müzeler', 'Müze adı', 'Ziyaret saatleri, kapalı günler, bilet kaynağı ve erişilebilirlik.'],
} as const;
type Table = keyof typeof sections;
interface Entry { updated_at?:string; id?: string; public_slug?:string|null; name: string; description: string; address: string; website: string; city_id: string | null; active: boolean; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; image_url?:string|null;editorial_metadata?:EditorialMetadata;latitude:string;longitude:string;galleryText:string }
const empty = (): Entry => ({ name: '', description: '', address: '', website: '', city_id: null, active: true, status: 'DRAFT',latitude:'',longitude:'',galleryText:'',editorial_metadata:{},image_url:'' });
function normalize(row:Entry):Entry{return {...row,description:row.description??'',address:row.address??'',website:row.website??'',image_url:row.image_url??'',editorial_metadata:row.editorial_metadata??{},latitude:row.editorial_metadata?.coordinates?.lat?.toString()??'',longitude:row.editorial_metadata?.coordinates?.lng?.toString()??'',galleryText:(row.editorial_metadata?.gallery??[]).join('\n')};}
const initialFilters: CatalogFilters = {name: '', city: '', status: '', page: 0};
const statusLabels = {DRAFT: 'Taslak', PUBLISHED: 'Yayında', ARCHIVED: 'Arşiv'};
const visitorSections = {
  hotels: ['stay', 'Oteller'], restaurants: ['food', 'Restoranlar'], activities: ['experiences', 'Aktiviteler'],
  museums: ['experiences', 'Aktiviteler · Müzeler'], attractions: ['experiences', 'Aktiviteler · Gezilecek yerler'],
  exchange_offices: ['currency', 'Döviz · Yakındaki döviz büroları'],
} as const;
type Setup = {status: 'loading' | 'error'} | {status: 'ready'; cities: AdminCity[]; richReady: boolean};
type CatalogResult = {key: string; status: 'error'} | {key: string; status: 'ready'; rows: Entry[]; total: number};

type EditorialAdminProps = {role: string; onDirtyChange?: (dirty: boolean) => void};
export default function EditorialAdmin(props: EditorialAdminProps) {
  return <CatalogEditor key={props.role} {...props}/>;
}

function CatalogEditor({role,onDirtyChange}: EditorialAdminProps) {
  const [table, setTable] = useState<Table>('hotels');
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [catalog, setCatalog] = useState<CatalogResult | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [setup, setSetup] = useState<Setup>({status: 'loading'});
  const [setupRetry, setSetupRetry] = useState(0);
  const cities = setup.status === 'ready' ? setup.cities : [];
  const richReady = setup.status === 'ready' && setup.richReady;
  const [form, setForm] = useState<Entry>(empty);
  const formHeading = useRef<HTMLHeadingElement>(null);
  const [baseForm,setBaseForm]=useState<Entry>(empty);
  const dirty=JSON.stringify(form)!==JSON.stringify(baseForm);
  useEffect(()=>{onDirtyChange?.(dirty);const leave=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return()=>{window.removeEventListener('beforeunload',leave);onDirtyChange?.(false);};},[dirty,onDirtyChange]);
  const discard=useDiscardChanges(dirty);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const writable = role === 'admin' || role === 'editor';
  const key = JSON.stringify([table, filters, refresh]);
  const list = catalog?.key === key ? catalog : null;

  function selectCategory(next: Table) {
    if (table === next) return;
    discard.protect(() => {
      setTable(next);
      setFilters(old => ({...old, page: 0}));
      setSetup({status: 'loading'});
      setForm(empty());
      setBaseForm(empty());
      setError('');
      setMessage('');
    });
  }

  function updateFilters(patch: Partial<CatalogFilters>) {
    setFilters(old => ({...old, page: 0, ...patch}));
  }

  function openEntry(entry: Entry) {
    discard.protect(() => {
      setForm(entry);
      setBaseForm(entry);
      setMessage('');
      setError('');
      formHeading.current?.focus();
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]);
    async function loadSetup() {
      const client = requireSupabase();
      const [cities, rich] = await Promise.all([
        loadAdminCities(signal),
        client.from(table).select('editorial_metadata,image_url').limit(0).abortSignal(signal),
      ]);
      if (rich.error && !['42703','PGRST204'].includes(rich.error.code)) throw rich.error;
      if (!controller.signal.aborted) setSetup({status: 'ready', cities, richReady: !rich.error});
    }
    void loadSetup().catch(() => {if (!controller.signal.aborted) setSetup({status: 'error'});});
    return () => controller.abort();
  }, [table, setupRetry]);

  useEffect(() => {
    const controller = new AbortController();
    // Coalesce keystrokes before issuing a catalog search.
    const timer = window.setTimeout(() => {
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]);
      void loadCatalogPage(table, filters, signal).then(({rows, total}) => {
        if (controller.signal.aborted) return;
        if (filters.page > 0 && filters.page * catalogPageSize >= total) {
          setFilters(old => ({...old, page: 0}));
          return;
        }
        setCatalog({key, status: 'ready', rows: rows.map(row => normalize(row as Entry)), total});
      }).catch(() => {if (!controller.signal.aborted) setCatalog({key, status: 'error'});});
    }, filters.name.trim() ? 200 : 0);
    return () => {window.clearTimeout(timer); controller.abort();};
  }, [table, filters, key]);

  const metadata = form.editorial_metadata ?? {};
  const city = cities.find(item => item.id === form.city_id);
  const coordinates = {lat: Number(form.latitude), lng: Number(form.longitude)};
  const validCoordinates = Boolean(form.latitude.trim() && form.longitude.trim()) && isValidCenter(coordinates);
  const missing = [
    !form.name.trim() && 'İşletme adı',
    (!city?.active || city.status !== 'PUBLISHED') && 'Aktif ve yayındaki şehir',
    !form.address.trim() && 'Açık adres',
    !form.description.trim() && 'Açıklama',
    !validCoordinates && 'Geçerli enlem ve boylam',
    !richReady && 'Keşif alanları',
  ].filter(Boolean);
  const retired = isRetiredDirectoryEntry(table, form.public_slug ?? metadata.slug);
  const [visitorSection, visitorLabel] = visitorSections[table];
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!writable || saving || setup.status !== 'ready') return;
    setMessage(''); setError('');
    if(!form.name.trim()){setError('Kayıt adı boş olamaz.');return;}
    if (form.website && !safeAdminUrl(form.website)) { setError('Web adresi https:// veya http:// ile başlamalı.'); return; }
    if((form.latitude||form.longitude)&&!validCoordinates){setError('Geçerli enlem ve boylamı birlikte girin.');return;}
    if(metadata.phone&&!safeTelephone(metadata.phone)){setError('Telefon numarasını ülke koduyla kontrol edin.');return;}
    if(metadata.googlePlaceId&&!/^[A-Za-z0-9_-]{1,250}$/.test(metadata.googlePlaceId)){setError('Google Place ID biçimi geçersiz. Harita bağlantısını değil Place ID değerini girin.');return;}
    const gallery=form.galleryText.split('\n').map(value=>value.trim()).filter(Boolean);
    if(gallery.length>12||[form.image_url,...gallery,metadata.imageSource].filter(Boolean).some(value=>!secureEditorialImage(value))){setError('Görseller ve kaynak için geçerli HTTPS adresleri kullanın; galeri en fazla 12 görseldir.');return;}
    if((form.image_url||gallery.length)&&(!metadata.imageRights?.trim()||!metadata.imageSource?.trim())){setError('Görseller için kullanım izni/lisans bilgisini ve kaynak adresini kaydedin.');return;}
    if(form.status==='PUBLISHED'&&missing.length){setError('Yayımlamak için tamamlayın: '+missing.join(', ')+'. Eksik kaydı taslak olarak saklayabilirsiniz.');return;}
    setSaving(true);
    const payload = { name: form.name.trim(), description: form.description || null, address: form.address || null, website: form.website || null, city_id: form.city_id, active: form.active, status: form.status,...(richReady?{image_url:form.image_url||null,editorial_metadata:{...metadata,coordinates:validCoordinates?coordinates:undefined,gallery}}:{}) };
    try {
      const client = requireSupabase();
      if(richReady && metadata.googlePlaceId && await hasPublishedGoogleId(table, metadata.googlePlaceId, form.id)) {
        setError('Bu Google Place ID ile zaten yayında bir kayıt var. Önce mevcut kaydı düzenleyin.');
        return;
      }
      let query = form.id ? client.from(table).update(payload).eq('id', form.id) : client.from(table).insert(payload);
      if(form.id&&form.updated_at)query=query.eq('updated_at',form.updated_at);
      const result = await query.select('*').abortSignal(AbortSignal.timeout(12000)).single();
      if (result.error) throw result.error;
      if(!result.data)throw Error();const saved = normalize(result.data as Entry);
      setRefresh(value => value + 1);
      setForm(saved);setBaseForm(saved);
      setMessage(saved.active&&saved.status==='PUBLISHED'&&!retired?'Kaydedildi. Uygun konum ve kategori aramalarında gösterilebilir.':'Kaydedildi. Bu kayıt ziyaretçi aramalarında gösterilmez.');
    } catch { setError('Kaydedilemedi. Yetki veya bağlantı sorunu olabilir; formunuz korunuyor. Kayıt başarılı sayılmadı.'); }
    finally { setSaving(false); }
  };
  const field = 'w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm';
  const meta=(patch:Partial<EditorialMetadata>)=>setForm({...form,editorial_metadata:{...metadata,...patch}});
  const discoveryLink=form.id&&city?`${sectionPath(visitorSection)}?${new URLSearchParams({city:city.slug,place:editorialId(table,form.id),...(table==='museums'?{category:'museum'}:{})})}`:null;
  return <section className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 pb-24">
    <div><h2>İşletme kataloğu</h2><p className="text-sm text-slate-600">SafeInTürkiye işletme kayıtlarını kategoriye göre arayın ve düzenleyin. Google Haritalar kendi işletme verilerini yönetir. Ücretli gösterimler Sponsorlu yerleşimler bölümündedir.</p></div>
    {setup.status === 'ready' && !richReady && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">Bu kategoride yayın alanları henüz kurulmadı. Temel bilgiler taslak olarak kaydedilebilir.</p>}
    {setup.status === 'error' && <div className="admin-error"><p role="alert">Şehir ve yayın alanları doğrulanamadı. Formdaki değişiklikler korunuyor.</p>
      <button className="admin-button" onClick={() => {setSetup({status: 'loading'}); setSetupRetry(value => value + 1);}}>Yayın bilgilerini yeniden yükle</button></div>}
    {!writable && <p className="p-3 bg-amber-50 rounded-xl">Hesabınız görüntüleme yetkisine sahip. Düzenleme için editör veya yönetici rolü gerekir.</p>}
    <nav className="flex gap-2 flex-wrap" aria-label="İşletme kategorileri">{Object.entries(sections).map(([key, value]) => <button disabled={saving} type="button" aria-pressed={table === key} key={key} onClick={() => selectCategory(key as Table)} className={`px-4 py-2 rounded-xl ${table === key ? 'bg-sky-600 text-white' : 'bg-white border border-sky-100'}`}>{value[0]}</button>)}</nav>
    <div className="admin-filter-bar">
      <label><span className="sr-only">İşletme adına göre ara</span><input type="search" maxLength={200} placeholder="İşletme adına göre ara" value={filters.name} onChange={e => updateFilters({name: e.target.value})}/></label>
      <select aria-label="İçerik şehri" value={filters.city} disabled={setup.status !== 'ready'} onChange={e => updateFilters({city: e.target.value})}>
        <option value="">Tüm şehirler</option>{cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
      </select>
      <select aria-label="İçerik durumu" value={filters.status} onChange={e => updateFilters({status: e.target.value})}>
        <option value="">Tüm durumlar</option>{Object.entries(statusLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}
      </select>
      <button className="admin-button" disabled={!filters.name && !filters.city && !filters.status} onClick={() => setFilters(initialFilters)}>Filtreleri temizle</button>
    </div>
    {dirty && <p className="admin-caption">Formda kaydedilmemiş değişiklik var.</p>}
    {!list && <p role="status">Kayıtlar yükleniyor…</p>}
    {list?.status === 'error' && <div className="admin-error"><p role="alert">İşletme kayıtları alınamadı. Aramanızı ve formu koruduk.</p><button className="admin-button" onClick={() => setRefresh(value => value + 1)}>Aramayı yeniden dene</button></div>}
    {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-800">{error}</p>}
    {message && <p role="status" className="p-3 rounded-xl bg-green-50 text-green-800">{message}</p>}
    <div className="grid md:grid-cols-[minmax(220px,1fr)_2fr] gap-5">
      <aside className="space-y-2">
        <button disabled={saving || !writable} onClick={() => openEntry(empty())} className="w-full p-3 border border-sky-200 bg-white rounded-xl text-sky-800 font-bold">+ Yeni kayıt</button>
        {list?.status === 'ready' && <>
          <p className="admin-caption" role="status">{list.total ? `${list.total} kayıt · ${filters.page * catalogPageSize + 1}–${filters.page * catalogPageSize + list.rows.length} gösteriliyor` : 'Bu seçimle eşleşen işletme kaydı yok.'}</p>
          {list.rows.map(row => <button disabled={saving} aria-pressed={form.id === row.id} onClick={() => openEntry(row)} key={row.id} className="w-full p-3 text-left bg-white border border-sky-100 aria-pressed:border-sky-500 rounded-xl">
            <strong className="block break-words">{row.name}</strong>
            <span className="text-xs">{cities.find(city => city.id === row.city_id)?.name ?? (row.city_id ? 'Şehir bilgisi bekleniyor' : 'Şehir seçilmemiş')} · {statusLabels[row.status]}{!row.active && ' · Pasif'}</span>
          </button>)}
          {list.total > catalogPageSize && <nav aria-label="Katalog sayfaları" className="flex flex-wrap gap-2">
            <button className="admin-button" disabled={filters.page === 0} onClick={() => updateFilters({page: filters.page - 1})}>Önceki</button>
            <button className="admin-button" disabled={(filters.page + 1) * catalogPageSize >= list.total} onClick={() => updateFilters({page: filters.page + 1})}>Sonraki</button>
          </nav>}
        </>}
      </aside>
      <form onSubmit={save} className="min-w-0 p-5 bg-white rounded-2xl border border-sky-100 space-y-4"><h2 ref={formHeading} tabIndex={-1} className="font-bold text-lg">{form.id ? 'Kaydı düzenle' : sections[table][1] + ' ekle'}</h2>
        <dl className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold">Kayıt kaynağı</dt><dd>SafeInTürkiye editör kaydı{metadata.googlePlaceId && ' · Google Place ID ile eşleşir'}</dd></div>
          <div><dt className="font-semibold">Ziyaretçi bölümü</dt><dd>{visitorLabel}{city && ' · ' + city.name}</dd></div>
        </dl>
        <fieldset disabled={!writable || saving || setup.status !== 'ready'} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm font-semibold">{sections[table][1]}<input required maxLength={200} className={field} value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></label>
        <label className="block text-sm font-semibold">Şehir<select className={field} value={form.city_id ?? ''} onChange={e => setForm({...form,city_id:e.target.value || null})}><option value="">Şehir seçin</option>{cities.map(city => <option value={city.id} key={city.id}>{city.name}{(!city.active || city.status !== 'PUBLISHED') && ' · yayın için hazır değil'}</option>)}</select></label>
        <label className="block text-sm font-semibold">Açık adres<input className={field} value={form.address} onChange={e => setForm({...form,address:e.target.value})} /></label>
        <label className="block text-sm font-semibold">Resmî web sitesi<input type="url" placeholder="https://" className={field} value={form.website} onChange={e => setForm({...form,website:e.target.value})} /></label>
        <fieldset disabled={!richReady} className="space-y-4 disabled:opacity-50"><legend className="font-bold">Liste konumu ve iletişim</legend><div className="grid sm:grid-cols-2 gap-3"><label className="text-sm font-semibold">Enlem<input inputMode="decimal" className={field} placeholder="41.0082" value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})}/></label><label className="text-sm font-semibold">Boylam<input inputMode="decimal" className={field} placeholder="28.9784" value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})}/></label></div><p className="text-xs text-slate-500">İşletmenin gerçek koordinatlarını girin; şehir merkezi otomatik olarak atanmaz.</p><label className="block text-sm font-semibold">Telefon<input type="tel" className={field} value={metadata.phone??''} onChange={e=>meta({phone:e.target.value})}/></label><label className="block text-sm font-semibold">Çalışma saatleri<input className={field} value={metadata.openingHours??''} onChange={e=>meta({openingHours:e.target.value})}/></label><label className="block text-sm font-semibold">Google Place ID (isteğe bağlı)<input className={field} value={metadata.googlePlaceId??''} onChange={e=>meta({googlePlaceId:e.target.value.trim()})}/></label><p className="text-xs text-slate-500">Aynı işletmenin Google kaydı varsa yalnız o kaydın Place ID değerini girin. Puan, yorum ve Google fotoğrafları veritabanına kopyalanmaz.</p>{table==='activities'&&<label className="block text-sm font-semibold">Aktivite kategorisi<select className={field} value={metadata.category??'activity'} onChange={e=>meta({category:e.target.value as EditorialMetadata['category']})}>{[['activity','Genel aktivite'],['museum','Müze'],['historical','Tarihi yer'],['park','Park / doğa'],['cinema','Sinema'],['entertainment','Eğlence']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}</fieldset>
        <details className="rounded-xl border border-sky-100 p-4"><summary className="cursor-pointer font-semibold">Fotoğraflar ve kullanım izni</summary><fieldset disabled={!richReady} className="mt-4 space-y-3"><label className="block text-sm">Kapak görseli (HTTPS)<input type="url" className={field} value={form.image_url??''} onChange={e=>setForm({...form,image_url:e.target.value})}/></label><label className="block text-sm">Galeri (her satıra bir HTTPS adresi; en fazla 12)<textarea className={field} rows={4} value={form.galleryText} onChange={e=>setForm({...form,galleryText:e.target.value})}/></label><label className="block text-sm">Görsel kaynağı<input type="url" className={field} value={metadata.imageSource??''} onChange={e=>meta({imageSource:e.target.value})}/></label><label className="block text-sm">Kullanım izni / lisans kaydı<textarea className={field} value={metadata.imageRights??''} onChange={e=>meta({imageRights:e.target.value})}/></label><p className="text-xs text-slate-500">Yalnız kullanım hakkınız olan gerçek işletme görsellerini ekleyin. Google fotoğraf URL’lerini kopyalamayın.</p></fieldset></details>
        <label className="block text-sm font-semibold">{sections[table][0]} bilgileri<textarea rows={8} className={field} placeholder={sections[table][2]} value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></label><p className="text-xs text-slate-500">{sections[table][2]}</p>
        <label className="block text-sm font-semibold">Durum<select className={field} value={form.status} onChange={e => setForm({...form,status:e.target.value as Entry['status']})}><option value="DRAFT">Taslak — ziyaretçiler görmez</option><option value="PUBLISHED">Yayında — ziyaretçiler okuyabilir</option><option value="ARCHIVED">Arşiv — ziyaretçiler görmez</option></select></label>
        <details className="rounded-xl border border-sky-100 p-4"><summary className="cursor-pointer font-semibold">Diğer dillerde açıklama</summary><fieldset disabled={!richReady} className="mt-3 space-y-3">{[['tr','Türkçe'],['en','English'],['es','Español'],['de','Deutsch'],['fr','Français'],['ar','العربية'],['ru','Русский'],['zh','中文']].map(([language,label])=><label key={language} className="block text-sm">{label}<textarea lang={language} dir={language==='ar'?'rtl':'ltr'} className={field} value={metadata.description?.[language]??''} onChange={e=>meta({description:{...metadata.description,[language]:e.target.value}})}/></label>)}</fieldset></details>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm({...form,active:e.target.checked})} />Kayıt aktif</label>
        <div className="rounded-xl bg-slate-50 p-3 text-sm"><h3 className="font-semibold">Yayın koşulları</h3>
          {setup.status === 'ready' ? <><p>{missing.length ? 'Tamamlanacak alanlar: ' + missing.join(', ') + '.' : 'Zorunlu yayın alanları tamam.'}</p>
            <p>{retired ? 'Bu eski kayıt ziyaretçi listesinden kaldırılmıştır.' : 'Ziyaretçi aramalarına katılmak için kaydın aktif ve durumunun “Yayında” olması gerekir.'}</p></> : <p>Yayın bilgileri doğrulanmayı bekliyor.</p>}
        </div>
        <button className="bg-sky-600 text-white px-5 py-3 rounded-xl font-bold" type="submit">{saving ? 'Kaydediliyor…' : 'Veritabanına kaydet'}</button>
        {discoveryLink&&form.status==='PUBLISHED'&&form.active&&!dirty&&!retired&&!missing.length&&<a className="admin-button ml-2" target="_blank" rel="noopener noreferrer" href={discoveryLink}>Ziyaretçi listesinde aç ↗</a>}
      </fieldset></form>
    </div>
  {discard.dialog}</section>;
}
