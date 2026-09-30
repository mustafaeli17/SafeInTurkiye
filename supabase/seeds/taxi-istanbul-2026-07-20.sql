-- APPROVAL REQUIRED. Local-tested seed; never run automatically on deploy.
-- Evidence: IBB Meclis 17.07.2026 / 813, effective 20.07.2026.
-- Source: https://tuhim.ibb.gov.tr/media/27494/taksi-ta%C5%9F%C4%B1mac%C4%B1l%C4%B1%C4%9F%C4%B1-%C3%BCcret-tarifesi.pdf
-- waiting_fare is TL/hour, recorded for provenance, NOT added to distance estimates.
-- Excludes separate 8-passenger yellow class: not represented by current enum.
-- Publishes ONLY a new Istanbul city identity + municipal source + three tariffs.
-- Existing unpublished/inactive city or conflicting data stops the entire transaction.
begin;
lock table public.cities, public.data_sources, public.taxi_tariffs in share row exclusive mode;
do $$
declare
 city_uuid uuid;
 source_uuid constant uuid := 'a9697481-f832-4935-b2f1-bf207673a601';
 source_link constant text := 'https://tuhim.ibb.gov.tr/media/27494/taksi-ta%C5%9F%C4%B1mac%C4%B1l%C4%B1%C4%9F%C4%B1-%C3%BCcret-tarifesi.pdf';
 source_label constant text := 'İBB TUHİM — Meclis 17.07.2026 / 813';
 checked constant timestamptz := '2026-09-29T00:00:00Z';
 r record;
begin
 if now() < checked or now() > checked + interval '30 days' then
  raise exception 'Tariff evidence needs re-verification before applying this seed';
 end if;
 if exists(select 1 from public.cities where
   (name='İstanbul' or slug='istanbul') and
   (name<>'İstanbul' or slug<>'istanbul' or not active or status<>'PUBLISHED')) then
  raise exception 'Istanbul city identity/publication requires explicit reconciliation';
 end if;
 insert into public.cities(id,name,slug,active,status)
 select '52a195e8-0879-fbe6-9c39-6071a462b2ec','İstanbul','istanbul',true,'PUBLISHED'
 where not exists(select 1 from public.cities where name='İstanbul');
 select id into strict city_uuid from public.cities where name='İstanbul' and slug='istanbul';
 if exists(select 1 from public.data_sources where (id=source_uuid or url=source_link) and
  (id<>source_uuid or name is distinct from source_label or url is distinct from source_link
   or source_type<>'MUNICIPALITY' or verification_status<>'VERIFIED' or not active
   or status<>'PUBLISHED' or last_verified_at is distinct from checked)) then
  raise exception 'Tariff source conflict: reconcile explicitly, do not overwrite';
 end if;
 insert into public.data_sources(id,name,url,source_type,verification_status,active,status,last_verified_at)
 values(source_uuid,source_label,source_link,'MUNICIPALITY','VERIFIED',true,'PUBLISHED',checked)
 on conflict(id) do nothing;
 for r in select * from (values
  ('ae5836f9-f93a-45da-aa94-7aa19773cb01'::uuid,'YELLOW'::public.vehicle_class,71.94,47.92,230.00,598.90),
  ('ae5836f9-f93a-45da-aa94-7aa19773cb02'::uuid,'TURQUOISE'::public.vehicle_class,82.73,55.10,265.00,688.72),
  ('ae5836f9-f93a-45da-aa94-7aa19773cb03'::uuid,'BLACK'::public.vehicle_class,122.30,81.46,400.00,1018.12)
 ) as v(id,vehicle_class,opening_fare,per_km,minimum_fare,waiting_fare) loop
  if exists(select 1 from public.taxi_tariffs t where
    (t.id=r.id or (t.city_id=city_uuid and t.vehicle_class=r.vehicle_class)) and
    (t.id<>r.id or t.city_id<>city_uuid or t.vehicle_class<>r.vehicle_class
     or t.source_id is distinct from source_uuid or t.opening_fare<>r.opening_fare
     or t.per_km<>r.per_km or t.minimum_fare<>r.minimum_fare or t.waiting_fare<>r.waiting_fare
     or t.effective_from<>'2026-07-20'::date or t.effective_to is not null
     or not t.active or t.verification_status<>'VERIFIED' or t.last_verified_at is distinct from checked)) then
   raise exception 'Existing tariff conflict/history: explicit reconciliation required';
  end if;
  insert into public.taxi_tariffs(id,city_id,source_id,vehicle_class,opening_fare,per_km,minimum_fare,waiting_fare,effective_from,active,verification_status,last_verified_at)
  values(r.id,city_uuid,source_uuid,r.vehicle_class,r.opening_fare,r.per_km,r.minimum_fare,r.waiting_fare,'2026-07-20',true,'VERIFIED',checked)
  on conflict(id) do nothing;
 end loop;
end $$;
commit;
