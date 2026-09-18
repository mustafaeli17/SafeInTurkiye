import { useRef, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
export default function TransitJourney({ lang }: { lang: string }) {
  const tr = lang === 'tr';
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departure, setDeparture] = useState('');
  const [preference, setPreference] = useState('FEWER_TRANSFERS');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const search = async (e: React.FormEvent) => {
    e.preventDefault(); setRoutes([]); setMessage(''); setBusy(true);
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const session = await supabase?.auth.getSession();
      const response = await fetch('/api/transit', { method:'POST', signal:controller.signal, headers:{'Content-Type':'application/json', ...(session?.data.session ? {Authorization:`Bearer ${session.data.session.access_token}`} : {})}, body: JSON.stringify({origin,destination,departure:departure ? new Date(departure).toISOString() : new Date().toISOString(),preference,language:lang}) });
      if (response.status === 503 || !(response.headers.get('content-type') ?? '').includes('application/json')) throw new Error(tr ? 'Canlı rota servisi henüz bağlı değil. Sunucuda Google Routes API anahtarı yapılandırılmalı. Aşağıdaki istasyon rehberi sınırlı kapsamda kullanılabilir.' : 'Live routing is not connected. A server-side Google Routes API key is required. The limited station guide below remains available.');
      if (response.status === 401) throw new Error(tr ? 'Canlı rota araması için hesabınıza giriş yapın.' : 'Sign in to request a live route.');
      if (!response.ok) throw new Error(tr ? 'Rota hizmeti yanıt vermedi. Biraz sonra tekrar deneyin.' : 'The routing service is unavailable. Please retry later.');
      const data = await response.json(); setRoutes(data.routes ?? []);
      if (!data.routes?.length) setMessage(tr ? 'Bu yerler ve saat için rota bulunamadı. Adresleri şehir adıyla birlikte kontrol edin.' : 'No route was found for these places and time. Check the addresses, including city names.');
    } catch (error) { setMessage(error instanceof Error && error.name !== 'AbortError' ? error.message : (tr ? 'Arama zaman aşımına uğradı.' : 'Search timed out.')); }
    finally { clearTimeout(timeout); setBusy(false); }
  };
  const input = 'w-full p-3 border border-sky-100 rounded-xl bg-slate-50 text-sm';
  const time = (value?: string) => value ? new Date(value).toLocaleString(lang, {timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}) : '—';
  return <section className="bg-white p-5 rounded-2xl border border-sky-100 space-y-4">
    <h2 className="font-bold text-xl">{tr ? 'Adresler arasında yolculuk planla' : 'Plan a journey between addresses'}</h2>
    <p className="text-xs text-slate-600">{tr ? 'İstanbul, Ankara, İzmir veya Antalya: açık adres, durak ya da yer adını şehirle birlikte yazın. İstek gönderildiğinde bu bilgiler rota sağlayıcısına iletilir.' : 'İstanbul, Ankara, İzmir or Antalya: enter an address, stop or place with its city. Submitted locations are sent to the routing provider.'}</p>
    <form onSubmit={search} className="grid sm:grid-cols-2 gap-3"><label>{tr ? 'Nereden?' : 'From'}<input required minLength={3} maxLength={250} value={origin} onChange={e=>{setOrigin(e.target.value);setRoutes([]);}} className={input} placeholder="Kızılay, Ankara" /></label><label>{tr ? 'Nereye?' : 'To'}<input required minLength={3} maxLength={250} value={destination} onChange={e=>{setDestination(e.target.value);setRoutes([]);}} className={input} placeholder="Anıtkabir, Ankara" /></label>
    <label>{tr ? 'Kalkış (cihazınızın saat dilimi; boşsa şimdi)' : 'Departure (device time zone; blank means now)'}<input type="datetime-local" value={departure} onChange={e=>{setDeparture(e.target.value);setRoutes([]);}} className={input}/></label>
    <label>{tr ? 'Tercih' : 'Preference'}<select value={preference} onChange={e=>{setPreference(e.target.value);setRoutes([]);}} className={input}><option value="FEWER_TRANSFERS">{tr ? 'Daha az aktarma' : 'Fewer transfers'}</option><option value="LESS_WALKING">{tr ? 'Daha az yürüme' : 'Less walking'}</option></select></label><button disabled={busy} className="bg-sky-600 text-white rounded-xl p-3 font-bold disabled:opacity-50">{busy ? (tr ? 'Aranıyor…' : 'Searching…') : (tr ? 'Rotaları karşılaştır' : 'Compare routes')}</button></form>
    {message && <p role="status" className="bg-amber-50 text-amber-900 rounded-xl p-3 text-sm">{message}</p>}
    {routes.map((route,index)=><article key={index} className="border border-sky-100 rounded-xl p-4 space-y-3"><h3 className="font-bold">{tr ? 'Seçenek' : 'Option'} {index+1} · {Math.ceil(parseFloat(route.duration)/60)} {tr ? 'dakika' : 'min'}</h3><p>{tr ? 'Tahmini toplam ücret' : 'Estimated total fare'}: {route.travelAdvisory?.transitFare ? `${route.travelAdvisory.transitFare.currencyCode} ${(Number(route.travelAdvisory.transitFare.units ?? 0)+Number(route.travelAdvisory.transitFare.nanos ?? 0)/1e9).toFixed(2)}` : (tr ? 'Sağlayıcı ücret bildirmedi' : 'Not supplied')}</p>{route.legs?.flatMap((leg:any)=>leg.steps ?? []).map((step:any,i:number)=><div key={i} className="bg-slate-50 p-3 rounded-lg text-sm">{step.transitDetails ? <><strong>{step.transitDetails.transitLine?.nameShort || step.transitDetails.transitLine?.name} · {step.transitDetails.headsign}</strong><p>{step.transitDetails.stopDetails?.departureStop?.name} → {step.transitDetails.stopDetails?.arrivalStop?.name}</p><p>{time(step.transitDetails.stopDetails?.departureTime)} → {time(step.transitDetails.stopDetails?.arrivalTime)} · {step.transitDetails.stopCount} {tr ? 'durak' : 'stops'}</p></> : <p>{step.navigationInstruction?.instructions || (tr ? 'Yürüyüş bağlantısı' : 'Walking connection')}</p>}</div>)}<p className="text-xs text-slate-500">Google Maps · {tr ? 'Saatler Türkiye saatidir. Tahminler değişebilir; araçların canlı konumu değildir.' : 'Times are in Türkiye time. Estimates may change; these are not live vehicle positions.'}</p></article>)}
  </section>;
}
