import {distanceInMeters, isValidCenter, type NearbyCenter} from '../services/nearbyPlaces'
import {searchCities, normalizeSearchText} from '../services/searchCities'
import {getCurrentTaxiTariffs} from '../repositories/tariffRepository'
import {searchDestinations} from './searchDestinations'
import {routeFareRange} from './taxiCalculation'
import {taxiBudgetRange, taxiBudgets} from './taxiBudget'
import {transitFareAmount, transitRoutes, transitSummary} from './transit'
import {arrivalAirports, type ArrivalAirport} from './arrivalAirports'
export {arrivalAirports, arrivalAirportSource, type ArrivalAirport} from './arrivalAirports'

type HotelLocation = {category:string;name:string|null;cityName?:string|null;address?:string|null;coordinates?:NearbyCenter|null}
type Gateway = {center:keyof typeof searchDestinations;province:string;airports:ArrivalAirport[]}
// Shared gateways: Aydın provincial assessment and Ahiler Development Agency's Cappadocia guide.
// https://aydin.afad.gov.tr/kurumlar/aydin.afad/E-Kutuphane/Il-Planlari/Aydin-IRAP-2021.pdf
// https://ahika.gov.tr/assets/upload/dosyalar/ahika__nevsehir-kapadokya-turizm-yatirim-olanaklari-raporu.pdf
const gateways:Record<string,Gateway> = {
  istanbul:{center:'İstanbul',province:'İstanbul',airports:['IST','SAW']},
  antalya:{center:'Antalya',province:'Antalya',airports:['AYT','GZP']},
  ankara:{center:'Ankara',province:'Ankara',airports:['ESB']},
  izmir:{center:'İzmir',province:'İzmir',airports:['ADB']},
  mugla:{center:'Muğla',province:'Muğla',airports:['BJV','DLM']},
  aydin:{center:'Aydın',province:'Aydın',airports:['ADB','BJV']},
  cappadocia:{center:'Cappadocia',province:'Nevşehir',airports:['NAV','ASR']},
  denizli:{center:'Denizli',province:'Denizli',airports:['DNZ']},
  trabzon:{center:'Trabzon',province:'Trabzon',airports:['TZX']},
  bursa:{center:'Bursa',province:'Bursa',airports:['YEI']},
  konya:{center:'Konya',province:'Konya',airports:['KYA']},
  gaziantep:{center:'Gaziantep',province:'Gaziantep',airports:['GZT']},
}
const districtAliases:Record<string,string[]> = {
  cappadocia:['Nevşehir','Göreme','Ürgüp','Uçhisar','Avanos','Невшехир','内夫谢希尔','نوشهر'],
  izmir:['Çeşme','Alaçatı'],mugla:['Marmaris','Dalaman','Fethiye','Milas'],
}
const areaNames = new Map(Object.keys(gateways).flatMap(slug=>
  [...searchCities[slug],...(districtAliases[slug] ?? [])].map(name=>[normalizeSearchText(name),slug] as const)
))
function addressArea(value:string) {
  const parts=normalizeSearchText(value).split(/[,/،，]/).map(part=>
    part.replace(/\b\d{5}\b/g,'').trim()
      .replace(/^(?:province (?:de |of )?|provincia de |provinz |محافظة )/u,'')
      .replace(/\s+(?:ili|province|provinz)$/u,'').replace(/省$/u,'')
  )
  const matches=new Set(parts.map(part=>areaNames.get(part)).filter((slug):slug is string=>!!slug))
  return matches.size===1 ? [...matches][0] : undefined
}
function hotelRegion(place:HotelLocation) {
  if (place.category!=='hotel' || !place.name?.trim() || !place.coordinates || !isValidCenter(place.coordinates)) return
  const explicit=place.cityName?.trim() ? addressArea(place.cityName) : undefined
  const address=place.address?.trim() ? addressArea(place.address) : undefined
  if (place.cityName?.trim() && !explicit) return
  if (explicit && address && explicit!==address) return
  const slug=explicit ?? address
  if (!slug) return
  // A provider field or an administrative address component identifies the region.
  // Distance is only a sanity check, never used to infer a province or meter.
  const region=gateways[slug]
  if (distanceInMeters(searchDestinations[region.center],place.coordinates)<(slug==='istanbul'?125000:200000)) return region
}

export function airportOptionsForHotel(place:HotelLocation):ArrivalAirport[] {
  const region=hotelRegion(place)
  if (!region || !place.coordinates) return []
  const point=place.coordinates
  if (region.center==='İstanbul') return [...region.airports]
  return [...region.airports].sort((a,b)=>distanceInMeters(arrivalAirports[a].point,point)-distanceInMeters(arrivalAirports[b].point,point))
}
export function comparableHotel(place:HotelLocation) {
  return airportOptionsForHotel(place).length>0
}

