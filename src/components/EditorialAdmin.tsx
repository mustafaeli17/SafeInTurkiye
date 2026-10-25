import {useDiscardChanges} from './useDiscardChanges';
import {safeAdminUrl} from '../lib/adminReservations';
import { useEffect, useState } from 'react';
import { requireSupabase } from '../lib/supabase';

const sections = {
  hotels: ['Oteller', 'Otel adı', 'Oda türleri, giriş/çıkış saatleri, tesis olanakları, erişilebilirlik ve iptal koşulları.'],
  restaurants: ['Restoranlar', 'Restoran adı', 'Mutfak türü, menü, diyet seçenekleri, çalışma saatleri ve masa rezervasyonu koşulları.'],
  activities: ['Aktiviteler', 'Aktivite adı', 'Buluşma yeri, süre, rehber dili, dahil olan hizmetler, yaş sınırı ve iptal koşulları.'],
  exchange_offices: ['Döviz büroları', 'Büro adı', 'Çalışma saatleri, telefon, desteklenen para birimleri ve komisyon bilgisi. Tarihsiz fiyatı canlı kur diye yazmayın.'],
  attractions: ['Gezilecek yerler', 'Yer adı', 'Adres, ziyaret saatleri, ulaşım, erişilebilirlik ve resmî bilet bilgisi.'],
  museums: ['Müzeler', 'Müze adı', 'Ziyaret saatleri, kapalı günler, bilet kaynağı ve erişilebilirlik.'],
} as const;
type Table = keyof typeof sections;
interface Entry { updated_at?:string; id?: string; name: string; description: string; address: string; website: string; city_id: string | null; active: boolean; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }
const empty = (): Entry => ({ name: '', description: '', address: '', website: '', city_id: null, active: true, status: 'DRAFT' });
export default function EditorialAdmin({role,onDirtyChange}:{role:string;onDirtyChange?:(dirty:boolean)=>void}) {
  const [table, setTable] = useState<Table>('hotels');
  const [rows, setRows] = useState<Entry[]>([]);
  const [cities, setCities] = useState<{id: string; name: string}[]>([]);
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
      client.from(table).select('id,name,description,address,website,city_id,active,status,updated_at').order('name').limit(500).abortSignal(AbortSignal.timeout(12000)),
      client.from('cities').select('id,name').order('name').abortSignal(AbortSignal.timeout(12000)),
    ]).then(([list, cityList]) => {
      if (cancelled) return;
      if (list.error || cityList.error) { setError('Kayıtlar alınamadı. Hesabınızın yetkisini ve veritabanı bağlantısını kontrol edin.'); return; }
      setRows(list.data ?? []); setCities(cityList.data ?? []);
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
    setSaving(true);
    const payload = { name: form.name.trim(), description: form.description || null, address: form.address || null, website: form.website || null, city_id: form.city_id, active: form.active, status: form.status };
    try {
      const client = requireSupabase();
      let query = form.id ? client.from(table).update(payload).eq('id', form.id) : client.from(table).insert(payload);
      if(form.id&&form.updated_at)query=query.eq('updated_at',form.updated_at);
      const result = await query.select('id,name,description,address,website,city_id,active,status,updated_at').abortSignal(AbortSignal.timeout(12000)).single();
      if (result.error) throw result.error;
      const saved = result.data as Entry;
      setRows(old => [...old.filter(row => row.id !== saved.id), saved].sort((a,b) => a.name.localeCompare(b.name)));
      const normalized={...saved,description:saved.description??'',address:saved.address??'',website:saved.website??''};setForm(normalized);setBaseForm(normalized);
      setMessage('Veritabanına kaydedildi. Bu kayıt sayfa yenilendiğinde korunur.');
    } catch { setError('Kaydedilemedi. Yetki veya bağlantı sorunu olabilir; formunuz korunuyor. Kayıt başarılı sayılmadı.'); }
    finally { setSaving(false); }
  };
  const field = 'w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm';
  return <section className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 pb-24">
    <p className="text-sm text-slate-600">Mevcut içerikleri aşağıdaki listeden seçerek düzenleyebilir, taslak veya arşiv durumuna alabilirsiniz. Google Maps kayıtları burada düzenlenmez. Tasarım ve çeviri yönetimi bu panelin dışındadır. Arama motorlarına sunulan sayfalar ve site haritası için içerik değişikliklerinden sonra onaylı yayın/build işlemi gerekir.</p>
    {!writable && <p className="p-3 bg-amber-50 rounded-xl">Hesabınız görüntüleme yetkisine sahip. Düzenleme için editör veya yönetici rolü gerekir.</p>}
    <nav className="flex gap-2 flex-wrap">{Object.entries(sections).map(([key, value]) => <button disabled={saving} type="button" aria-pressed={table === key} key={key} onClick={() => discard.protect(()=>setTable(key as Table))} className={`px-4 py-2 rounded-xl ${table === key ? 'bg-sky-600 text-white' : 'bg-white border border-sky-100'}`}>{value[0]}</button>)}</nav>
    <div className="admin-filter-bar"><label><span className="sr-only">İçerik ara</span><input placeholder="Yüklü içeriklerde ara" value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="İçerik durumu" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">Tüm durumlar</option><option value="DRAFT">Taslak</option><option value="PUBLISHED">Yayında</option><option value="ARCHIVED">Arşiv</option></select></div><p className="admin-caption">{rows.length} kayıt yüklendi (en fazla 500). {dirty?'Kaydedilmemiş değişiklik var.':''}</p>
    {loading && <p role="status">Kayıtlar yükleniyor…</p>}
    {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-800">{error}</p>}
    {message && <p role="status" className="p-3 rounded-xl bg-green-50 text-green-800">{message}</p>}
    <div className="grid md:grid-cols-[minmax(220px,1fr)_2fr] gap-5">
      <aside className="space-y-2"><button disabled={saving || !writable} onClick={() => discard.protect(()=>{setForm(empty());setBaseForm(empty());setMessage('');setError('');})} className="w-full p-3 border border-sky-200 bg-white rounded-xl text-sky-800 font-bold">+ Yeni kayıt</button>{!loading && rows.length === 0 && <p className="text-sm p-3">Bu bölümde kayıt yok.</p>}{rows.filter(row=>(!statusFilter||row.status===statusFilter)&&row.name.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))).map(row => <button disabled={saving} onClick={() => discard.protect(()=>{const normalized={...row,description:row.description??'',address:row.address??'',website:row.website??''};setForm(normalized);setBaseForm(normalized);setMessage('');})} key={row.id} className="w-full p-3 text-left bg-white border border-sky-100 rounded-xl"><strong className="block break-words">{row.name}</strong><span className="text-xs">{row.status === 'DRAFT' ? 'Taslak' : row.status === 'PUBLISHED' ? 'Yayında' : 'Arşiv'}{!row.active && ' · Pasif'}</span></button>)}</aside>
      <form onSubmit={save} className="p-5 bg-white rounded-2xl border border-sky-100 space-y-4"><h2 className="font-bold text-lg">{form.id ? 'Kaydı düzenle' : sections[table][1] + ' ekle'}</h2><fieldset disabled={!writable || saving || loading} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm font-semibold">{sections[table][1]}<input required maxLength={200} className={field} value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></label>
        <label className="block text-sm font-semibold">Şehir<select className={field} value={form.city_id ?? ''} onChange={e => setForm({...form,city_id:e.target.value || null})}><option value="">Şehir seçin</option>{cities.map(city => <option value={city.id} key={city.id}>{city.name}</option>)}</select></label>
        <label className="block text-sm font-semibold">Açık adres<input className={field} value={form.address} onChange={e => setForm({...form,address:e.target.value})} /></label>
        <label className="block text-sm font-semibold">Resmî web sitesi<input type="url" placeholder="https://" className={field} value={form.website} onChange={e => setForm({...form,website:e.target.value})} /></label>
        <label className="block text-sm font-semibold">{sections[table][0]} bilgileri<textarea rows={8} className={field} placeholder={sections[table][2]} value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></label><p className="text-xs text-slate-500">{sections[table][2]}</p>
        <label className="block text-sm font-semibold">Durum<select className={field} value={form.status} onChange={e => setForm({...form,status:e.target.value as Entry['status']})}><option value="DRAFT">Taslak — ziyaretçiler görmez</option><option value="PUBLISHED">Yayında — ziyaretçiler okuyabilir</option><option value="ARCHIVED">Arşiv — ziyaretçiler görmez</option></select></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm({...form,active:e.target.checked})} />Kayıt aktif</label>
        <button className="bg-sky-600 text-white px-5 py-3 rounded-xl font-bold" type="submit">{saving ? 'Kaydediliyor…' : 'Veritabanına kaydet'}</button>
      </fieldset></form>
    </div>
  {discard.dialog}</section>;
}
