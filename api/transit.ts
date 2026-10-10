import {createHash,randomBytes} from 'node:crypto'
type Request={method?:string;body?:any;headers:Record<string,string|string[]|undefined>}
type Response={status:(code:number)=>Response;json:(body:unknown)=>void;setHeader:(name:string,value:string)=>void}
const limits=new Map<string,{count:number;until:number}>(),salt=randomBytes(16).toString('hex')
export const transitFields='routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.startLocation,routes.legs.endLocation,routes.legs.steps.travelMode,routes.legs.steps.staticDuration,routes.legs.steps.distanceMeters,routes.legs.steps.polyline.encodedPolyline,routes.legs.steps.navigationInstruction.instructions,routes.legs.steps.transitDetails,routes.travelAdvisory.transitFare'
export function transitWaypoint(value:unknown){
 if(typeof value==='string'&&value.trim().length>=3&&value.length<=250)return {address:value.trim()}
 if(value&&typeof value==='object'&&'lat' in value&&'lng' in value&&typeof value.lat==='number'&&typeof value.lng==='number'&&Number.isFinite(value.lat)&&Number.isFinite(value.lng)&&Math.abs(value.lat)<=90&&Math.abs(value.lng)<=180)return {location:{latLng:{latitude:value.lat,longitude:value.lng}}}
 return null
}
export default async function handler(req:Request,res:Response){
 res.setHeader('Cache-Control','private, no-store')
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'})
 const key=process.env.GOOGLE_TRANSIT_API_KEY
 if(!key)return res.status(503).json({error:'NOT_CONFIGURED'})
 const origin=String(req.headers.origin??'')
 const allowed=[process.env.VERCEL_URL,process.env.VERCEL_BRANCH_URL].filter(Boolean).map(host=>'https://'+host)
 allowed.push(...(process.env.TRANSIT_ALLOWED_ORIGINS??'').split(',').filter(Boolean))
 if(!allowed.includes(origin))return res.status(403).json({error:'NOT_ALLOWED'})
 let input:any
 try{input=typeof req.body==='string'?JSON.parse(req.body):req.body;if(JSON.stringify(input).length>1500)throw Error()}catch{return res.status(400).json({error:'INVALID_INPUT'})}
 const from=transitWaypoint(input?.origin),to=transitWaypoint(input?.destination)
 const preference=input?.preference??'RECOMMENDED',language=input?.language??'en'
 if(!from||!to||!['RECOMMENDED','LESS_WALKING','FEWER_TRANSFERS'].includes(preference)||!['en','tr','de','fr','ar','ru','zh','es'].includes(language))return res.status(400).json({error:'INVALID_INPUT'})
 const now=Date.now(),time=input.departure?Date.parse(input.departure):now
 if(!Number.isFinite(time)||time<now-60000||time>now+7*86400000)return res.status(400).json({error:'INVALID_DEPARTURE'})
 for(const [id,row]of limits)if(row.until<=now)limits.delete(id)
 const id=createHash('sha256').update(salt+String(req.headers['x-forwarded-for']??'unknown').split(',')[0]).digest('hex'),row=limits.get(id)
 if((row&&row.count>=8)||limits.size>=2000){res.setHeader('Retry-After','60');return res.status(429).json({error:'BUSY'})}
 limits.set(id,{count:(row?.count??0)+1,until:row?.until??now+60000})
 try{
  const upstream=await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{method:'POST',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':transitFields},body:JSON.stringify({origin:from,destination:to,travelMode:'TRANSIT',departureTime:new Date(time).toISOString(),computeAlternativeRoutes:true,...(preference==='RECOMMENDED'?{}:{transitPreferences:{routingPreference:preference}}),languageCode:language==='zh'?'zh-CN':language,regionCode:'TR',units:'METRIC'})})
  if(!upstream.ok)return res.status(upstream.status===429?429:upstream.status===400?400:502).json({error:upstream.status===429?'BUSY':upstream.status===400?'INVALID_INPUT':'UNAVAILABLE'})
  const data=await upstream.json()
  if(!data||typeof data!=='object'||(data.routes!==undefined&&!Array.isArray(data.routes)))return res.status(502).json({error:'UNAVAILABLE'})
  return res.status(200).json({routes:data.routes??[],source:'Google Maps',retrievedAt:new Date().toISOString()})
 }catch(error){return res.status(502).json({error:error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)?'TIMEOUT':'UNAVAILABLE'})}
}