type ArrivalFare = {amount:number;verified:boolean;sources:string[];reviewed:string}
type TaxiArrival = {duration:string;distanceKm:number;fare:ArrivalFare|null}
type TransitArrival = {duration:string;transfers:number;lines:string[];fare:ReturnType<typeof transitFareAmount>}
export type HotelArrivalResult = {taxi:TaxiArrival|null;transit:TransitArrival|null;transitStatus?:'unavailable'}

async function drivingRoute(origin:NearbyCenter,destination:NearbyCenter,signal:AbortSignal) {
  const points = [origin,destination].map(point=>[point.lng,point.lat].join(',')).join(';')
  const url = 'https://router.project-osrm.org/route/v1/driving/'+points+'?overview=false'
  const response=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'})
  if (!response.ok) throw new Error('ROAD_UNAVAILABLE')
  const road = (await response.json()).routes?.[0]
  if (!road || !Number.isFinite(road.distance) || road.distance<=0 || !Number.isFinite(road.duration) || road.duration<=0) {
    throw new Error('ROAD_UNAVAILABLE')
  }
  return {distanceKm:road.distance/1000,duration:String(road.duration)+'s'}
}

// Urban or special airport fares cannot safely be extrapolated from the published city examples.
const unpricedGateways = new Set<ArrivalAirport>(['YEI','DNZ','NAV','GZP'])
async function taxiArrival(code:ArrivalAirport, destination:NearbyCenter, signal:AbortSignal, hotel?:HotelLocation):Promise<TaxiArrival> {
  const {point:origin,tariffCity,district}=arrivalAirports[code]
  const region = hotel && hotelRegion(hotel)
  const sameProvince = region ? region.province===tariffCity && region.airports.includes(code)
    : !hotel && tariffCity==='İstanbul' && distanceInMeters(searchDestinations.İstanbul,destination)<125000
  const priceable = sameProvince && !unpricedGateways.has(code)
  const deadline=AbortSignal.any([signal,AbortSignal.timeout(12000)])
  const [road,tariffs] = await Promise.all([
    drivingRoute(origin,destination,deadline),
    priceable ? getCurrentTaxiTariffs(tariffCity,deadline).catch(()=>[]) : [],
  ])
  const {distanceKm}=road
  const tariff = tariffs.find(item=>item.city===tariffCity && item.vehicleClass==='YELLOW')
  let fare:ArrivalFare|null = null
  if (tariff) {
    const {amount} = routeFareRange([distanceKm],tariff.openingFare,tariff.perKm,tariff.minimumFare)
    fare = {amount,verified:true,sources:[tariff.sourceUrl],reviewed:tariff.lastVerified.slice(0,10)}
  } else if (priceable) {
    const budget = taxiBudgetRange(tariffCity,[distanceKm],'YELLOW',Date.now(),district)
    if (budget && !budget.hasRange) fare = {amount:budget.amount,verified:false,sources:budget.sourceUrls,reviewed:taxiBudgets[tariffCity].reviewedAt}
  }
  return {...road,fare}
}

async function transitArrival(origin:NearbyCenter,destination:NearbyCenter,language:string,signal:AbortSignal):Promise<TransitArrival|null> {
  const response = await fetch('/api/transit',{
    method:'POST',signal:AbortSignal.any([signal,AbortSignal.timeout(18000)]),headers:{'Content-Type':'application/json'},
    body:JSON.stringify({origin,destination,language,preference:'RECOMMENDED'}),
  })
  if (!response.ok) throw new Error('TRANSIT_UNAVAILABLE')
  const payload = await response.json()
  if (!Array.isArray(payload?.routes)) throw new Error('TRANSIT_UNAVAILABLE')
  const routes = transitRoutes(payload.routes)
  if (payload.routes.length && !routes.length) throw new Error('TRANSIT_UNAVAILABLE')
  const route = routes.find(candidate=>candidate.legs.some(leg=>leg.steps.some(step=>step.travelMode==='TRANSIT' && step.transitDetails)))
  if (!route) return null
  const {transfers,lines} = transitSummary(route)
  return {duration:route.duration,transfers,lines:lines.filter((line):line is string=>typeof line==='string'),fare:transitFareAmount(route)}
}

export async function loadHotelArrival(airport:ArrivalAirport,destination:NearbyCenter,language:string,signal:AbortSignal,hotel?:HotelLocation):Promise<HotelArrivalResult> {
  signal.throwIfAborted()
  const origin = arrivalAirports[airport].point
  const [taxi,transit] = await Promise.allSettled([
    taxiArrival(airport,destination,signal,hotel),transitArrival(origin,destination,language,signal),
  ])
  signal.throwIfAborted()
  return {taxi:taxi.status==='fulfilled'?taxi.value:null,transit:transit.status==='fulfilled'?transit.value:null,
    ...(transit.status==='rejected'?{transitStatus:'unavailable' as const}:{})}
}
