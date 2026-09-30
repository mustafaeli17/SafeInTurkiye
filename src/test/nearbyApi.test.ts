import {afterEach, describe, expect, it, vi} from 'vitest';
import handler from '../../api/nearby';
function response() { return {status:vi.fn().mockReturnThis(),setHeader:vi.fn(),json:vi.fn()}; }
afterEach(()=>vi.unstubAllGlobals());
describe('nearby server',()=>{
 it('uses only the primary provider on success and preserves genuine zero results',async()=>{
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({elements:[]})});vi.stubGlobal('fetch',fetchMock);
  const res=response();await handler({method:'GET',url:'/api/nearby?lat=39.99&lng=32.9&kind=essential',headers:{'x-forwarded-for':'primary-success'}},res);
  expect(fetchMock).toHaveBeenCalledTimes(1);expect(res.json).toHaveBeenCalledWith({elements:[]});
 });
 it('continues to the backup after a primary timeout',async()=>{
  const fetchMock=vi.fn().mockRejectedValueOnce(new DOMException('Timed out','TimeoutError')).mockResolvedValueOnce({ok:true,json:async()=>({elements:[]})});vi.stubGlobal('fetch',fetchMock);
  const res=response();await handler({method:'GET',url:'/api/nearby?lat=39.98&lng=32.9&kind=essential',headers:{'x-forwarded-for':'primary-timeout'}},res);
  expect(fetchMock).toHaveBeenCalledTimes(2);expect(res.status).toHaveBeenCalledWith(200);
 });
 it('never sends raw upstream failures or invented records to visitors',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('RAW_API_SECRET_DIAGNOSTIC')));
  const res=response();await handler({method:'GET',url:'/api/nearby?lat=39.97&lng=32.9&kind=essential',headers:{'x-forwarded-for':'all-failed'}},res);
  expect(res.status).toHaveBeenCalledWith(503);expect(res.json).toHaveBeenCalledWith({error:'PLACE_PROVIDER_UNAVAILABLE'});
 });
 it('rejects nonnumeric and out-of-range coordinates',async()=>{
  const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
  for(const lat of ['abc','91','Infinity']){const res=response();await handler({method:'GET',url:`/api/nearby?lat=${lat}&lng=29&kind=exchange`,headers:{}},res);expect(res.status).toHaveBeenCalledWith(400);}
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it('rejects blank coordinates without calling a provider',async()=>{
  const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
  const res=response();await handler({method:'GET',url:'/api/nearby?lat=&lng=29&kind=exchange',headers:{}},res);
  expect(res.status).toHaveBeenCalledWith(400);expect(fetchMock).not.toHaveBeenCalled();
 });
 it('falls back to Photon when Overpass providers fail',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:false}).mockResolvedValueOnce({ok:false}).mockResolvedValueOnce({ok:true,json:async()=>({features:[]})}));
  const res=response();await handler({method:'GET',url:'/api/nearby?lat=41&lng=29&kind=exchange',headers:{'x-forwarded-for':'test-photon'}},res);
  expect(res.status).toHaveBeenCalledWith(200);expect(res.json).toHaveBeenCalledWith({provider:'Photon',elements:[]});
 });
 it('rejects absent coordinates rather than searching zero zero',async()=>{
  const res=response(); await handler({method:'GET',url:'/api/nearby?kind=essential',headers:{}},res);
  expect(res.status).toHaveBeenCalledWith(400);
 });
 it('uses a healthy backup when primary fails or sends incomplete data',async()=>{
  const fetchMock=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({elements:[],remark:'timeout'})}).mockResolvedValueOnce({ok:true,json:async()=>({elements:[{id:1}]})});
  vi.stubGlobal('fetch',fetchMock);const res=response();
  await handler({method:'GET',url:'/api/nearby?lat=41.01&lng=29&kind=exchange',headers:{'x-forwarded-for':'test-backup'}},res);
  expect(res.status).toHaveBeenCalledWith(200);expect(res.json).toHaveBeenCalledWith({elements:[{id:1}]});
  expect(fetchMock.mock.calls[0][0]).toContain('?data=');
 });
 it('reports provider failure as unavailable rather than an empty search',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:429}));const res=response();
  await handler({method:'GET',url:'/api/nearby?lat=41&lng=29&kind=essential',headers:{'x-forwarded-for':'test-unavailable'}},res);
 expect(res.status).toHaveBeenCalledWith(503);
 });
 it('coalesces identical requests and caches successful results',async()=>{
  const mock=vi.fn().mockResolvedValue({ok:true,json:async()=>({elements:[]})});vi.stubGlobal('fetch',mock);
  const req={method:'GET',url:'/api/nearby?lat=40.99&lng=29.1&kind=exchange',headers:{'x-forwarded-for':'cache-test'}};
  await Promise.all([handler(req,response()),handler(req,response())]);
  await handler(req,response());
  expect(mock).toHaveBeenCalledTimes(1);
 });
 it('allows exchange and essentials consecutively for the same visitor',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({elements:[]})}));
  for(const kind of ['exchange','essential']) {
   const res=response();await handler({method:'GET',url:`/api/nearby?lat=38.4&lng=27.1&kind=${kind}`,headers:{'x-forwarded-for':'both-kinds'}},res);
   expect(res.status).toHaveBeenCalledWith(200);
  }
 });
});
