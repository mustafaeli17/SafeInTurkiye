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
interface Entry { id?: string; name: string; description: string; address: string; website: string; city_id: string | null; active: boolean; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }
const empty = (): Entry => ({ name: '', description: '', address: '', website: '', city_id: null, active: true, status: 'DRAFT' });
export default function ContentAdmin({ role }: { role: string }) {
  const [table, setTable] = useState<Table>('hotels');
  const [rows, setRows] = useState<Entry[]>([]);
  const [cities, setCities] = useState<{id: string; name: string}[]>([]);
  const [form, setForm] = useState<Entry>(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const writable = role === 'admin' || role === 'editor';
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setRows([]); setForm(empty()); setMessage(''); setError('');
    const client = requireSupabase();
    void Promise.all([
      client.from(table).select('id,name,description,address,website,city_id,active,status').order('name'),
      client.from('cities').select('id,name').order('name'),
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
    if (form.website && !/^https?:\/\//i.test(form.website)) { setError('Web adresi https:// veya http:// ile başlamalı.'); return; }
    if (form.status === 'PUBLISHED' && (!form.description.trim() || !form.address.trim() || !form.city_id)) { setError('Yayımlamak için şehir, adres ve açıklamayı doldurun. Eksik kaydı taslak olarak saklayabilirsiniz.'); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), description: form.description || null, address: form.address || null, website: form.website || null, city_id: form.city_id, active: form.active, status: form.status };
    try {
      const client = requireSupabase();
      const query = form.id ? client.from(table).update(payload).eq('id', form.id) : client.from(table).insert(payload);
      const result = await query.select('id,name,description,address,website,city_id,active,status').single();
      if (result.error) throw result.error;
      const saved = result.data as Entry;
      setRows(old => [...old.filter(row => row.id !== saved.id), saved].sort((a,b) => a.name.localeCompare(b.name)));
      setForm({ ...saved, description: saved.description ?? '', address: saved.address ?? '', website: saved.website ?? '' });
      setMessage('Veritabanına kaydedildi. Bu kayıt sayfa yenilendiğinde korunur.');
    } catch { setError('Kaydedilemedi. Yetki veya bağlantı sorunu olabilir; formunuz korunuyor. Kayıt başarılı sayılmadı.'); }
    finally { setSaving(false); }
  };
  const field = 'w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm';
  return <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 pb-24">
    <header><h1 className="text-2xl font-bold">İçerik yönetimi</h1><p className="text-sm text-slate-600 mt-2">Gerçek veritabanı kayıtları · {role}. Yayımlanan kayıtları canlı site de okuyabilir; denemeleri taslak kaydedin.</p></header>
    <section className="p-4 rounded-xl border border-sky-100 bg-white"><h2 className="font-bold">Ziyaretçi istatistikleri</h2><p className="text-sm text-slate-600 my-2">Ziyaretçi, görüntülenme, ülke, cihaz ve yönlendiren kaynak bilgilerini Vercel Analytics ekranında görebilirsiniz. Vercel proje erişimi gerekir. Ölçüm kurulmadan önceki ziyaretler geriye dönük hesaplanamaz. Ücretsiz planda bölüm tıklamaları ölçülmez.</p><a href="https://vercel.com/eli-1196/safe-in-turkiye/analytics" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline font-semibold">İstatistikleri aç ↗</a></section>
    {!writable && <p className="p-3 bg-amber-50 rounded-xl">Hesabınız görüntüleme yetkisine sahip. Düzenleme için editör veya yönetici rolü gerekir.</p>}
    <nav className="flex gap-2 flex-wrap">{Object.entries(sections).map(([key, value]) => <button disabled={saving} type="button" aria-pressed={table === key} key={key} onClick={() => setTable(key as Table)} className={`px-4 py-2 rounded-xl ${table === key ? 'bg-sky-600 text-white' : 'bg-white border border-sky-100'}`}>{value[0]}</button>)}</nav>
    {loading && <p role="status">Kayıtlar yükleniyor…</p>}
    {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-800">{error}</p>}
    {message && <p role="status" className="p-3 rounded-xl bg-green-50 text-green-800">{message}</p>}
    <div className="grid md:grid-cols-[minmax(220px,1fr)_2fr] gap-5">
      <aside className="space-y-2"><button disabled={saving || !writable} onClick={() => { setForm(empty()); setMessage(''); setError(''); }} className="w-full p-3 border border-sky-200 bg-white rounded-xl text-sky-800 font-bold">+ Yeni kayıt</button>{!loading && rows.length === 0 && <p className="text-sm p-3">Bu bölümde kayıt yok.</p>}{rows.map(row => <button disabled={saving} onClick={() => { setForm({ ...row, description: row.description ?? '', address: row.address ?? '', website: row.website ?? '' }); setMessage(''); }} key={row.id} className="w-full p-3 text-left bg-white border border-sky-100 rounded-xl"><strong className="block break-words">{row.name}</strong><span className="text-xs">{row.status === 'DRAFT' ? 'Taslak' : row.status === 'PUBLISHED' ? 'Yayında' : 'Arşiv'}{!row.active && ' · Pasif'}</span></button>)}</aside>
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
  </main>;
}
