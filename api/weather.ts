import { parseMetForecast } from '../src/services/travelDataService.js';
type RequestLike = { method?: string; query?: Record<string, string | string[] | undefined> };
type ResponseLike = { status: (code: number) => ResponseLike; json: (body: unknown) => void; setHeader?: (name:string,value:string)=>void };
type Cached = { body:unknown; expires:number; modified:string|null };
const cache = new Map<string,Cached>();
const pending = new Map<string,Promise<Cached>>();
let blockedUntil = 0;

async function forecast(key:string):Promise<Cached> {
  const old = cache.get(key);
  if (old && old.expires > Date.now()) return old;
  if (Date.now() < blockedUntil) throw new Error('Provider cooldown');
  if (pending.has(key)) return pending.get(key)!;
  const task = (async()=>{
    const headers:Record<string,string> = {'User-Agent':'SafeInTurkiye/1.0 https://www.safeinturkiye.com/',Accept:'application/json'};
    if(old?.modified) headers['If-Modified-Since']=old.modified;
    const upstream = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?${key}`,{headers,signal:AbortSignal.timeout(8000)});
    if(upstream.status===429 || upstream.status===403) {
      const seconds=Number(upstream.headers.get('retry-after'));
      blockedUntil=Date.now()+Math.max(60000,Number.isFinite(seconds)?seconds*1000:0);
    }
    if(!upstream.ok && upstream.status!==304) throw new Error('Provider unavailable');
    const body=upstream.status===304 && old ? old.body : await upstream.json();
    parseMetForecast(body);
    const expiry=Date.parse(upstream.headers.get('expires')??'');
    const value={body,expires:Number.isFinite(expiry)&&expiry>Date.now()?expiry:Date.now()+60000,modified:upstream.headers.get('last-modified')??old?.modified??null};
    if(cache.size>=100 && !cache.has(key))cache.delete(cache.keys().next().value!);
    cache.set(key,value);
    return value;
  })();
  pending.set(key,task);
  try {return await task;} finally {pending.delete(key);}
}

export default async function handler(request: RequestLike, response: ResponseLike) {
  response.setHeader?.('Cache-Control','no-store');
  if (request.method && request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  const latitude = typeof request.query?.latitude === 'string' ? request.query.latitude : '';
  const longitude = typeof request.query?.longitude === 'string' ? request.query.longitude : '';
  if (!/^-?\d+(\.\d+)?$/.test(latitude) || !/^-?\d+(\.\d+)?$/.test(longitude) || Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180) {
    response.status(400).json({ error: 'Valid latitude and longitude are required.' });
    return;
  }
  try {
    const lat=String(Math.trunc(Number(latitude)*10000)/10000);
    const lon=String(Math.trunc(Number(longitude)*10000)/10000);
    const value=await forecast(`lat=${lat}&lon=${lon}`);
    parseMetForecast(value.body);
    const ttl=Math.max(0,Math.floor((value.expires-Date.now())/1000));
    response.setHeader?.('Cache-Control',`public, max-age=${Math.min(ttl,300)}, s-maxage=${ttl}`);
    response.status(200).json(value.body);
  } catch {
    response.status(502).json({ error: 'Weather provider is unavailable.' });
  }
}
