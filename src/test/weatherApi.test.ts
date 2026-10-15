import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {parseMetForecast} from '../services/travelDataService';
let handler:typeof import('../../api/weather').default;
beforeEach(async()=>{vi.resetModules();handler=(await import('../../api/weather')).default;});
const response = () => ({status:vi.fn().mockReturnThis(),json:vi.fn(),setHeader:vi.fn()});
const fixture=()=>({properties:{meta:{updated_at:new Date().toISOString(),units:{air_temperature:'celsius',relative_humidity:'%',wind_speed:'m/s'}},timeseries:[{time:new Date(Math.floor(Date.now()/3600000)*3600000).toISOString(),data:{instant:{details:{air_temperature:20,relative_humidity:50,wind_speed:10}},next_1_hours:{summary:{symbol_code:'clearsky_day'}}}}]}});
const query = {latitude:'41',longitude:'29'};
afterEach(() => vi.unstubAllGlobals());
it.each([{latitude:'91',longitude:'29'},{latitude:'41',longitude:'181'},{latitude:'',longitude:'29'},{latitude:'NaN',longitude:'29'}])('rejects invalid coordinates %j',async query => {
  const fetcher=vi.fn(); vi.stubGlobal('fetch',fetcher); const res=response();
  await handler({query},res); expect(res.status).toHaveBeenCalledWith(400); expect(fetcher).not.toHaveBeenCalled();
});
it('rejects mutations',async()=>{
  const fetcher=vi.fn(); vi.stubGlobal('fetch',fetcher); const res=response();
  await handler({method:'POST',query},res); expect(res.status).toHaveBeenCalledWith(405); expect(fetcher).not.toHaveBeenCalled();
});
it.each(['timeout','http','malformed'])('sanitizes %s failures',async kind=>{
  vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>{if(kind==='timeout')throw new Error('SECRET');return {ok:kind!=='http',json:async()=>({raw:'SECRET'})};}));
  const res=response(); await handler({query},res); expect(res.status).toHaveBeenCalledWith(502); expect(res.json).toHaveBeenCalledWith({error:'Weather provider is unavailable.'});
});
it('validates successful payload and supplies a timeout signal',async()=>{
  const body=fixture();
  const fetcher=vi.fn().mockResolvedValue({ok:true,headers:new Headers(),json:async()=>body}); vi.stubGlobal('fetch',fetcher);
  const res=response();await handler({query},res);expect(res.status).toHaveBeenCalledWith(200);expect(res.json).toHaveBeenCalledWith(body);expect(fetcher.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
});
it('uses attribution identity, truncated coordinates and a shared cache',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,headers:new Headers({expires:new Date(Date.now()+3600000).toUTCString()}),json:async()=>fixture()});vi.stubGlobal('fetch',fetcher);
 await handler({query:{latitude:'41.1234567',longitude:'29.1234567'}},response());
 await handler({query:{latitude:'41.1234568',longitude:'29.1234568'}},response());
 expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher.mock.calls[0][0]).toContain('lat=41.1234&lon=29.1234');expect(fetcher.mock.calls[0][1].headers['User-Agent']).toContain('safeinturkiye.com');
});
it('backs off when the provider throttles requests',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:false,status:429,headers:new Headers({'retry-after':'120'})});vi.stubGlobal('fetch',fetcher);
 await handler({query},response());await handler({query},response());expect(fetcher).toHaveBeenCalledTimes(1);
});
it('revalidates expired cached data with Last-Modified and supports 304',async()=>{
 const body=fixture(),last=new Date().toUTCString();
 const fetcher=vi.fn().mockResolvedValueOnce({ok:true,status:200,headers:new Headers({'last-modified':last}),json:async()=>body}).mockResolvedValueOnce({ok:false,status:304,headers:new Headers(),json:vi.fn()});vi.stubGlobal('fetch',fetcher);
 await handler({query},response());
 const clock=vi.spyOn(Date,'now').mockReturnValue(Date.now()+61000);
 try{const res=response();await handler({query},res);expect(fetcher.mock.calls[1][1].headers['If-Modified-Since']).toBe(last);expect(res.status).toHaveBeenCalledWith(200);}finally{clock.mockRestore();}
});
it('converts wind m/s to km/h and reads forecast time',()=>{const result=parseMetForecast(fixture());expect(result.windSpeed).toBe(36);expect(result.temperature).toBe(20);expect(result.code).toBe(0);expect(result.updatedAt).toBeDefined();});
it('rejects stale model data and unavailable forecast time',()=>{
 const old=fixture();old.properties.meta.updated_at='2020-01-01T00:00:00Z';expect(()=>parseMetForecast(old)).toThrow();
 const future=fixture();future.properties.timeseries[0].time=new Date(Date.now()+86400000).toISOString();expect(()=>parseMetForecast(future)).toThrow();
});
it('does not invent a condition when the symbol is missing',()=>{const body=fixture();body.properties.timeseries[0].data.next_1_hours.summary.symbol_code='';expect(parseMetForecast(body).code).toBe(40);});
