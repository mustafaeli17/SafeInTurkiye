export type TransitStep = { travelMode?: string; staticDuration?: string; distanceMeters?: number; navigationInstruction?: { instructions?: string }; transitDetails?: { headsign?: string; stopCount?: number; transitLine?: { name?: string; nameShort?: string; vehicle?: { type?: string } }; stopDetails?: { departureStop?: { name?: string }; arrivalStop?: { name?: string }; departureTime?: string; arrivalTime?: string } } }
export type TransitRoute = { duration: string; distanceMeters?: number; polyline?: { encodedPolyline?: string }; legs: { steps: TransitStep[] }[]; travelAdvisory?: { transitFare?: { currencyCode?: string; units?: string | number; nanos?: number } } }
export type WalkingStage=TransitStep&{instructions?:string[]}
export function transitStages(route:TransitRoute):WalkingStage[]{
 const stages:WalkingStage[]=[]
 for(const leg of route.legs){
  let walking:WalkingStage|undefined
  for(const step of leg.steps){
   if(step.travelMode!=='WALK'||step.transitDetails){walking=undefined;stages.push({...step});continue}
   const instruction=step.navigationInstruction?.instructions
   if(!walking){walking={...step,instructions:instruction?[instruction]:[]};stages.push(walking);continue}
   if(instruction)walking.instructions!.push(instruction)
   const seconds=(value?:string)=>value&&/^\d+(\.\d+)?s$/.test(value)?parseFloat(value):undefined
   const a=seconds(walking.staticDuration),b=seconds(step.staticDuration)
   walking.staticDuration=a!==undefined&&b!==undefined?`${a+b}s`:undefined
   walking.distanceMeters=Number.isFinite(walking.distanceMeters)&&Number.isFinite(step.distanceMeters)?walking.distanceMeters!+step.distanceMeters!:undefined
  }
 }
 return stages
}
export function transitTime(value:string|undefined,locale:string){
 return value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString(locale,{timeZone:'Europe/Istanbul',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}):''
}
export function transferCount(count:number,locale:string){
 const forms:Record<string,[string,string]>={en:['transfer','transfers'],tr:['aktarma','aktarma'],de:['Umstieg','Umstiege'],fr:['correspondance','correspondances'],es:['transbordo','transbordos'],ru:['пересадка','пересадки'],ar:['تبديل','تبديلات'],zh:['次换乘','次换乘']}
 if(locale==='ru')return `${count} ${count===1?'пересадка':count>=2&&count<=4?'пересадки':'пересадок'}`
 const words=forms[locale]??forms.en
 return `${count} ${words[count===1?0:1]}`
}
export const transitDurationCopy:Record<string,[string,string]>={
 en:['Journey duration','Not a countdown from now. Check the dated boarding and alighting times (Türkiye time).'],
 tr:['Yolculuk süresi','Şu andan itibaren kalan süre değildir. Tarihli biniş ve iniş saatlerini kontrol edin (Türkiye saati).'],
 de:['Fahrtdauer','Keine Restzeit ab jetzt. Beachten Sie Datum und Uhrzeit von Einstieg und Ausstieg (Türkei-Zeit).'],
 fr:['Durée du trajet','Ce n’est pas un compte à rebours depuis maintenant. Vérifiez les dates et heures de montée et de descente (heure de Turquie).'],
 es:['Duración del viaje','No es el tiempo restante desde ahora. Consulta las fechas y horas de subida y bajada (hora de Turquía).'],
 ar:['مدة الرحلة','ليست المدة المتبقية من الآن. راجع تاريخ ووقت الصعود والنزول بتوقيت تركيا.'],
 ru:['Длительность поездки','Не время до прибытия с текущего момента. Проверьте даты и время посадки и высадки (время Турции).'],
 zh:['行程时长','并非从现在起的倒计时。请查看上车和下车的日期与时间（土耳其时间）。'],
}
export function transitDeparture(value: string, now = Date.now()): string | null {
  const time = value ? Date.parse(`${value}:00+03:00`) : now
  return Number.isFinite(time) && time >= now - 60000 && time <= now + 7 * 86400000 ? new Date(time).toISOString() : null
}
export function transitRequestTime() { return Date.now() }
export function transitSummary(route:TransitRoute){
 const steps=route.legs.flatMap(leg=>leg.steps),rides=steps.filter(step=>step.transitDetails);
 const validTime=(value?:string)=>value&&Number.isFinite(Date.parse(value))?value:undefined;
 const walks=steps.filter(step=>step.travelMode==='WALK');
 const walkingMinutes=walks.every(step=>/^\d+(\.\d+)?s$/.test(step.staticDuration??''))?Math.ceil(walks.reduce((n,s)=>n+parseFloat(s.staticDuration!),0)/60):undefined;
 return {boarding:validTime(rides[0]?.transitDetails?.stopDetails?.departureTime),alighting:validTime(rides.at(-1)?.transitDetails?.stopDetails?.arrivalTime),walkingMinutes,transfers:Math.max(0,rides.length-1),lines:rides.map(s=>s.transitDetails?.transitLine?.nameShort||s.transitDetails?.transitLine?.name).filter(Boolean)};
}
export function requestTransitLocation(location: Pick<Geolocation,'getCurrentPosition'> | undefined): Promise<{lat:number;lng:number}> {
  return new Promise((resolve,reject)=>{
    if(!location){reject(new Error('noLocation'));return}
    location.getCurrentPosition(position=>resolve({lat:position.coords.latitude,lng:position.coords.longitude}),error=>reject(new Error(error.code===1?'denied':'noLocation')),{enableHighAccuracy:false,timeout:12000,maximumAge:60000})
  })
}
export function transitRoutes(value: unknown): TransitRoute[] {
  if (!Array.isArray(value)) return []
  return value.filter(route => route && /^\d+(\.\d+)?s$/.test(route.duration) && Array.isArray(route.legs) && route.legs.every((leg: any) => Array.isArray(leg.steps) && leg.steps.every((step: any) => step && typeof step === 'object'))).slice(0, 4)
}
export function transitFare(route: TransitRoute, locale: string): string | null {
  const fare = route.travelAdvisory?.transitFare
  if (!fare || !/^[A-Z]{3}$/.test(fare.currencyCode ?? '')) return null
  const amount = Number(fare.units ?? 0) + Number(fare.nanos ?? 0) / 1e9
  if (!Number.isFinite(amount) || amount < 0) return null
  return new Intl.NumberFormat(locale, { style: 'currency', currency: fare.currencyCode }).format(amount)
}
export function decodeTransitPolyline(encoded: string): { lat: number; lng: number }[] {
  let index = 0, lat = 0, lng = 0
  const result: { lat: number; lng: number }[] = []
  const read = () => { let value = 0, shift = 0, byte: number; do { if (index >= encoded.length || shift > 30) throw new Error('Invalid polyline'); byte = encoded.charCodeAt(index++) - 63; if (byte < 0 || byte > 63) throw new Error('Invalid polyline'); value |= (byte & 31) << shift; shift += 5 } while (byte >= 32); return value & 1 ? ~(value >> 1) : value >> 1 }
  try { while (index < encoded.length && result.length < 50000) { lat += read(); lng += read(); if (Math.abs(lat / 1e5) > 90 || Math.abs(lng / 1e5) > 180) return []; result.push({ lat: lat / 1e5, lng: lng / 1e5 }) } } catch { return [] }
  return result
}
