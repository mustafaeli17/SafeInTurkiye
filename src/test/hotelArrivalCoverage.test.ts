import {afterEach,describe,expect,it,vi} from 'vitest'
import {airportOptionsForHotel,arrivalAirports,loadHotelArrival,type ArrivalAirport} from '../lib/hotelArrival'
import {searchDestinations} from '../lib/searchDestinations'
import {getCurrentTaxiTariffs} from '../repositories/tariffRepository'

vi.mock('../repositories/tariffRepository',()=>({getCurrentTaxiTariffs:vi.fn()}))
const scenarios:Array<[keyof typeof searchDestinations,string,ArrivalAirport[]]> = [
  ['İstanbul','Стамбул',['IST','SAW']],['Ankara','Ankara',['ESB']],
  ['Antalya','Provincia de Antalya',['AYT','GZP']],['Çeşme','İzmir',['ADB']],
  ['Bodrum','Muğla',['BJV','DLM']],['Kuşadası','Aydın',['ADB','BJV']],
  ['Cappadocia','Nevşehir',['NAV','ASR']],['Pamukkale','Denizli',['DNZ']],
  ['Trabzon','Trabzon',['TZX']],['Bursa','Bursa',['YEI']],['Konya','Konya',['KYA']],
  ['Gaziantep','Antep',['GZT']],
]
function hotel(city:keyof typeof searchDestinations,cityName:string) {
  return {category:'hotel',name:'Fixture hotel',coordinates:searchDestinations[city],cityName}
}
function providers(transit:unknown={routes:[]}) {
  vi.stubGlobal('fetch',vi.fn(async (url:string)=>Response.json(url==='/api/transit'?transit:{routes:[{distance:20000,duration:1800}]})))
  vi.mocked(getCurrentTaxiTariffs).mockResolvedValue([])
}
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();vi.restoreAllMocks();vi.clearAllMocks()})

describe('hotel arrival airport coverage',()=>{
  it.each(scenarios)('offers relevant sourced airports for %s', (city,cityName,expected)=>{
    const result=airportOptionsForHotel(hotel(city,cityName))
    expect(new Set(result)).toEqual(new Set(expected))
    for(const code of result){
      expect(arrivalAirports[code].sourceUrl).toMatch(/^https:/)
      expect(arrivalAirports[code].pointSourceUrl).toMatch(/^https:/)
    }
  })
  it('uses administrative address components, rejects conflicting or unrecognised provinces and implausible coordinates',()=>{
    const base={...hotel('Bodrum',''),address:'Örnek Caddesi, 48400 Bodrum/Muğla, Türkiye'}
    expect(airportOptionsForHotel(base)[0]).toBe('BJV')
    expect(airportOptionsForHotel({...base,cityName:'Balıkesir'})).toEqual([])
    expect(airportOptionsForHotel({...base,cityName:'Aydın'})).toEqual([])
    expect(airportOptionsForHotel({...base,address:'Muğla Caddesi 5'})).toEqual([])
    expect(airportOptionsForHotel({...base,coordinates:searchDestinations.Trabzon})).toEqual([])
    expect(airportOptionsForHotel({...base,category:'restaurant'})).toEqual([])
  })
  it('shows measured travel time without destination-province taxi prices for shared airport journeys',async()=>{
    providers()
    const stay=hotel('Kuşadası','Aydın')
    const result=await loadHotelArrival('ADB',stay.coordinates,'tr',new AbortController().signal,stay)
    expect(result).toEqual({taxi:{duration:'1800s',distanceKm:20,fare:null},transit:null})
    expect(getCurrentTaxiTariffs).not.toHaveBeenCalled()
  })
  it('selects the airport district when applying a local planning budget',async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-24T10:00:00Z'))
    providers()
    const stay=hotel('Çeşme','İzmir')
    const result=await loadHotelArrival('ADB',stay.coordinates,'en',new AbortController().signal,stay)
    expect(getCurrentTaxiTariffs).toHaveBeenCalledWith('İzmir',expect.any(AbortSignal))
    // Gaziemir (pickup) = 40 + 20×54. Çeşme (destination) has a different meter.
    expect(result.taxi?.fare).toMatchObject({amount:1120,verified:false})
    vi.setSystemTime(new Date('2027-01-20T10:00:00Z'))
    expect((await loadHotelArrival('ADB',stay.coordinates,'en',new AbortController().signal,stay)).taxi?.fare).toBeNull()
  })
  it('distinguishes a malformed upstream response from zero results',async()=>{
    providers({routes:[{error:'unexpected'}]})
    const stay=hotel('Bursa','Bursa')
    const result=await loadHotelArrival('YEI',stay.coordinates,'en',new AbortController().signal,stay)
    expect(result).toMatchObject({taxi:{distanceKm:20,fare:null},transit:null,transitStatus:'unavailable'})
  })
  it('retains both completed routes when the tariff lookup reaches its deadline',async()=>{
    const timer = new AbortController()
    vi.spyOn(AbortSignal,'timeout').mockImplementation(ms=>ms===12000?timer.signal:new AbortController().signal)
    vi.mocked(getCurrentTaxiTariffs).mockImplementation((_city,signal)=>new Promise((_resolve,reject)=>{
      signal!.addEventListener('abort',()=>reject(new Error('timeout')),{once:true})
    }))
    let readRoad:()=>void
    const received = new Promise<void>(resolve=>{readRoad=resolve})
    vi.stubGlobal('fetch',async (url:string)=>{
      if(url==='/api/transit')return Response.json({routes:[{duration:'1200s',legs:[{steps:[{travelMode:'TRANSIT',transitDetails:{}}]}]}]})
      return {ok:true,json:async()=>{readRoad();timer.signal.throwIfAborted();return {routes:[{distance:10000,duration:800}]}}}
    })
    const stay=hotel('Ankara','Ankara')
    const found=loadHotelArrival('ESB',stay.coordinates,'tr',new AbortController().signal,stay)
    await received
    timer.abort()
    expect(await found).toMatchObject({taxi:{distanceKm:10},transit:{duration:'1200s'}})
  })
})
