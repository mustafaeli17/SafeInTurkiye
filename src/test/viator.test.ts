import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from '../../api/viator'
const response = () => ({ status: vi.fn().mockReturnThis(), setHeader: vi.fn(), json: vi.fn() })
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
describe('Viator affiliate boundary', () => {
  it('requires a server credential without contacting the provider', async () => {
    vi.stubEnv('VIATOR_API_KEY', ''); const f = vi.fn(); vi.stubGlobal('fetch', f)
    const r = response(); await handler({ method: 'GET', url: '/?city=istanbul', headers: {} }, r)
    expect(r.json).toHaveBeenCalledWith({ error: 'NOT_CONFIGURED' }); expect(f).not.toHaveBeenCalled()
  })
  it.each(['city=unknown', 'city=istanbul&start=0', 'city=istanbul&start=2', 'city=istanbul&start=10009', 'city=istanbul&currency=FAKE', 'city=istanbul&lang=xx'])('rejects invalid input %s', async query => {
    const r=response(); await handler({ method: 'GET', url: `/?${query}`, headers: {} }, r); expect(r.status).toHaveBeenCalledWith(400)
  })
  it('uses sandbox, real taxonomy and preserves affiliate links; omits unsafe URLs', async () => {
    vi.stubEnv('VIATOR_API_KEY','secret-test'); vi.stubEnv('VERCEL_ENV','preview')
    const productUrl='https://www.viator.com/tours/test?pid=P123&mcid=42383&medium=api'
    const f=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({destinations:[{destinationId:1,name:'Turkey'},{destinationId:2,name:'Istanbul',parentDestinationId:1}]})})
      .mockResolvedValueOnce({ok:true,json:async()=>({products:[{productCode:'1P1',title:'Tour',productUrl,pricing:{currency:'EUR',summary:{fromPrice:20}}},{productCode:'bad',title:'bad',productUrl:'https://evil.test/?pid=X'}],totalCount:2})})
    vi.stubGlobal('fetch',f); const r=response()
    await handler({method:'GET',url:'/?city=istanbul&lang=es&maxPrice=100&private=true&sort=priceAsc',headers:{'x-forwarded-for':'success'}},r)
    expect(f.mock.calls[0][0]).toBe('https://api.sandbox.viator.com/partner/destinations')
    expect(f.mock.calls[0][1].headers['Accept-Language']).toBe('en')
    expect(JSON.parse(f.mock.calls[1][1].body).filtering.destination).toBe('2')
    expect(JSON.parse(f.mock.calls[1][1].body).filtering.highestPrice).toBe(100)
    expect(JSON.parse(f.mock.calls[1][1].body).filtering.flags).toEqual(['PRIVATE_TOUR'])
    expect(JSON.parse(f.mock.calls[1][1].body).sorting).toEqual({sort:'PRICE',order:'ASCENDING'})
    expect(f.mock.calls[1][1].headers['Accept-Language']).toBe('es')
    const body=r.json.mock.calls[0][0]; expect(body.products).toHaveLength(1); expect(body.products[0].productUrl).toBe(productUrl)
    expect(JSON.stringify(body)).not.toContain('secret-test'); expect(body.sandbox).toBe(true)
    expect(r.setHeader).toHaveBeenCalledWith('Cache-Control','private, no-store')
  })
  it.each([401,403,429,500])('sanitizes upstream status %s',async status=>{
    vi.stubEnv('VIATOR_API_KEY','secret-test'); vi.stubEnv('VERCEL_ENV','preview')
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status})); const r=response()
    await handler({method:'GET',url:'/?city=istanbul',headers:{'x-forwarded-for':String(status)}},r)
    expect(r.json).toHaveBeenCalledWith({error:status===401||status===403?'ACCESS_PENDING':status===429?'BUSY':'PROVIDER_UNAVAILABLE'})
  })
  it('can explicitly read production catalog from preview without exposing credentials',async()=>{
    vi.stubEnv('VIATOR_API_KEY','production-test'); vi.stubEnv('VERCEL_ENV','preview'); vi.stubEnv('VIATOR_ENVIRONMENT','production')
    const f=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({destinations:[{destinationId:1,name:'Turkey'},{destinationId:2,name:'Istanbul',parentDestinationId:1}]})})
      .mockResolvedValueOnce({ok:true,json:async()=>({products:[],totalCount:0})})
    vi.stubGlobal('fetch',f); const r=response()
    await handler({method:'GET',url:'/?city=istanbul',headers:{'x-forwarded-for':'production-preview'}},r)
    expect(f.mock.calls[0][0]).toBe('https://api.viator.com/partner/destinations')
    expect(r.json.mock.calls[0][0].sandbox).toBe(false)
    expect(JSON.stringify(r.json.mock.calls)).not.toContain('production-test')
  })
  it('fails closed for an invalid provider environment',async()=>{
    vi.stubEnv('VIATOR_API_KEY','test');vi.stubEnv('VIATOR_ENVIRONMENT','other')
    const f=vi.fn();vi.stubGlobal('fetch',f);const r=response()
    await handler({method:'GET',url:'/?city=istanbul',headers:{'x-forwarded-for':'bad-env'}},r)
    expect(r.json).toHaveBeenCalledWith({error:'NOT_CONFIGURED'});expect(f).not.toHaveBeenCalled()
  })
})
