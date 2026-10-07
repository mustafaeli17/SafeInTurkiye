-- PREPARED ONLY. Requires explicit approval before remote execution.
begin;
-- Keep existing editorial tables, IDs and historical routes. A collision aborts
-- the transaction instead of silently renaming an indexed URL.
alter table public.hotels add column if not exists public_slug text;
alter table public.restaurants add column if not exists public_slug text;
alter table public.activities add column if not exists public_slug text;
update public.hotels set public_slug=coalesce(nullif(editorial_metadata->>'slug',''),'place--'||id::text) where public_slug is null;
update public.restaurants set public_slug=coalesce(nullif(editorial_metadata->>'slug',''),'place--'||id::text) where public_slug is null;
update public.activities set public_slug=coalesce(nullif(editorial_metadata->>'slug',''),'place--'||id::text) where public_slug is null;
create unique index if not exists hotels_public_slug_unique on public.hotels(public_slug);
create unique index if not exists restaurants_public_slug_unique on public.restaurants(public_slug);
create unique index if not exists activities_public_slug_unique on public.activities(public_slug);
create or replace function public.keep_editorial_slug() returns trigger language plpgsql set search_path=public as $$
begin
 if tg_op='UPDATE' and old.public_slug is not null and new.public_slug is distinct from old.public_slug then
  raise exception 'Published route identity is immutable; use an explicit redirect migration';
 end if;
 new.public_slug:=coalesce(new.public_slug,nullif(new.editorial_metadata->>'slug',''),'place--'||new.id::text);
 if new.public_slug !~ '^[a-z0-9]+(-[a-z0-9]+|--[a-z0-9]+)*$' then raise exception 'Invalid editorial slug'; end if;
 return new;
end $$;
create trigger hotels_keep_slug before insert or update on public.hotels for each row execute function public.keep_editorial_slug();
create trigger restaurants_keep_slug before insert or update on public.restaurants for each row execute function public.keep_editorial_slug();
create trigger activities_keep_slug before insert or update on public.activities for each row execute function public.keep_editorial_slug();

create or replace view public.published_editorial_businesses with (security_invoker=true) as
select 'hotels'::text kind,id,public_slug slug,name,description,address,website,image_url,editorial_metadata,city_id from public.hotels where active and status='PUBLISHED'
union all select 'restaurants',id,public_slug,name,description,address,website,image_url,editorial_metadata,city_id from public.restaurants where active and status='PUBLISHED'
union all select 'activities',id,public_slug,name,description,address,website,image_url,editorial_metadata,city_id from public.activities where active and status='PUBLISHED';
grant select on public.published_editorial_businesses to anon, authenticated;

alter table public.bookings add column if not exists visit_time time;
alter table public.bookings add column if not exists guest_phone text;
alter table public.bookings add column if not exists contact_stage text not null default 'NOT_CONTACTED' check (contact_stage in ('NOT_CONTACTED','CONTACTED'));
-- Replace, don't add alongside the old permissive insert policy.
drop policy if exists "Users create pending bookings" on public.bookings;
create policy "Users create pending bookings" on public.bookings for insert to authenticated
with check (user_id=auth.uid() and status='PENDING' and contact_stage='NOT_CONTACTED');

create table if not exists public.sponsored_placements (
 id uuid primary key default gen_random_uuid(),
 business_kind text not null check (business_kind in ('hotels','restaurants','activities')),
 business_id uuid not null,
 context text not null check (context in ('city','hotels','restaurants','activities')),
 starts_at timestamptz not null, ends_at timestamptz not null,
 priority integer not null default 0 check(priority between 0 and 1000),
 active boolean not null default false,
 created_at timestamptz not null default now(),
 check(ends_at>starts_at)
);
alter table public.sponsored_placements enable row level security;
create policy "Staff manage sponsorships" on public.sponsored_placements for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "Public reads eligible sponsorships" on public.sponsored_placements for select to anon,authenticated using (
 active and starts_at<=now() and ends_at>now() and exists(select 1 from public.published_editorial_businesses b where b.id=business_id and b.kind=business_kind)
);
grant select on public.sponsored_placements to anon;
grant select,insert,update,delete on public.sponsored_placements to authenticated;

-- Intentionally no public INSERT: a trusted, rate-limited server intake must
-- be configured before anonymous analytics are enabled. No IP/email/location.
create table if not exists public.business_events (
 id bigint generated always as identity primary key,
 business_key text not null check(length(business_key) between 1 and 180),
 event_type text not null check(event_type in ('impression','detail_open','phone_click','website_click','directions_click','reservation_started','reservation_submitted')),
 context text not null check(context in ('city','hotels','restaurants','activities','nearby','exchange','detail')),
 created_at timestamptz not null default now()
);
create index if not exists business_events_reporting on public.business_events(business_key,created_at,event_type);
alter table public.business_events enable row level security;
create policy "Staff read business metrics" on public.business_events for select to authenticated using(public.is_staff());
grant select on public.business_events to authenticated;
revoke insert,update,delete on public.business_events from anon,authenticated;
create or replace view public.business_metrics with (security_invoker=true) as
select business_key,date_trunc('month',created_at) as month_start,event_type,count(*)::bigint total
from public.business_events group by business_key,date_trunc('month',created_at),event_type;
grant select on public.business_metrics to authenticated;
commit;
