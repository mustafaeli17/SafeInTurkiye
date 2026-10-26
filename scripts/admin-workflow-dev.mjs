// Explicit local QA only: in-memory PostgreSQL, test mail transport, no real keys.
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {PGlite} from '@electric-sql/pglite';
import {createServer} from 'vite';
if(process.env.VERCEL)throw Error('Local QA only');
const qaPort=Number(process.env.QA_PORT??5205);if(!Number.isInteger(qaPort)||qaPort<5200||qaPort>5299)throw Error('QA port');
Object.assign(process.env,{SUPABASE_URL:'https://isolated-admin.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'LOCAL_TEST_ONLY',RESERVATIONS_ENABLED:'true',RESEND_API_KEY:'LOCAL_TEST_ONLY',RESERVATION_EMAIL_FROM:'qa@example.test',RESERVATION_ALLOWED_ORIGINS:'http://127.0.0.1:5205'});
process.env.RESERVATION_ALLOWED_ORIGINS=`http://127.0.0.1:${qaPort}`;
process.env.GOOGLE_PLACES_API_KEY='LOCAL_TEST_ONLY';
const db=new PGlite();let emails=0;
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table storage.buckets(id text primary key,name text,public boolean);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);`);
for(const file of (await readdir('supabase/migrations')).filter(f=>/^000[1-4]_/.test(f)).sort())await db.exec((await readFile('supabase/migrations/'+file,'utf8')).replace('create extension if not exists pgcrypto;',''));
await db.exec(await readFile('supabase/migrations/0006_restaurant_request_workflow.sql','utf8'));
await db.exec(await readFile('supabase/migrations/0007_editorial_discovery_fields.sql','utf8'));
await db.exec(await readFile('supabase/migrations/0008_reservation_retention.sql','utf8'));
await db.exec(await readFile('supabase/migrations/0009_reservation_operations.sql','utf8'));
const admin='00000000-0000-0000-0000-000000000001';
await db.exec('grant select on public.profiles to service_role;');
await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values('${admin}','admin@example.test','{}');update profiles set role='admin' where id='${admin}';grant usage on schema public,auth to authenticated,service_role;grant select,insert,update on all tables in schema public to authenticated;insert into cities(name,slug,status) values('TEST ONLY İstanbul','test-istanbul','PUBLISHED');insert into hotels(name,description,status) values('TEST ONLY Draft','Local QA','DRAFT');`);
const columns=value=>{if(!/^(\*|[a-z_,]+)$/.test(value))throw Error('QA fields');return value;};
const tables=new Set(['hotels','restaurants','activities','museums','attractions','exchange_offices','cities','profiles','bookings','reservation_notifications','reservation_status_audit']);
async function tableQuery(tx,input){
 if(!tables.has(input.table))throw Error('QA table');const args=[],where=[];
 for(const [field,value,operator]of input.filters??[]){columns(field);args.push(value);where.push(`${field}${operator==='not.ilike'?' not ilike ':'='}$${args.length}`);}
 const condition=where.length?' where '+where.join(' and '):'';const joined=input.fields==='*,city:cities(name,slug,active,status)';const fields=columns(joined?'*':input.fields??'*');
 if(input.action==='update'){
  const set=Object.entries(input.payload).map(([field,value])=>{columns(field);args.push(value);return `${field}=$${args.length}`;}).join(',');
  return {data:(await tx.query(`update ${input.table} set ${set}${condition} returning ${fields}`,args)).rows};
 }
 if(input.action==='insert'){
  const entries=Object.entries(input.payload);entries.forEach(([key])=>columns(key));
  return {data:(await tx.query(`insert into ${input.table}(${entries.map(([key])=>key).join(',')}) values(${entries.map(([,value],i)=>{args.push(value);return '$'+(i+1);}).join(',')}) returning ${fields}`,args)).rows};
 }
 const count=(await tx.query(`select count(*)::int total from ${input.table}${condition}`,args)).rows[0].total;
 const orders=(input.sort??[]).map(([field,options])=>columns(field)+(options?.ascending===false?' desc':' asc')).join(',');
 const data=input.options?.head?[]:(await tx.query(`select ${fields} from ${input.table}${condition}${orders?' order by '+orders:''} limit ${Math.min(input.take??input.limit??50,1000)} offset ${input.offset??0}`,args)).rows;
 if(joined)for(const row of data)row.city=(await tx.query('select name,slug,active,status from cities where id=$1',[row.city_id])).rows[0]??null;
 return {data,count};
}
globalThis.fetch=async(url,options={})=>{
 const target=new URL(url),body=options.body?JSON.parse(options.body):{};
 if(target.hostname==='api.resend.com'){emails++;return Response.json({id:'qa-email-'+emails});}
 if(target.hostname==='places.googleapis.com')return Response.json({id:target.pathname.split('/').at(-1),displayName:{text:'TEST ONLY Restaurant'},formattedAddress:'TEST ONLY İstanbul address',internationalPhoneNumber:'+90 212 123 45 67',websiteUri:'https://example.test/restaurant',googleMapsUri:'https://maps.google.com/?query_place_id=ChIJtest123',addressComponents:[{types:['administrative_area_level_1'],longText:'İstanbul'}]});
 if(target.hostname!=='isolated-admin.supabase.co')throw Error('QA forbids external API calls');
 if(target.pathname==='/auth/v1/user')return Response.json({id:admin});
 try{return Response.json(await db.transaction(async tx=>{
  await tx.exec('set local role service_role;');
  const rpc=target.pathname.split('/rpc/')[1];
  if(rpc){const names=Object.keys(body);return (await tx.query(`select * from public.${columns(rpc)}(${names.map((key,i)=>`${columns(key)}=>$${i+1}`).join(',')})`,Object.values(body))).rows;}
  const table=target.pathname.split('/').at(-1),filters=[...target.searchParams].filter(([k,v])=>v.startsWith('eq.')).map(([k,v])=>[k,v.slice(3)]);
  return (await tableQuery(tx,{table,fields:target.searchParams.get('select')??'*',action:options.method==='PATCH'?'update':'select',payload:body,filters,limit:Number(target.searchParams.get('limit')??50)})).data;
 }));}catch(error){return Response.json({message:error.message},{status:400});}
};
function adapt(res){return {setHeader:(key,value)=>res.setHeader(key,value),status(code){res.statusCode=code;return this;},json(data){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));}};}
const server=await createServer({mode:'qa-admin',define:{'import.meta.env.VITE_RESTAURANT_REQUESTS':'"true"','import.meta.env.VITE_PLATFORM_FOUNDATION':'"false"'},resolve:{alias:[{find:/^\.{1,2}\/lib\/supabase$/,replacement:fileURLToPath(new URL('../src/test/fixtures/adminSupabase.ts',import.meta.url))}]},server:{host:'127.0.0.1',port:qaPort,strictPort:true},plugins:[{name:'local-admin-workflow',configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/qa/responsive'){
  const params=new URL(req.url,'http://localhost').searchParams,width=Number(params.get('width')),target=params.get('target')==='admin'?'admin':'restaurant';
  if(![360,390,768,1366].includes(width)){res.statusCode=400;res.end('Invalid test width');return;}
  res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><p style="font:14px system-ui;margin:8px">TEST ONLY · iframe viewport ${width}px · ${target} · not a physical device</p><iframe title="${width}px ${target}" src="/qa/${target==='admin'?'admin':'restaurant'}" style="width:${width}px;height:1350px;border:0;display:block"></iframe></body></html>`);return;
 }
 if(path==='/qa/admin'||path==='/qa/restaurant'||path==='/qa/discovery'){res.setHeader('Content-Type','text/html');res.end(await vite.transformIndexHtml(req.url,'<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/test/fixtures/AdminWorkflowDemo.tsx"></script></body></html>'));return;}
 if(path==='/api/places'){adapt(res).status(200).json({places:[{id:'test-google-hotel',displayName:{text:'TEST ONLY Google Hotel'},location:{latitude:41.0083,longitude:28.9785},types:['hotel'],primaryType:'hotel',googleMapsUri:'https://maps.google.com/?cid=1',formattedAddress:'TEST ONLY İstanbul',rating:4.2,userRatingCount:10}]});return;}
 if(path==='/qa/stats'){res.setHeader('Content-Type','text/html');res.end('<h1>TEST ONLY — local counters</h1><pre>'+JSON.stringify({emails,bookings:(await db.query('select count(*)::int total from bookings')).rows[0].total})+'</pre>');return;}
 if(path!=='/__qa/query'&&path!=='/api/reservations'&&path!=='/api/admin-business'){next();return;}
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000){res.statusCode=413;res.end();return;}}
 if(path==='/api/reservations'){await handler({method:req.method,headers:req.headers,body:raw?JSON.parse(raw):undefined},adapt(res));return;}
 if(path==='/api/admin-business'){await businessHandler({method:req.method,headers:req.headers,body:raw?JSON.parse(raw):undefined},adapt(res));return;}
 try{const input=JSON.parse(raw);const result=await db.transaction(async tx=>{await tx.exec(`set local role authenticated;select set_config('request.jwt.claim.sub','${admin}',true);`);return tableQuery(tx,input);});if(input.singleRow)result.data=result.data[0]??null;adapt(res).status(200).json({...result,error:null});}catch{adapt(res).status(200).json({data:null,error:{code:'QA_ERROR'}});}
 });}}]});
const {default:handler}=await server.ssrLoadModule('/api/reservations.ts');
const {default:businessHandler}=await server.ssrLoadModule('/api/admin-business.ts');
await server.listen();console.log(`LOCAL TEST ONLY: http://127.0.0.1:${qaPort}/qa/admin and /qa/restaurant`);
