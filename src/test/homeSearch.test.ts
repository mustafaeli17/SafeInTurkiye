import {afterEach,expect,it,vi} from 'vitest'
import {discoverySearch,guideSearch,homeSearchDestination,matchesGuide,wantsNearby} from '../services/homeSearch'
import {cityHighlightHref,highlightDescription} from '../lib/cityHighlights'
import {searchLanguages} from '../lib/searchLocales'
import {fetchGoogleNearby} from '../services/googleNearby'
import handler from '../../api/places'
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()})
it.each([
 'I need an ambulance', 'Ambulans çağırın', 'Ich brauche einen Krankenwagen',
 'Appelez une ambulance', 'Necesito una ambulancia', 'أحتاج إلى سيارة إسعاف',
 'Вызовите скорую помощь', '我需要救护车', '112',
])('takes an ambulance request to the emergency actions: %s', query=>{
 expect(homeSearchDestination(query)).toEqual({section:'safety'})
})
it.each([
 'Taxi from the airport to my hotel', 'Havalimanından otelime taksi',
 'Taxi vom Flughafen zum Hotel', 'Taxi de l’aéroport à mon hôtel',
 'Taxi del aeropuerto a mi hotel', 'تاكسي من المطار إلى فندقي',
 'Такси из аэропорта в отель', '从机场坐出租车到酒店',
])('prioritizes the taxi journey over its destination: %s', query=>{
 expect(homeSearchDestination(query)).toEqual({section:'taxi'})
})
it.each(['Airport hotel', 'Taxim Hotel', 'Taksim otelleri'])('keeps a hotel discovery request: %s',query=>{
 expect(homeSearchDestination(query)).toEqual({section:'stay',category:'hotel'})
})
it.each(['Is Istanbul safe for tourists?', 'İstanbul turistler için güvenli mi?', 'Wie sicher ist Istanbul?', 'Est-ce sûr pour les touristes à Istanbul ?', '¿Es seguro viajar a Estambul?', 'هل إسطنبول آمنة للسياح؟', 'Безопасно ли в Стамбуле?', '伊斯坦布尔对游客安全吗？'])('routes a safety question to the guide: %s',q=>{
 expect(homeSearchDestination(q)).toEqual({section:'safety'})
})
it.each([
 ['How do I find a pharmacy near me?', 'nearme'],['Wie finde ich ein Hotel in Antalya?', 'stay'],
 ['Safe Hotel İstanbul','stay'],['un restaurant sur la côte','food'],
 ['How do I calculate my taxi fare?','taxi'],['İstanbulkart nasıl alınır?','assistant'],
 ['Estambul traslado al aeropuerto','tours'],['Topkapı Sarayı','nearme'],
])('keeps explicit and named searches usable: %s',(query,section)=>expect(homeSearchDestination(query).section).toBe(section))
it.each(searchLanguages)('opens the named city highlight in the current locale and keeps each Bursa description: %s',lang=>{
 const href=new URL(cityHighlightHref('Bursa','Koza Han',lang),'https://www.safeinturkiye.com')
 expect(href.pathname).toBe(lang==='en'?'/activities':`/${lang}/activities`)
 expect(Object.fromEntries(href.searchParams)).toEqual({city:'bursa',category:'all',lookup:'1',q:'Koza Han, Bursa'})
 for(const name of ['Koza Han','Ulu Cami','Uludağ','Gölyazı'])expect(highlightDescription('Bursa',name,lang)).toBeTruthy()
 expect(new URL(cityHighlightHref('İstanbul','Ayasofya ve Sultanahmet',lang),href).searchParams.get('q')).toBe('Ayasofya, İstanbul')
})
it('keeps a named historical landmark even when Google omits tourist_attraction',async()=>{
 const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[{id:'fixture',displayName:{text:'Fixture'},location:{latitude:40.18,longitude:29.06},primaryType:'historical_landmark',googleMapsUri:'https://maps.google.com/?cid=1'}]})})
 vi.stubGlobal('fetch',f)
 expect((await fetchGoogleNearby({lat:40.18,lng:29.06},'all','en',undefined,'city','Fixture, Bursa')).places[0].category).toBe('historical')
})
it.each(['Kadıköy restoran','Estambul restaurante','伊斯坦布尔餐厅','مطاعم إسطنبول','рестораны Стамбула','Berlin Restaurant'])('recognizes restaurant queries: %s',q=>expect(discoverySearch(q)?.category).toBe('restaurant'))
it.each(['Antalya otel','فنادق أنطاليا','安塔利亚酒店'])('recognizes hotels: %s',q=>expect(discoverySearch(q)?.category).toBe('hotel'))
it.each(['yakınımdaki döviz bürosu','restaurants near me','附近餐厅','مطاعم بالقرب مني'])('requires location for %s',q=>expect(wantsNearby(q)).toBe(true))
it('does not guess a section for unknown text',()=>expect(discoverySearch('abcxyz')).toBeUndefined())
it.each([['Pera Palace oteli','hotel'],['Çiya restoranı','restaurant'],['Kadıköy dövizci','bureau_de_change'],['Bodrum eğlence','activity'],['bowling','activity']])('recognizes named businesses and leisure: %s',(q,category)=>expect(discoverySearch(q)?.category).toBe(category))
it.each(['topkapi sarayi','Topkapı Sarayı','Ayasofya','Çiya','Pera Palace','mekan'])('leaves untyped names for unrestricted text search: %s',q=>expect(discoverySearch(q)).toBeUndefined())
it('searches a named landmark without imposing a business type',async()=>{
 vi.stubEnv('GOOGLE_PLACES_API_KEY','test-only')
 const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({places:[]})});vi.stubGlobal('fetch',f)
 const res={status:vi.fn().mockReturnThis(),setHeader:vi.fn(),json:vi.fn()}
 await handler({method:'GET',url:'/?lat=41&lng=29&category=all&q=topkapi+sarayi',headers:{'x-forwarded-for':'landmark-search-test'}},res)
 const body=JSON.parse(f.mock.calls[0][1].body)
 expect(f.mock.calls[0][0]).toContain('places:searchText')
 expect(body.textQuery).toBe('topkapi sarayi')
 expect(body.includedType).toBeUndefined()
 expect(body.strictTypeFiltering).toBeUndefined()
})
it.each(['yakınımda','near me','in der Nähe','à proximité','cerca de mí','рядом','بالقرب مني','附近'])('keeps bare nearby query location-dependent: %s',q=>expect(discoverySearch(q)).toEqual({section:'nearme',category:'all'}))
it.each([['Kadıköy kafe','cafe'],['Antalya yemek','restaurant'],['Istanbul food','restaurant'],['上海餐饮','restaurant'],['Bodrum stay','hotel']])('uses actual place search for %s', (q,category)=>expect(discoverySearch(q)?.category).toBe(category))
it.each(['Antalya hotel','Antalya hôtel','Hotel Antalya','Antalya otel','hotel en Antalya','отели Антальи','فنادق أنطاليا','安塔利亚酒店'])('recognizes hotel vocabulary across site languages: %s',q=>expect(discoverySearch(q)?.category).toBe('hotel'))
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
