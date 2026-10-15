import { afterEach, expect, it, vi } from 'vitest';
import handler from '../../api/weather';
const response = () => ({status:vi.fn().mockReturnThis(),json:vi.fn()});
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
  const body={current_units:{time:'unixtime',temperature_2m:'°C',relative_humidity_2m:'%',wind_speed_10m:'km/h'},current:{time:Math.floor(Date.now()/1000),temperature_2m:20,relative_humidity_2m:50,wind_speed_10m:10,weather_code:0,is_day:1}};
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>body}); vi.stubGlobal('fetch',fetcher);
  const res=response();await handler({query},res);expect(res.status).toHaveBeenCalledWith(200);expect(res.json).toHaveBeenCalledWith(body);expect(fetcher.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
});
