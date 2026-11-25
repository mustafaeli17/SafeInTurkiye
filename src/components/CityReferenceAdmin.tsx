import {useEffect, useState} from 'react';
import {requireSupabase} from '../lib/supabase';
import {publicCities} from '../lib/publicRoutes';
import {loadAdminCities,matchCityReference} from '../repositories/adminCityReferences';
import type {AdminCity} from '../repositories/adminCityReferences';

type ReferenceState =
  | {status: 'loading'}
  | {status: 'error'; message: string}
  | {status: 'verified'; rows: AdminCity[]};

export default function CityReferenceAdmin({role}: {role: string}) {
  return <CityReferences key={role} writable={role === 'admin' || role === 'editor'}/>;
}

function CityReferences({writable}: {writable: boolean}) {
  const [state, setState] = useState<ReferenceState>({status: 'loading'});
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [needsReviewOnly,setNeedsReviewOnly] = useState(false);
  const destinations = state.status === 'verified'
    ? publicCities.map(destination => ({destination,reference:matchCityReference(destination,state.rows)})) : [];
  const reviewCount = destinations.filter(item => item.reference.status !== 'ready').length;

  function refresh() {
    setState({status: 'loading'});
    setRevision(value => value + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]);
    void loadAdminCities(signal).then(rows => {
      if (!controller.signal.aborted) setState({status: 'verified', rows});
    }).catch(() => {
      if (!controller.signal.aborted) setState({status: 'error', message: 'Şehir kayıtları doğrulanamadı. Bağlantıyı ve hesap yetkisini kontrol edip yeniden deneyin.'});
    });
    return () => controller.abort();
  }, [revision]);

  async function save(destination: typeof publicCities[number]) {
    if (!writable || saving || state.status !== 'verified') return;
    const match=matchCityReference(destination,state.rows);
    if (match.status === 'conflict' || match.status === 'ready') return;
    const existing=match.city;
    setSaving(true);
    setMessage('');
    try {
      const client = requireSupabase();
      const query = existing
        ? client.from('cities').update({active: true, status: 'PUBLISHED'}).eq('id', existing.id).eq('updated_at', existing.updated_at)
        : client.from('cities').insert({name: destination.name, slug: destination.slug, status: 'PUBLISHED', active: true});
      const result = await query.select('id').abortSignal(AbortSignal.timeout(12000)).single();
      if (result.error || !result.data) throw new Error();
      setMessage(destination.name + ' şehir referansı kaydedildi.');
      refresh();
    } catch {
      setState({status: 'error', message: 'Kayıt sonucu doğrulanamadı. Tekrar işlem yapmadan önce şehir listesini yenileyin.'});
    } finally {
      setSaving(false);
    }
  }

  return <section className="admin-panel">
    <div className="admin-section-heading"><div>
      <h2>Şehir referansları</h2>
      <p>Bir işletmeyi yayımlamak için onu aktif ve yayındaki bir şehirle ilişkilendirin.</p>
    </div><button className="admin-button" disabled={state.status === 'loading' || saving} onClick={() => {setMessage(''); refresh();}}>
      {state.status === 'error' ? 'Tekrar dene' : 'Yenile'}
    </button></div>
    {message && <p role="status" className="admin-success">{message}</p>}
    {state.status === 'loading' && <p role="status">Şehir kayıtları yükleniyor…</p>}
    {state.status === 'error' && <p role="alert" className="admin-error">{state.message}</p>}
    {state.status === 'verified' && <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p role="status">{destinations.length} şehir · {destinations.length-reviewCount} referans hazır</p>
        <label className="admin-button"><input type="checkbox" checked={needsReviewOnly} onChange={event=>setNeedsReviewOnly(event.target.checked)}/> İncelenecekler ({reviewCount})</label>
      </div>
      {needsReviewOnly && !reviewCount && <p>İncelenecek şehir referansı yok.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
      {destinations.filter(item=>!needsReviewOnly || item.reference.status!=='ready').map(({destination,reference}) => {
        return <article className="rounded-xl border border-sky-100 p-4" key={destination.slug}>
          <h3>{destination.name}</h3>
          <p>{reference.status==='ready' ? 'İşletme yayını için hazır' : reference.status==='inactive' ? 'Referans yayına hazırlanmalı' : reference.status==='conflict' ? 'Ad ile şehir adresi uyuşmuyor. Kayıt eşleşmesini kontrol edin.' : writable ? 'Veritabanı referansı eksik' : 'Bu hesapta görünür referans yok'}</p>
          {reference.status==='conflict' && <ul>{reference.candidates.map(row=><li key={row.id}>{row.name} · {row.slug}</li>)}</ul>}
          <div className="mt-2 flex flex-wrap gap-2"><a className="admin-button" href={'/cities/'+destination.slug} target="_blank" rel="noopener noreferrer">Şehir rehberini aç ↗</a>
          {writable && (reference.status==='inactive' || reference.status==='missing') && <button className="admin-button" disabled={saving} onClick={() => void save(destination)}>
            {reference.status==='inactive' ? 'Referansı yayına hazırla' : 'Şehir referansını oluştur'}
          </button>}</div>
        </article>;
      })}
    </div></>}
  </section>;
}
