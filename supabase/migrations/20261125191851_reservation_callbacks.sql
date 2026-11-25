begin;

create table if not exists public.reservation_callbacks (
  id uuid primary key default gen_random_uuid(),
  attempt_no bigint generated always as identity,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  callback_at timestamptz not null,
  actor_id uuid not null,
  recorded_at timestamptz not null default now()
);
create index if not exists reservation_callbacks_latest on public.reservation_callbacks (booking_id, attempt_no desc);
alter table public.reservation_callbacks enable row level security;
drop policy if exists "Staff read restaurant callbacks" on public.reservation_callbacks;
create policy "Staff read restaurant callbacks" on public.reservation_callbacks
  for select to authenticated using ((select public.is_staff()));
revoke all on public.reservation_callbacks from public, anon, authenticated;
grant select on public.reservation_callbacks to authenticated;
revoke all on sequence public.reservation_callbacks_attempt_no_seq from public, anon, authenticated;

-- Only the latest attempt drives the queue. Completed requests retain their private audit trail.
create or replace view public.admin_restaurant_call_queue with (security_invoker = true) as
  select b.id, b.reference_code, b.listing_name, b.guest_name, b.guest_email, b.guest_phone,
    b.visit_date, b.visit_time, b.guest_count, b.notes, b.status, b.created_at, b.updated_at,
    call.id as callback_id, call.callback_at,
    coalesce(call.callback_at > now(), false) as callback_deferred,
    case when call.callback_at > now() then call.callback_at else
      least(call.callback_at, (b.visit_date + coalesce(b.visit_time, time '23:59:59')) at time zone 'Europe/Istanbul')
    end as call_priority_at
  from public.bookings b
  left join lateral (
    select c.id, c.callback_at from public.reservation_callbacks c
    where c.booking_id = b.id and b.status = 'PENDING' order by c.attempt_no desc limit 1
  ) call on true
  where b.listing_type = 'restaurant' and (select public.is_staff());
revoke all on public.admin_restaurant_call_queue from public, anon, authenticated;
grant select on public.admin_restaurant_call_queue to authenticated;

create or replace function public.schedule_reservation_callback(
  p_booking_id uuid, p_callback_at timestamptz, p_expected_callback_id uuid
) returns public.reservation_callbacks
language plpgsql security definer set search_path = '' as $$
declare
  latest_id uuid;
  new_call public.reservation_callbacks;
begin
  if auth.uid() is null or not public.is_staff() then
    raise exception 'NOT_AUTHORIZED' using errcode = '42501';
  end if;
  perform 1 from public.bookings
    where id = p_booking_id and listing_type = 'restaurant' and status = 'PENDING' for update;
  if not found then raise exception 'RESERVATION_CHANGED'; end if;
  select id into latest_id from public.reservation_callbacks
    where booking_id = p_booking_id order by attempt_no desc limit 1;
  if latest_id is distinct from p_expected_callback_id then raise exception 'CALLBACK_CHANGED'; end if;
  if p_callback_at is null or not isfinite(p_callback_at) or p_callback_at <= clock_timestamp() then
    raise exception 'INVALID_CALLBACK_TIME';
  end if;
  insert into public.reservation_callbacks(booking_id, callback_at, actor_id)
    values (p_booking_id, p_callback_at, auth.uid()) returning * into new_call;
  return new_call;
end $$;
revoke all on function public.schedule_reservation_callback(uuid, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.schedule_reservation_callback(uuid, timestamptz, uuid) to authenticated;
commit;
