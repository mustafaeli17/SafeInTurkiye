// Explicit local-only UI regression harness. Never imported by the app or Vercel.
import {createServer} from 'vite';
let searches=0,expiredPhotos=0;
const server=await createServer({server:{host:'127.0.0.1',port:5202},plugins:[{name:'local-reliability-fixtures',configureServer(vite){
 vite.middlewares.use((req,res,next)=>{
  const url=new URL(req.url??'/','http://127.0.0.1:5202');
  if(url.pathname==='/api/fixture-stats'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({searches,expiredPhotos}));return;}
  if(url.pathname==='/api/place-photo'){
   if(url.searchParams.get('expires')==='1'){expiredPhotos++;res.statusCode=400;res.end();return;}
   res.statusCode=302;res.setHeader('Location','/photos/cities-2026/istanbul-640.webp');res.end();return;
  }
  if(url.pathname!=='/api/places')return next();
  const current=++searches,lat=Number(url.searchParams.get('lat')),lng=Number(url.searchParams.get('lng'));
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify({places:Array.from({length:6},(_,i)=>({id:'Fixture'+i,displayName:{text:'TEST ONLY — expiry recovery '+(i+1)},types:['restaurant'],primaryType:'restaurant',location:{latitude:lat,longitude:lng},googleMapsUri:'https://example.invalid/test-place',photo:{url:`/api/place-photo?name=fixture&expires=${current===1?1:Date.now()+900000}&signature=test`,authors:[]}}))}));
 });
}}]});
await server.listen();console.log('Local fixture browser harness: http://127.0.0.1:5202 (TEST DATA ONLY)');
