import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {expect,it} from 'vitest';
it('guest intake is idempotent, rate-limited and private; notifications commit with booking',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
  create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create table storage.buckets(id text primary key,name text,public boolean);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);`);
  for(const file of (await readdir('supabase/migrations')).filter(f=>/^000[1-4]_/.test(f)).sort())await db.exec((await readFile('supabase/migrations/'+file,'utf8')).replace('create extension if not exists pgcrypto;',''));
  await db.exec(await readFile('supabase/migrations/0006_restaurant_request_workflow.sql','utf8'));
  await db.exec(await readFile('supabase/migrations/0007_editorial_discovery_fields.sql','utf8'));
  await db.exec(await readFile('supabase/migrations/0007_editorial_discovery_fields.sql','utf8'));
  await db.exec('grant usage on schema public,auth to anon,authenticated,service_role;grant select on public.bookings to anon,authenticated;grant insert,update on public.bookings to authenticated;');
  const request='00000000-0000-0000-0000-000000000101',hash='a'.repeat(64),ip='b'.repeat(64);
  const submit=(id=request,client=ip,token=hash)=>db.query(`select * from public.submit_restaurant_request($1,$2,$3,'TEST restaurant','TEST guest','guest@example.test','+90000000000',current_date+1,'19:00',2,'{"notes":"Test only"}')`,[id,token,client]);
  await db.exec('set role service_role;');
  const first=(await submit()).rows[0] as {id:string;status:string;reference_code:string};
  expect(first.status).toBe('PENDING');expect(first.reference_code).toMatch(/^SIT-/);
  expect((await submit()).rows[0]).toEqual(first);
  await expect(submit(request,ip,'c'.repeat(64))).rejects.toThrow('INVALID_REQUEST');
  expect((await db.query('select * from public.reservation_notifications')).rows).toHaveLength(1);
  for(let i=2;i<=5;i++)await submit('00000000-0000-0000-0000-00000000010'+i);
  await expect(submit('00000000-0000-0000-0000-000000000106')).rejects.toThrow('RATE_LIMIT');
  const jobs=(await db.query(`select * from claim_restaurant_notifications($1)`,[first.id])).rows;
  expect(jobs).toHaveLength(1);expect(jobs[0]).not.toHaveProperty('guest_email');
  expect((await db.query(`select * from claim_restaurant_notifications($1)`,[first.id])).rows).toHaveLength(0);
  await db.exec('reset role;set role anon;');
  expect((await db.query('select id from bookings')).rows).toHaveLength(0);
  await expect(submit()).rejects.toThrow();
  await expect(db.query('select * from reservation_notifications')).rejects.toThrow();
  await db.exec("reset role;insert into auth.users(id,email,raw_user_meta_data) values('00000000-0000-0000-0000-000000000001','admin@example.test','{}');update profiles set role='admin' where id='00000000-0000-0000-0000-000000000001';set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);");
  expect((await db.query('select id from bookings')).rows).toHaveLength(5);
  await expect(submit()).rejects.toThrow();
  await db.query("update bookings set status='CONFIRMED' where id=$1",[first.id]);
  expect((await db.query('select status from bookings where id=$1',[first.id])).rows).toEqual([{status:'CONFIRMED'}]);
 }finally{await db.close();}
},20000);
