import {distanceInMeters, isValidCenter, type NearbyCenter, type NearbyPlaceRecord} from '../services/nearbyPlaces'
import {mentionedSearchCity, searchCities, normalizeSearchText} from '../services/searchCities'
import {getCurrentTaxiTariffs} from '../repositories/tariffRepository'
import {searchDestinations} from './searchDestinations'
import {routeFareRange} from './taxiCalculation'
import {taxiBudgetRange, taxiBudgets} from './taxiBudget'
import {transitFareAmount, transitRoutes, transitSummary} from './transit'

// Passenger ground-transport stops published on Havaist's official stop map.
// The embedded map reads https://web.hava.ist/api.php?query=get-from-stations
export const arrivalAirportSource = 'https://www.hava.ist/duraklar.php?lang=en'
export const arrivalAirports = {
  IST:{name:'İstanbul Havalimanı',point:{lat:41.25895,lng:28.7426}},
  SAW:{name:'Sabiha Gökçen',point:{lat:40.908621,lng:29.3146}},
} as const
export type ArrivalAirport = keyof typeof arrivalAirports

export function comparableHotel(place: NearbyPlaceRecord) {
  if (place.category !== 'hotel' || !place.name?.trim() || !place.address?.trim() || !isValidCenter(place.coordinates)) return false
  // Search city is only a bias. Require an Istanbul address component and
  // reject wildly inconsistent coordinates before using these airport routes.
  if (distanceInMeters(searchDestinations.İstanbul,place.coordinates) >= 125000) return false
  if (place.cityName) return mentionedSearchCity(place.cityName)==='istanbul'
  const parts = normalizeSearchText(place.address).split(/[,/،，]/).map(part=>part.replace(/\b\d{5}\b/g,'').trim())
  return parts.some(part=>searchCities.istanbul.some(name=>normalizeSearchText(name)===part))
}

type ArrivalFare = {amount:number;verified:boolean;sources:string[];reviewed:string}
type TaxiArrival = {duration:string;distanceKm:number;fare:ArrivalFare|null}
type TransitArrival = {duration:string;transfers:number;lines:string[];fare:ReturnType<typeof transitFareAmount>}
export type HotelArrivalResult = {taxi:TaxiArrival|null;transit:TransitArrival|null}

async function taxiArrival(origin:NearbyCenter, destination:NearbyCenter, signal:AbortSignal):Promise<TaxiArrival> {
  const points = [origin,destination].map(point=>[point.lng,point.lat].join(',')).join(';')
  const url = 'https://router.project-osrm.org/route/v1/driving/'+points+'?overview=false'
  const [response,tariffs] = await Promise.all([
    fetch(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(12000)]),credentials:'omit',referrerPolicy:'no-referrer'}),
    getCurrentTaxiTariffs('İstanbul',signal).catch(()=>[]),
  ])
  if (!response.ok) throw new Error('ROAD_UNAVAILABLE')
  const road = (await response.json()).routes?.[0]
  if (!road || !Number.isFinite(road.distance) || road.distance<=0 || !Number.isFinite(road.duration) || road.duration<=0) {
    throw new Error('ROAD_UNAVAILABLE')
  }
  const distanceKm = road.distance/1000
  const tariff = tariffs.find(item=>item.city==='İstanbul' && item.vehicleClass==='YELLOW')
  let fare:ArrivalFare|null = null
  if (tariff) {
    const {amount} = routeFareRange([distanceKm],tariff.openingFare,tariff.perKm,tariff.minimumFare)
    fare = {amount,verified:true,sources:[tariff.sourceUrl],reviewed:tariff.lastVerified.slice(0,10)}
  } else {
    const budget = taxiBudgetRange('İstanbul',[distanceKm])
    if (budget) fare = {amount:budget.amount,verified:false,sources:budget.sourceUrls,reviewed:taxiBudgets.İstanbul.reviewedAt}
  }
  return {distanceKm,duration:String(road.duration)+'s',fare}
}

async function transitArrival(origin:NearbyCenter,destination:NearbyCenter,language:string,signal:AbortSignal):Promise<TransitArrival|null> {
  const response = await fetch('/api/transit',{
    method:'POST',signal:AbortSignal.any([signal,AbortSignal.timeout(18000)]),headers:{'Content-Type':'application/json'},
    body:JSON.stringify({origin,destination,language,preference:'RECOMMENDED'}),
  })
  if (!response.ok) throw new Error('TRANSIT_UNAVAILABLE')
  const routes = transitRoutes((await response.json()).routes)
  const route = routes.find(candidate=>candidate.legs.some(leg=>leg.steps.some(step=>step.travelMode==='TRANSIT' && step.transitDetails)))
  if (!route) return null
  const {transfers,lines} = transitSummary(route)
  return {duration:route.duration,transfers,lines:lines.filter((line):line is string=>typeof line==='string'),fare:transitFareAmount(route)}
}

export async function loadHotelArrival(airport:ArrivalAirport,destination:NearbyCenter,language:string,signal:AbortSignal):Promise<HotelArrivalResult> {
  signal.throwIfAborted()
  const origin = arrivalAirports[airport].point
  const [taxi,transit] = await Promise.allSettled([
    taxiArrival(origin,destination,signal),transitArrival(origin,destination,language,signal),
  ])
  signal.throwIfAborted()
  return {taxi:taxi.status==='fulfilled'?taxi.value:null,transit:transit.status==='fulfilled'?transit.value:null}
}
