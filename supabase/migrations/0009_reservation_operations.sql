-- PREPARED ONLY: isolated/local validation first; remote execution needs approval.
begin;
alter table public.reservation_notifications add column if not exists last_attempt_at timestamptz;
alter table public.reservation_notifications add column if not exists last_error_code text;
create table if not exists public.reservation_status_audit(
 id uuid primary key default gen_random_uuid(),booking_id uuid not null references public.bookings(id) on delete cascade,
 old_status public.booking_status not null,new_status public.booking_status not null,
 actor_id uuid,changed_at timestamptz not null default now()
);
alter table public.reservation_status_audit enable row level security;
drop policy if exists "Staff read reservation audit" on public.reservation_status_audit;
create policy "Staff read reservation audit" on public.reservation_status_audit for select to authenticated using(public.is_staff());
revoke all on public.reservation_status_audit from public,anon,authenticated;
grant select on public.reservation_status_audit to authenticated;
grant all on public.reservation_status_audit to service_role;
create or replace function public.guard_reservation_transition() returns trigger language plpgsql as $$
begin
 if old.listing_type='restaurant' and new.status is distinct from old.status and not(
  old.status='PENDING' and new.status in ('CONFIRMED','REJECTED','CANCELLED') or
  old.status='CONFIRMED' and new.status='CANCELLED'
 ) then raise exception 'INVALID_TRANSITION'; end if;
 return new;
end $$;
drop trigger if exists booking_transition_guard on public.bookings;
create trigger booking_transition_guard before update of status on public.bookings for each row execute function public.guard_reservation_transition();
create or replace function public.audit_reservation_transition() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.listing_type='restaurant' and new.status is distinct from old.status then
  insert into reservation_status_audit(booking_id,old_status,new_status,actor_id) values(new.id,old.status,new.status,auth.uid());
 end if;
 return new;
end $$;
drop trigger if exists booking_status_audit on public.bookings;
create trigger booking_status_audit after update of status on public.bookings for each row execute function public.audit_reservation_transition();
create or replace function public.claim_restaurant_notifications(p_booking_id uuid default null)
returns table(id uuid,booking_id uuid,lease_id uuid,reference_code text,listing_name text)
language sql security definer set search_path=public as $$
 with jobs as(select n.id from reservation_notifications n where
  (n.state in ('PENDING','FAILED') or (n.state='PROCESSING' and n.available_at<now()))
  and n.available_at<=now() and n.attempts<10 and (p_booking_id is null or n.booking_id=p_booking_id)
  order by n.created_at for update skip locked limit 3),
 claimed as(update reservation_notifications n set state='PROCESSING',attempts=n.attempts+1,
  lease_id=gen_random_uuid(),available_at=now()+interval '10 minutes',last_attempt_at=now()
  from jobs j where n.id=j.id returning n.id,n.booking_id,n.lease_id)
 select c.id,c.booking_id,c.lease_id,b.reference_code,b.listing_name from claimed c join bookings b on b.id=c.booking_id;
$$;
revoke all on function public.claim_restaurant_notifications(uuid) from public,anon,authenticated;
grant execute on function public.claim_restaurant_notifications(uuid) to service_role;
commit;
