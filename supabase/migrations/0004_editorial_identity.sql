-- Approval required. Prepared locally only; no remote execution.
-- Stable identity and lossless provenance payload for an incremental import.
begin;
alter table public.hotels add column if not exists editorial_key text;
alter table public.hotels add column if not exists editorial_metadata jsonb not null default '{}'::jsonb;
alter table public.restaurants add column if not exists editorial_key text;
alter table public.restaurants add column if not exists editorial_metadata jsonb not null default '{}'::jsonb;
alter table public.activities add column if not exists editorial_key text;
alter table public.activities add column if not exists editorial_metadata jsonb not null default '{}'::jsonb;
create unique index if not exists hotels_editorial_key_unique on public.hotels(editorial_key);
create unique index if not exists restaurants_editorial_key_unique on public.restaurants(editorial_key);
create unique index if not exists activities_editorial_key_unique on public.activities(editorial_key);
-- Existing RLS and publication status remain unchanged.
commit;
