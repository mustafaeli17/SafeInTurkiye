-- PREPARED ONLY. Explicit approval required before remote execution.
-- Canonical table remains bookings; historical authenticated requests are retained.
-- Activation checklist (not executed by this file):
-- 1. Approve and apply to an isolated Preview DB, validate RLS + historical schema.
-- 2. Configure server-only Supabase service key, Resend verified sender + API key.
-- 3. Configure authenticated GET /api/reservation-notifications every 10 minutes
--    via Vercel Cron (Authorization: Bearer CRON_SECRET). No cron is enabled here.
-- 4. Verify a real owner email, then enable both restaurant-request feature flags.
-- 5. Update active privacy/contact wording and agree retention before public intake.
-- Failed jobs stop after 10 attempts; operator investigation is required then.
begin;
alter table public.bookings alter column user_id drop not null;
alter table public.bookings add column if not exists visit_time time;
alter table public.bookings add column if not exists guest_phone text;
alter table public.bookings add column if not exists request_id uuid;
alter table public.bookings add column if not exists receipt_hash text;
create unique index if not exists bookings_request_id_unique on public.bookings(request_id) where request_id is not null;
alter table public.bookings add constraint bookings_guest_receipt_required check(user_id is not null or (request_id is not null and receipt_hash ~ '^[a-f0-9]{64}$'));

create table public.reservation_intake_limits(client_hash text primary key,window_start timestamptz not null,total integer not null);
alter table public.reservation_intake_limits enable row level security;
create table public.reservation_notifications(
 id uuid primary key default gen_random_uuid(),booking_id uuid not null unique references public.bookings(id) on delete cascade,
 state text not null default 'PENDING' check(state in ('PENDING','PROCESSING','SENT','FAILED')),
 attempts integer not null default 0, available_at timestamptz not null default now(),lease_id uuid,
 sent_at timestamptz,created_at timestamptz not null default now()
);
alter table public.reservation_notifications enable row level security;
create policy "Staff read reservation notification health" on public.reservation_notifications for select to authenticated using(public.is_staff());
grant select on public.reservation_notifications to authenticated;
grant all on public.reservation_notifications,public.reservation_intake_limits to service_role;
grant select,insert,update on public.bookings to service_role;

create function public.queue_restaurant_notification() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.listing_type='restaurant' then insert into reservation_notifications(booking_id) values(new.id) on conflict(booking_id) do nothing; end if;
 return new;
end $$;
create trigger bookings_queue_notification after insert on public.bookings for each row execute function public.queue_restaurant_notification();

create function public.submit_restaurant_request(p_request_id uuid,p_receipt_hash text,p_client_hash text,p_listing text,p_name text,p_email text,p_phone text,p_date date,p_time time,p_guests integer,p_notes text)
returns table(id uuid,reference_code text,status public.booking_status) language plpgsql security definer set search_path=public as $$
declare existing public.bookings%rowtype; quota public.reservation_intake_limits%rowtype;
begin
 if p_receipt_hash !~ '^[a-f0-9]{64}$' or p_client_hash !~ '^[a-f0-9]{64}$' or p_request_id is null or
 length(btrim(p_listing)) not between 1 and 200 or length(btrim(p_name)) not between 1 and 100 or
 length(p_email) not between 3 and 254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or
 p_phone !~ '^[+0-9 ()-]{5,40}$' or p_guests not between 1 and 20 or p_time is null or
 (p_date+p_time) at time zone 'Europe/Istanbul'<now() or p_date>(now() at time zone 'Europe/Istanbul')::date+365 or
 length(coalesce(p_notes,''))>4000 then raise exception 'INVALID_REQUEST'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into existing from public.bookings b where b.request_id=p_request_id;
 if found then
  if existing.receipt_hash is distinct from p_receipt_hash then raise exception 'INVALID_REQUEST'; end if;
  return query select existing.id,existing.reference_code,existing.status;return;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_client_hash,1));
 delete from reservation_intake_limits where window_start<now()-interval '1 day';
 select * into quota from reservation_intake_limits where client_hash=p_client_hash;
 if found and quota.window_start>now()-interval '1 hour' and quota.total>=5 then raise exception 'RATE_LIMIT'; end if;
 insert into reservation_intake_limits values(p_client_hash,now(),1) on conflict(client_hash) do update set
 total=case when reservation_intake_limits.window_start>now()-interval '1 hour' then reservation_intake_limits.total+1 else 1 end,
 window_start=case when reservation_intake_limits.window_start>now()-interval '1 hour' then reservation_intake_limits.window_start else now() end;
 return query insert into public.bookings(user_id,listing_type,listing_name,guest_name,guest_email,guest_phone,visit_date,visit_time,guest_count,notes,request_id,receipt_hash)
 values(null,'restaurant',btrim(p_listing),btrim(p_name),lower(btrim(p_email)),p_phone,p_date,p_time,p_guests,p_notes,p_request_id,p_receipt_hash)
 returning bookings.id,bookings.reference_code,bookings.status;
end $$;
revoke all on function public.submit_restaurant_request(uuid,text,text,text,text,text,text,date,time,integer,text) from public,anon,authenticated;
grant execute on function public.submit_restaurant_request(uuid,text,text,text,text,text,text,date,time,integer,text) to service_role;

create function public.claim_restaurant_notifications(p_booking_id uuid default null) returns table(id uuid,booking_id uuid,lease_id uuid,reference_code text,listing_name text)
language sql security definer set search_path=public as $$
 with jobs as (select n.id from reservation_notifications n where
  (n.state in ('PENDING','FAILED') or (n.state='PROCESSING' and n.available_at<now())) and n.available_at<=now() and n.attempts<10 and (p_booking_id is null or n.booking_id=p_booking_id)
  order by n.created_at for update skip locked limit 3),
 claimed as(update reservation_notifications n set state='PROCESSING',attempts=n.attempts+1,lease_id=gen_random_uuid(),available_at=now()+interval '10 minutes'
 from jobs j where n.id=j.id returning n.id,n.booking_id,n.lease_id)
 select c.id,c.booking_id,c.lease_id,b.reference_code,b.listing_name from claimed c join bookings b on b.id=c.booking_id;
$$;
revoke all on function public.claim_restaurant_notifications(uuid) from public,anon,authenticated;
grant execute on function public.claim_restaurant_notifications(uuid) to service_role;
revoke all on public.reservation_intake_limits from public,anon,authenticated;
revoke all on public.reservation_notifications from public,anon;
commit;
