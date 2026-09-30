import {readFile, readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {expect, it} from 'vitest';
import {eligibleTariffs, type TaxiTariffRow} from '../repositories/tariffRepository';
import {distanceFare} from '../lib/taxiCalculation';

// Optional isolated PostgreSQL WASM runtime; never connects to Supabase.
// PGLITE_MODULE must point to its dist/index.js. No secrets or network required.
it.skipIf(!process.env.PGLITE_MODULE)('official seed is atomic/idempotent and anon rows feed the real calculator', async () => {
 const {PGlite}=await import(/* @vite-ignore */ pathToFileURL(process.env.PGLITE_MODULE!).href);
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create schema storage;
   create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   create table storage.buckets(id text primary key,name text,public boolean);
   create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);`);
  for(const file of (await readdir('supabase/migrations')).filter(f=>/^000[1-4]_/.test(f)).sort()) {
   await db.exec((await readFile('supabase/migrations/'+file,'utf8')).replace('create extension if not exists pgcrypto;',''));
  }
  const seed=await readFile('supabase/seeds/taxi-istanbul-2026-07-20.sql','utf8');
  await db.exec(seed);
  const before=(await db.query('select * from taxi_tariffs order by id')).rows;
  await db.exec(seed);
  expect((await db.query('select * from taxi_tariffs order by id')).rows).toEqual(before);
  expect(before).toHaveLength(3);
  await db.exec('grant usage on schema public,auth to anon; grant select on all tables in schema public to anon; set role anon;');
  const result=await db.query(`select to_jsonb(t) || jsonb_build_object('cities',jsonb_build_object('name',c.name),
   'data_sources',jsonb_build_object('name',s.name,'url',s.url,'verification_status',s.verification_status)) payload
   from taxi_tariffs t join cities c on c.id=t.city_id join data_sources s on s.id=t.source_id
   where t.active and t.verification_status='VERIFIED' and c.name='İstanbul'
   and t.effective_from<=current_date and (t.effective_to is null or t.effective_to>=current_date)`);
  const rows:TaxiTariffRow[]=result.rows.map((row:{payload:TaxiTariffRow})=>row.payload);
  const eligible=eligibleTariffs(rows,'İstanbul',Date.parse('2026-09-29T12:00:00Z'));
  expect(eligible).toHaveLength(3);
  const expected:Record<string,number>={YELLOW:551.14,TURQUOISE:633.73,BLACK:936.90};
  for(const r of eligible) {
   // Real route API uses metres; App converts to kilometres before this function.
   expect(distanceFare(10000/1000,+r.opening_fare,+r.per_km,+r.minimum_fare)).toBe(expected[r.vehicle_class]);
   expect(distanceFare(0.1,+r.opening_fare,+r.per_km,+r.minimum_fare)).toBe(+r.minimum_fare);
  }
  for(const city of ['Antalya','İzmir','Ankara','Bodrum','Kayseri']) expect(eligibleTariffs(rows,city)).toEqual([]);
  expect(eligibleTariffs(rows,'İstanbul',Date.parse('2026-10-30T00:00:00Z'))).toEqual([]);
  await db.exec('reset role; update taxi_tariffs set per_km=1 where vehicle_class=\'YELLOW\';');
  await expect(db.exec(seed)).rejects.toThrow(/tariff conflict/);
  await db.exec('rollback;');
  expect((await db.query("select per_km from taxi_tariffs where vehicle_class='YELLOW'")).rows[0].per_km).toBe('1.00');
  await db.exec("delete from taxi_tariffs; delete from data_sources; update cities set status='DRAFT';");
  await expect(db.exec(seed)).rejects.toThrow(/publication requires/);
  await db.exec('rollback;');
  expect((await db.query('select count(*)::int n from taxi_tariffs')).rows[0].n).toBe(0);
 } finally { await db.close(); }
},60000);
