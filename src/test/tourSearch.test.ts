import {afterEach,describe,it,expect,vi} from 'vitest'
import handler from '../../api/viator'
import {tourIntent,tourSearchTerm,tourSearchCopy} from '../services/tourSearch'
const response=()=>({status:vi.fn().mockReturnThis(),setHeader:vi.fn(),json:vi.fn()})
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()})
describe('Tour keyword search',()=>{
  it.each(['İstanbul airport transfer','özel şehir turu','özel müze turu','private city tour','机场接送'])('routes tour intent %s',q=>expect(tourIntent(q)).toBe(true))
  it('keeps public transport and restaurants out of tour intent',()=>{
    expect(tourIntent('İstanbul metro')).toBe(false)
    expect(tourIntent('turkish restaurant')).toBe(false)
  })
  it('normalises only common Turkish phrases and retains specific landmarks',()=>{
    expect(tourSearchTerm('İstanbul özel şehir turu')).toBe('Istanbul private city tour')
    expect(tourSearchTerm('Topkapı özel müze turu')).toBe('Topkapı private museum tour')
    expect(Object.keys(tourSearchCopy)).toHaveLength(8)
  })
  it('rejects oversized queries before contacting provider',async()=>{
    const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);const res=response()
    await handler({method:'GET',url:'/?city=istanbul&q='+('a'.repeat(161)),headers:{}},res)
    expect(res.status).toHaveBeenCalledWith(400);expect(fetcher).not.toHaveBeenCalled()
  })
  it.each([true,false])('uses full-catalog text search with city/filter/paging and handles results=%s',async found=>{
    vi.stubEnv('VIATOR_API_KEY','test-secret');vi.stubEnv('VIATOR_ENVIRONMENT','sandbox')
    const link='https://www.viator.com/tours/Istanbul/transfer?pid=P123&mcid=42383'
    const fetcher=vi.fn().mockImplementation(async(path:string,init:RequestInit)=>{
      if(path.endsWith('/destinations'))return {ok:true,json:async()=>({destinations:[{destinationId:1,name:'Turkey'},{destinationId:2,name:'Istanbul',parentDestinationId:1}]})}
      expect(path).toContain('/search/freetext')
      expect(JSON.parse(init.body as string)).toMatchObject({searchTerm:'airport transfer',productFiltering:{destination:'2',price:{from:10,to:100},flags:['PRIVATE_TOUR'],dateRange:{from:'2026-11-01',to:'2026-11-01'}},productSorting:{sort:'REVIEW_AVG_RATING'},searchTypes:[{searchType:'PRODUCTS',pagination:{start:13,count:12}}]})
      return {ok:true,json:async()=>({products:{totalCount:found?20:0,results:found?[{productCode:'1P1',title:'Airport transfer',productUrl:link}]:[]}})}
    })
    vi.stubGlobal('fetch',fetcher);const res=response()
    await handler({method:'GET',url:'/?city=istanbul&q=airport%20transfer&minPrice=10&maxPrice=100&private=true&sort=rating&date=2026-11-01&start=13',headers:{'x-forwarded-for':String(found)}},res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0].products).toHaveLength(found?1:0)
    if(found)expect(res.json.mock.calls[0][0].products[0].productUrl).toBe(link)
  })
})
