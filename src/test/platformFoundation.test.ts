import {readFile,readdir} from 'node:fs/promises'
import {pathToFileURL} from 'node:url'
import {expect,it} from 'vitest'
import {cityTransportCopy} from '../lib/cityTransportCopy'
it('provides the five original city transport descriptions in every supported language',()=>{
 for(const copy of Object.values(cityTransportCopy))for(const lang of ['tr','en','de','fr','ar','ru','zh'])expect(copy[lang]?.length).toBeGreaterThan(20)
})
it.skipIf(!process.env.PGLITE_MODULE)('foundation migration enforces publication, ownership and sponsorship visibility in isolated PostgreSQL',async()=>{
 const {PGlite}=await import(/* @vite-ignore */ pathToFileURL(process.env.PGLITE_MODULE!).href)
 const db=new PGlite()
 try{
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
  create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create table storage.buckets(id text primary key,name text,public boolean);
  create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);`)
  for(const file of (await readdir('supabase/migrations')).filter(f=>/^000[1-4]_/.test(f)).sort())await db.exec((await readFile('supabase/migrations/'+file,'utf8')).replace('create extension if not exists pgcrypto;',''))
  await db.exec(`grant usage on schema public,auth to anon,authenticated; grant select on all tables in schema public to anon,authenticated; grant insert,update on public.bookings to authenticated; grant usage on sequence public.booking_reference_seq to authenticated;`)
  await db.exec(await readFile('supabase/migrations/0005_platform_foundation.sql','utf8'))
  const admin='00000000-0000-0000-0000-000000000001',one='00000000-0000-0000-0000-000000000002',two='00000000-0000-0000-0000-000000000003'
  await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values('${admin}','admin@example.test','{}'),('${one}','one@example.test','{}'),('${two}','two@example.test','{}');update profiles set role='admin' where id='${admin}';`)
  const business=(await db.query(`insert into restaurants(name,status,active,public_slug) values('Isolated test','PUBLISHED',true,'legacy-route') returning id`)).rows[0].id
  await db.exec(`insert into sponsored_placements(business_kind,business_id,context,starts_at,ends_at,active) values('restaurants','${business}','city',now()-interval '1 day',now()+interval '1 day',true);set role anon;`)
  expect((await db.query('select slug from published_editorial_businesses')).rows).toEqual([{slug:'legacy-route'}])
  expect((await db.query('select * from sponsored_placements')).rows).toHaveLength(1)
  await expect(db.exec(`insert into business_events(business_key,event_type,context) values('x','detail_open','detail')`)).rejects.toThrow()
  await db.exec(`reset role;update restaurants set status='DRAFT' where id='${business}';set role anon;`)
  expect((await db.query('select * from published_editorial_businesses')).rows).toHaveLength(0)
  expect((await db.query('select * from sponsored_placements')).rows).toHaveLength(0)
  await db.exec(`reset role;update restaurants set status='ARCHIVED' where id='${business}';set role anon;`)
  expect((await db.query('select * from published_editorial_businesses')).rows).toHaveLength(0)
  await db.exec(`reset role;update restaurants set status='PUBLISHED',name='Updated test' where id='${business}';set role anon;`)
  expect((await db.query('select name,slug from published_editorial_businesses')).rows).toEqual([{name:'Updated test',slug:'legacy-route'}])
  await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${one}',false);`)
  await db.exec(`insert into bookings(user_id,listing_type,listing_name,guest_name,guest_email,visit_date,guest_count,visit_time,guest_phone) values('${one}','restaurant','Test','One','one@example.test','2030-01-01',2,'19:00','+900000000000');`)
  expect((await db.query('select status from bookings')).rows).toEqual([{status:'PENDING'}])
  await expect(db.exec(`insert into bookings(user_id,listing_type,listing_name,guest_name,guest_email,visit_date,guest_count,contact_stage) values('${one}','restaurant','Test','One','one@example.test','2030-01-01',2,'CONTACTED')`)).rejects.toThrow()
  await db.exec(`select set_config('request.jwt.claim.sub','${two}',false)`)
  expect((await db.query('select * from bookings')).rows).toHaveLength(0)
  expect((await db.query(`update bookings set status='CONFIRMED' returning id`)).rows).toHaveLength(0)
  await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false);update bookings set contact_stage='CONTACTED',status='CONFIRMED';select set_config('request.jwt.claim.sub','${one}',false);`)
  expect((await db.query('select status,contact_stage from bookings')).rows).toEqual([{status:'CONFIRMED',contact_stage:'CONTACTED'}])
  expect((await db.query('select * from business_metrics')).rows).toHaveLength(0)
  await db.exec(`reset role;insert into business_events(business_key,event_type,context) values('restaurants/${business}','detail_open','detail');set role authenticated;`)
  expect((await db.query('select * from business_metrics')).rows).toHaveLength(0)
  await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false)`)
  expect((await db.query('select event_type,total from business_metrics')).rows).toEqual([{event_type:'detail_open',total:1}])
  await db.exec('reset role')
  await expect(db.exec(`update restaurants set public_slug='new-route' where id='${business}'`)).rejects.toThrow()
 }finally{await db.close()}
},60000)
