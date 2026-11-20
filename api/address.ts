import {createRequestBudget} from '../src/server/requestBudget.js'
import {taxiCityFromAddress} from '../src/lib/taxiCity.js'
type Request={method?:string;body?:unknown;headers:Record<string,string|string[]|undefined>}
type Response={status:(code:number)=>Response;setHeader:(name:string,value:string)=>void;json:(body:unknown)=>void}
const consume=createRequestBudget(40)
const languages=['en','tr','de','fr','es','ar','ru','zh']
export default async function handler(req:Request,res:Response){
 res.setHeader('Cache-Control','private, no-store')
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'})
 const allowed=['https://safeinturkiye.com','https://www.safeinturkiye.com',...[process.env.VERCEL_URL,process.env.VERCEL_BRANCH_URL].filter(Boolean).map(host=>'https://'+host)]
 if(!allowed.includes(String(req.headers.origin??'')))return res.status(403).json({error:'NOT_ALLOWED'})
 let input:any
 try{input=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!input||JSON.stringify(input).length>1500)throw Error()}catch{return res.status(400).json({error:'INVALID_INPUT'})}
 const {action,query,placeId,language,sessionToken}=input
 if(!languages.includes(language)||typeof sessionToken!=='string'||!/^[a-zA-Z0-9_-]{16,36}$/.test(sessionToken)||!['suggest','resolve'].includes(action))return res.status(400).json({error:'INVALID_INPUT'})
 if(action==='suggest'&&(typeof query!=='string'||query.trim().length<3||query.length>250||Array.from(query).some(char=>char.charCodeAt(0)<32)))return res.status(400).json({error:'INVALID_INPUT'})
 if(action==='resolve'&&(typeof placeId!=='string'||!/^[a-zA-Z0-9_-]{1,255}$/.test(placeId)))return res.status(400).json({error:'INVALID_INPUT'})
 const key=process.env.GOOGLE_PLACES_API_KEY
 if(!key)return res.status(503).json({error:'NOT_CONFIGURED'})
 const retry=consume(req.headers);if(retry){res.setHeader('Retry-After',String(retry));return res.status(429).json({error:'BUSY'})}
 const languageCode=language==='zh'?'zh-CN':language
 try{
  // The traveller sees the suggestion in their chosen language. Resolve administrative
  // names in Turkish so the taximeter jurisdiction is stable across all eight locales.
  const detailParams=new URLSearchParams({sessionToken,languageCode:'tr',regionCode:'TR'})
  const upstream=await fetch(action==='suggest'?'https://places.googleapis.com/v1/places:autocomplete':`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?${detailParams}`,{
   method:action==='suggest'?'POST':'GET',signal:AbortSignal.timeout(8000),
   headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':action==='suggest'?'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text':'id,location,formattedAddress,addressComponents,attributions'},
   ...(action==='suggest'?{body:JSON.stringify({input:query.trim(),includedRegionCodes:['tr'],languageCode,regionCode:'TR',sessionToken})}:{})
  })
  if(!upstream.ok)return res.status(upstream.status===429?429:502).json({error:upstream.status===429?'BUSY':'UNAVAILABLE'})
  const data=await upstream.json()
  if(!data||typeof data!=='object')throw Error('response')
  if(action==='suggest'){
   if(data.suggestions!==undefined&&!Array.isArray(data.suggestions))throw Error('response')
   const suggestions=(data.suggestions??[]).flatMap((s:any)=>{const p=s?.placePrediction;return typeof p?.placeId==='string'&&typeof p?.text?.text==='string'?[{placeId:p.placeId,label:p.text.text}]:[]}).slice(0,5)
   return res.status(200).json({suggestions,provider:'Google Maps'})
  }
  const lat=data.location?.latitude,lng=data.location?.longitude
  const components=Array.isArray(data.addressComponents)?data.addressComponents:[]
  const country=components.find((c:any)=>c.types?.includes('country'))?.shortText
  const province=components.find((c:any)=>c.types?.includes('administrative_area_level_1'))?.longText
  const district=components.find((c:any)=>c.types?.includes('administrative_area_level_2'))?.longText
  if(country!=='TR'||data.id!==placeId||typeof lat!=='number'||typeof lng!=='number'||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)throw Error('response')
  const attributions=(Array.isArray(data.attributions)?data.attributions:[]).flatMap((a:any)=>typeof a.provider==='string'?[{provider:a.provider,...(typeof a.providerUri==='string'&&a.providerUri.startsWith('https://')?{uri:a.providerUri}:{})}]:[])
  return res.status(200).json({place:{lat,lng,city:taxiCityFromAddress(country,province),...(typeof district==='string' && district ? {district} : {}),mapQuery:`place_id:${data.id}`,provider:'google',attributions}})
 }catch(error){return res.status(502).json({error:error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)?'TIMEOUT':'UNAVAILABLE'})}
}
