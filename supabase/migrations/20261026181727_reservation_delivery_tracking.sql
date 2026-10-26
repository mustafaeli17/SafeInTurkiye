-- Test first. No customer/email payload is stored by the webhook.
begin;
alter table public.reservation_notifications add column if not exists provider_email_id text;
alter table public.reservation_notifications add column if not exists delivery_state text not null default 'UNKNOWN' check(delivery_state in ('UNKNOWN','DELAYED','DELIVERED','FAILED','BOUNCED','COMPLAINED'));
alter table public.reservation_notifications add column if not exists delivery_event_at timestamptz;
create unique index if not exists reservation_provider_email_id on public.reservation_notifications(provider_email_id) where provider_email_id is not null;
create or replace function public.record_reservation_delivery(p_email_id text,p_state text,p_event_at timestamptz)
returns boolean language plpgsql security invoker set search_path=public as $$
declare current_job public.reservation_notifications%rowtype;
begin
 if p_state not in ('DELAYED','DELIVERED','FAILED','BOUNCED','COMPLAINED') or p_event_at is null or length(p_email_id)>200 then raise exception 'INVALID_EVENT'; end if;
 select * into current_job from public.reservation_notifications where provider_email_id=p_email_id for update;
 if not found then return false; end if;
 -- Idempotent and monotonic: late delayed events cannot undo delivery/failure.
 if array_position(array['UNKNOWN','DELAYED','DELIVERED','FAILED','BOUNCED','COMPLAINED'],p_state) > array_position(array['UNKNOWN','DELAYED','DELIVERED','FAILED','BOUNCED','COMPLAINED'],current_job.delivery_state) then
  update public.reservation_notifications set delivery_state=p_state,delivery_event_at=p_event_at where id=current_job.id;
 end if;
 return true;
end $$;
revoke all on function public.record_reservation_delivery(text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.record_reservation_delivery(text,text,timestamptz) to service_role;
commit;
