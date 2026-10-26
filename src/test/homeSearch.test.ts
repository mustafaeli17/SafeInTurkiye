import {afterEach,expect,it,vi} from 'vitest'
import {discoverySearch,guideSearch,matchesGuide,wantsNearby} from '../services/homeSearch'
import {fetchGoogleNearby} from '../services/googleNearby'
import handler from '../../api/places'
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()})
it.each(['Kadıköy restoran','Estambul restaurante','伊斯坦布尔餐厅','مطاعم إسطنبول','рестораны Стамбула','Berlin Restaurant'])('recognizes restaurant queries: %s',q=>expect(discoverySearch(q)?.category).toBe('restaurant'))
it.each(['Antalya otel','فنادق أنطاليا','安塔利亚酒店'])('recognizes hotels: %s',q=>expect(discoverySearch(q)?.category).toBe('hotel'))
it.each(['yakınımdaki döviz bürosu','restaurants near me','附近餐厅','مطاعم بالقرب مني'])('requires location for %s',q=>expect(wantsNearby(q)).toBe(true))
it('does not guess a section for unknown text',()=>expect(discoverySearch('abcxyz')).toBeUndefined())
it('matches an Istanbulkart question without matching every FAQ',()=>{
 expect(guideSearch('İstanbulkart nasıl alınır?')).toBe(true)
 expect(matchesGuide('Istanbulkart satın alma ve kullanma','İstanbulkart nasıl alınır?')).toBe(true)
 expect(matchesGuide('Müze biletleri','İstanbulkart nasıl alınır?')).toBe(false)
})
it('passes the full place query to Text Search with a category and no-store',async()=>{
 vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only')
 const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[]})});vi.stubGlobal('fetch',f)
 const res={status:vi.fn().mockReturnThis(),setHeader:vi.fn(),json:vi.fn()}
 await handler({method:'GET',url:'/?lat=41&lng=29&category=restaurant&q=Kad%C4%B1k%C3%B6y+restoran',headers:{'x-forwarded-for':'text-search-test'}},res)
 expect(f.mock.calls[0][0]).toContain('places:searchText')
 expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({textQuery:'Kadıköy restoran',includedType:'restaurant',strictTypeFiltering:true})
 expect(res.json).toHaveBeenCalledWith({provider:'Google Maps',places:[]})
 expect(res.setHeader).toHaveBeenCalledWith('Cache-Control','private, no-store')
})
it('rejects oversized text without a provider request',async()=>{
 const f=vi.fn();vi.stubGlobal('fetch',f)
 const res={status:vi.fn().mockReturnThis(),setHeader:vi.fn(),json:vi.fn()}
 await handler({method:'GET',url:'/?lat=41&lng=29&q='+('a'.repeat(201)),headers:{}},res)
 expect(res.status).toHaveBeenCalledWith(400);expect(f).not.toHaveBeenCalled()
})
it('does not discard an explicit area search because of the default city center',async()=>{
 const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[{id:'hotel',displayName:{text:'Test hotel'},location:{latitude:36.9,longitude:30.7},types:['hotel'],googleMapsUri:'https://maps.google.com/?cid=1'}]})});vi.stubGlobal('fetch',f)
 expect((await fetchGoogleNearby({lat:41,lng:29},'hotel','en',undefined,'city','Antalya hotel')).places).toHaveLength(1)
 expect(f.mock.calls[0][0]).toContain('q=Antalya+hotel')
 expect((await fetchGoogleNearby({lat:41,lng:29},'hotel','en',undefined,'nearby')).places).toHaveLength(0)
})
