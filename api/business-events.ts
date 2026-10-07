import {createHash,randomBytes} from 'node:crypto'
type Request={method?:string;headers:Record<string,string|string[]|undefined>;body?:unknown}
type Response={status:(code:number)=>Response;setHeader:(key:string,value:string)=>void;json:(body:unknown)=>void}
const events=new Set(['impression','detail_open','phone_click','website_click','directions_click','reservation_started','reservation_submitted'])
const contexts=new Set(['city','hotels','restaurants','activities','nearby','exchange','detail'])
const salt=randomBytes(16).toString('hex'),limits=new Map<string,{until:number;count:number}>()
export default async function handler(req:Request,res:Response){
 res.setHeader('Cache-Control','private, no-store')
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'})
 const allowed=(process.env.BUSINESS_EVENT_ORIGINS??'').split(',').map(value=>value.trim()).filter(Boolean)
 const origin=String(req.headers.origin??'')
 if(!allowed.includes(origin))return res.status(403).json({error:'NOT_ALLOWED'})
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)return res.status(503).json({error:'NOT_CONFIGURED'})
 let data:Record<string,unknown>
 try{const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(!raw||raw.length>512)throw Error();data=JSON.parse(raw)}catch{return res.status(400).json({error:'INVALID_INPUT'})}
 if(!data||typeof data!=='object'||typeof data.businessKey!=='string'||!/^(hotels|restaurants|activities|google)\/[a-zA-Z0-9_-]{1,140}$/.test(data.businessKey)||!events.has(String(data.eventType))||!contexts.has(String(data.context)))return res.status(400).json({error:'INVALID_INPUT'})
 // Instance-local abuse guard, NOT a distributed cost guarantee. Only salted,
 // ephemeral identifiers are held in memory; no IP is sent to Supabase.
 const now=Date.now();for(const [id,row]of limits)if(row.until<=now)limits.delete(id)
 const id=createHash('sha256').update(salt+String(req.headers['x-forwarded-for']??'unknown').split(',')[0]).digest('hex')
 const limit=limits.get(id)
 if(limits.size>=2000||(limit&&limit.count>=30))return res.status(429).json({error:'BUSY'})
 limits.set(id,{until:limit?.until??now+60000,count:(limit?.count??0)+1})
 try{
  const response=await fetch(`${url}/rest/v1/business_events`,{method:'POST',signal:AbortSignal.timeout(5000),headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({business_key:data.businessKey,event_type:data.eventType,context:data.context})})
  if(!response.ok)return res.status(503).json({error:'UNAVAILABLE'})
  return res.status(200).json({ok:true})
 }catch{return res.status(503).json({error:'UNAVAILABLE'})}
}
