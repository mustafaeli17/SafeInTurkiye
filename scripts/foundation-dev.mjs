// Local-only Vite + server event endpoint. Never deploy this launcher.
import {createServer} from 'vite'
import handler from '../api/business-events.ts'
process.loadEnvFile('.env.foundation.local')
if(process.env.SUPABASE_URL!=='https://qctltygvdxpzdaliczig.supabase.co')throw Error('Isolated project required')
const server=await createServer({mode:'foundation',server:{host:'127.0.0.1',port:5193,strictPort:true},plugins:[{name:'isolated-event-intake',configureServer(vite){
vite.middlewares.use('/api/business-events',(req,res)=>{
 let body=''
 req.on('data',chunk=>{body+=chunk;if(body.length>1024)req.destroy()})
 req.on('end',()=>void handler({...req,method:req.method,headers:req.headers,body},{setHeader:(name,value)=>res.setHeader(name,value),status(code){res.statusCode=code;return this},json(value){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))}}))
})
}}]})
await server.listen();server.printUrls()
