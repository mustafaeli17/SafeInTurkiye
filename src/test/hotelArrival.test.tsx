import {renderToStaticMarkup} from 'react-dom/server'
import {afterEach, describe, expect, it, vi} from 'vitest'
import HotelArrival, {HotelArrivalComparison} from '../components/HotelArrival'
import {hotelArrivalCopy} from '../lib/hotelArrivalCopy'
import {arrivalAirports, comparableHotel, loadHotelArrival} from '../lib/hotelArrival'
import {getCurrentTaxiTariffs} from '../repositories/tariffRepository'
import type {NearbyPlaceRecord} from '../services/nearbyPlaces'

vi.mock('../repositories/tariffRepository', () => ({getCurrentTaxiTariffs:vi.fn()}))
const hotel: NearbyPlaceRecord = {
  id:'google:test', category:'hotel', name:'Example Hotel', address:'Divan Yolu 10, 34122 Fatih/İstanbul, Türkiye',
  coordinates:{lat:41.008, lng:28.972}, distanceMeters:0, openingHours:null, phone:null, telephoneUrl:null,
  website:null, sourceUrl:'https://maps.google.com/',
}
const route = {duration:'4500s', legs:[{steps:[{travelMode:'TRANSIT', transitDetails:{transitLine:{nameShort:'M11'}}},
  {travelMode:'WALK'}, {travelMode:'TRANSIT',transitDetails:{transitLine:{nameShort:'M2'}}}]}],
  travelAdvisory:{transitFare:{currencyCode:'TRY', units:'50', nanos:500000000}}}
const tariff = {city:'İstanbul', vehicleClass:'YELLOW', openingFare:50, perKm:25, minimumFare:150,
  waitingFare:5, effectiveFrom:'2026-01-01', effectiveTo:null, sourceUrl:'https://iteo.org.tr/', sourceName:'İTEO', lastVerified:'2026-11-20'}
const comparison = (signal=new AbortController().signal) => loadHotelArrival('IST', hotel.coordinates, 'en', signal)
function providers(road:unknown, transit:unknown) {
  const fetcher = vi.fn(async (url: string) => {
    const result = url === '/api/transit' ? transit : road
    if (result instanceof Error) throw result
    return Response.json(result)
  })
  vi.stubGlobal('fetch',fetcher)
  return fetcher
}
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();vi.clearAllMocks()})

