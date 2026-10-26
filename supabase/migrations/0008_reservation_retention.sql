-- Owner-approved 90-day policy for requests created by the guest intake only.
-- Legacy account requests (request_id IS NULL) and pending/future visits stay intact.
begin;
alter table public.bookings add column if not exists personal_data_removed_at timestamptz;
create or replace function public.anonymize_expired_restaurant_requests()
returns integer language plpgsql security definer set search_path=public as $$
declare total integer;
begin
 with expired as (
  select id from public.bookings where request_id is not null
   and listing_type='restaurant' and status in ('CONFIRMED','REJECTED','CANCELLED')
   and personal_data_removed_at is null
   and updated_at < now()-interval '90 days'
   and visit_date < (now() at time zone 'Europe/Istanbul')::date-90
  order by id limit 100 for update skip locked
 )
 update public.bookings b set guest_name='Removed',guest_email='removed@example.invalid',
  guest_phone=null,notes=null,user_id=null,
  receipt_hash=encode(sha256(uuid_send(gen_random_uuid())||uuid_send(gen_random_uuid())),'hex'),
  personal_data_removed_at=now()
 from expired where b.id=expired.id;
 get diagnostics total=row_count;
 return total;
end $$;
revoke all on function public.anonymize_expired_restaurant_requests() from public,anon,authenticated;
grant execute on function public.anonymize_expired_restaurant_requests() to service_role;
commit;
