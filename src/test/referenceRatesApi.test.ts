import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/reference-rates';

const rows = ['USD','GBP','CHF','TRY','AED','SAR','CNY'].map((quote, i) => ({base:'EUR',quote,date:'2026-09-23',rate:i + 1}));
const response = () => ({ status:vi.fn().mockReturnThis(), setHeader:vi.fn(), json:vi.fn() });
afterEach(() => vi.unstubAllGlobals());
describe('reference rate proxy', () => {
  it('returns validated original publication with short shared caching', async () => {
    const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>rows}); vi.stubGlobal('fetch',fetcher);
    const res=response(); await handler({method:'GET'},res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rows);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control','public, max-age=60, s-maxage=300');
    expect(fetcher.mock.calls[0][0]).toContain('/providers/tcmb/');
    expect(fetcher.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
  it.each(['timeout','http','invalid','empty'])('sanitizes %s and does not cache failures', async kind => {
    vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>{
      if(kind==='timeout') throw new Error('RAW_SECRET');
      return {ok:kind!=='http',json:async()=>kind==='empty'?[]:[{bad:true}]};
    }));
    const res=response(); await handler({method:'GET'},res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({error:'REFERENCE_RATES_UNAVAILABLE'});
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control','no-store');
  });
  it('rejects mutations before fetching', async()=>{
    const fetcher=vi.fn(); vi.stubGlobal('fetch',fetcher);
    const res=response(); await handler({method:'POST'},res);
    expect(res.status).toHaveBeenCalledWith(405); expect(fetcher).not.toHaveBeenCalled();
  });
});