describe('Istanbul hotel arrival',()=>{
  it('requires an addressed hotel in Istanbul, independent of the search city',()=>{
    expect(comparableHotel(hotel)).toBe(true)
    expect(comparableHotel({...hotel,cityName:'Ankara'})).toBe(false)
    expect(comparableHotel({...hotel,cityName:'Стамбул',address:'Divan Yolu No. 10'})).toBe(true)
    for(const change of [{category:'restaurant'}, {address:null}, {address:'İstanbul Cd. 1, Ankara'},
      {name:null}, {coordinates:{lat:0,lng:0}}]) expect(comparableHotel({...hotel,...change} as NearbyPlaceRecord)).toBe(false)
  })
  it('renders both airports and the real driver address without provider requests',()=>{
    const fetcher=providers({}, {})
    const html=renderToStaticMarkup(<HotelArrival hotel={hotel} lang="en"/>)
    for(const text of ['IST','SAW','Show the driver',hotel.name,hotel.address,'lang="tr"'])expect(html).toContain(text)
    expect(renderToStaticMarkup(<HotelArrival hotel={{...hotel,address:null}} lang="en"/>)).toBe('')
    expect(fetcher).not.toHaveBeenCalled()
    expect(getCurrentTaxiTariffs).not.toHaveBeenCalled()
  })
  it('routes from distinct passenger stops to the real hotel and prices the primary road route',async()=>{
    vi.mocked(getCurrentTaxiTariffs).mockResolvedValue([tariff])
    const fetcher=providers({routes:[{duration:2400,distance:40000}]},{routes:[route]})
    const result=await comparison()
    expect(result.taxi).toMatchObject({distanceKm:40,duration:'2400s',fare:{amount:1050,verified:true}})
    expect(result.transit).toMatchObject({duration:'4500s',transfers:1,lines:['M11','M2'],fare:{amount:50.5,currency:'TRY'}})
    expect(fetcher.mock.calls.some(([url])=>url.includes('28.7426,41.25895;28.972,41.008'))).toBe(true)
    expect(arrivalAirports.SAW.point).not.toEqual(arrivalAirports.IST.point)
    const call=vi.mocked(fetch).mock.calls.find(([url])=>url==='/api/transit')!
    expect(JSON.parse(String(call[1]?.body))).toMatchObject({origin:arrivalAirports.IST.point,destination:hotel.coordinates,language:'en'})
  })
  it('offers a driver card for a hotel outside Istanbul, without running an airport comparison',()=>{
    const fetcher=providers({}, {})
    const outside={...hotel,cityName:'Antalya',address:'Test oteli, Antalya',coordinates:{lat:36.88,lng:30.70}}
    const html=renderToStaticMarkup(<HotelArrival hotel={outside} lang="tr"/>)
    expect(html).toContain(outside.address)
    expect(html).toContain('Adresi kopyala')
    expect(html).not.toContain('SAW')
    expect(html).toContain('Google Maps')
    for(const incomplete of [{name:' '},{address:' '},{category:'restaurant' as const}])
      expect(renderToStaticMarkup(<HotelArrival hotel={{...outside,...incomplete}} lang="tr"/>)).toBe('')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('keeps taxi results when transit fails and identifies the current planning fallback',async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-22T10:00:00Z'))
    vi.mocked(getCurrentTaxiTariffs).mockRejectedValue(new Error('offline'))
    providers({routes:[{duration:2400,distance:40000}]},new Error('busy'))
    expect(await comparison()).toMatchObject({taxi:{fare:{verified:false}},transit:null})
    vi.setSystemTime(new Date('2027-03-01T10:00:00Z'))
    expect(await comparison()).toMatchObject({taxi:{distanceKm:40,fare:null},transit:null})
  })
  it('splits a single vehicle fare and multiplies a passenger fare only under their stated assumptions',async()=>{
    vi.mocked(getCurrentTaxiTariffs).mockResolvedValue([tariff])
    providers({routes:[{duration:2400,distance:40000}]},{routes:[route]})
    const result=await comparison()
    const html=renderToStaticMarkup(<HotelArrivalComparison hotel={hotel} result={result} lang="en" airport="IST" travellers={3}/>)
    for (const text of ['1,050.00','350.00','50.50','151.50','1 transfer','40 min','1 hr 15 min','their bags','same fare'])
      expect(html).toContain(text)
  })
  it.each(['tr','de','fr','es','ar','ru','zh'])('uses local controls and Turkish driver text in %s',lang=>{
    const html=renderToStaticMarkup(<HotelArrival hotel={hotel} lang={lang}/>)
    expect(html).toContain(hotelArrivalCopy[lang].compare)
    expect(html).toContain(hotelArrivalCopy[lang].driverHint)
    expect(html).not.toContain('Compare routes')
    expect(html).toContain('Lütfen beni bu otele götürür müsünüz?')
  })
  it('keeps transit without inventing prices when road routing or fare data is missing',async()=>{
    vi.mocked(getCurrentTaxiTariffs).mockResolvedValue([])
    providers({routes:[]},{routes:[{...route,travelAdvisory:{transitFare:{currencyCode:'TRY'}}}]})
    expect(await comparison()).toMatchObject({taxi:null,transit:{transfers:1,fare:null}})
    providers({routes:[]},{routes:[{duration:'500s',legs:[{steps:[{travelMode:'WALK'}]}]}]})
    expect(await comparison()).toEqual({taxi:null,transit:null})
  })
  it('discards canceled comparisons even when providers complete',async()=>{
    vi.mocked(getCurrentTaxiTariffs).mockResolvedValue([])
    providers({routes:[{duration:60,distance:500}]},{routes:[route]})
    const controller=new AbortController()
    const response=comparison(controller.signal)
    controller.abort()
    await expect(response).rejects.toMatchObject({name:'AbortError'})
  })
})
