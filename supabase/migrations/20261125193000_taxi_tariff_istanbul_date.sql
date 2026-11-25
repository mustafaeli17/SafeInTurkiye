-- Effective dates follow the local fare calendar regardless of the API session timezone.
alter policy "Public reads current verified tariffs" on public.taxi_tariffs
using (
  active
  and verification_status = 'VERIFIED'
  and effective_from <= (current_timestamp at time zone 'Europe/Istanbul')::date
  and (effective_to is null or effective_to >= (current_timestamp at time zone 'Europe/Istanbul')::date)
);
