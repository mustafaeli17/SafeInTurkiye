-- PREPARED ONLY: no remote execution without explicit approval.
-- Common editable discovery payload. Does not republish, delete, or seed content.
-- Existing 0004 fields on hotels/restaurants/activities are preserved.
begin;
alter table public.hotels add column if not exists editorial_metadata jsonb not null default '{}'::jsonb;
alter table public.restaurants add column if not exists editorial_metadata jsonb not null default '{}'::jsonb;
alter table public.activities add column if not exists editorial_metadata jsonb not null default '{}'::jsonb;
alter table public.museums add column if not exists editorial_metadata jsonb not null default '{}'::jsonb;
alter table public.attractions add column if not exists editorial_metadata jsonb not null default '{}'::jsonb;
alter table public.exchange_offices add column if not exists editorial_metadata jsonb not null default '{}'::jsonb;
alter table public.exchange_offices add column if not exists image_url text;
-- Concurrent editors cannot publish two active rows with the same explicit
-- Google identity in one section. Conflicts fail safely; nothing is deleted.
do $$ declare table_name text; begin
 foreach table_name in array array['hotels','restaurants','activities','museums','attractions','exchange_offices'] loop
  execute format('create unique index if not exists %I on public.%I ((editorial_metadata->>''googlePlaceId'')) where active and status=''PUBLISHED'' and nullif(editorial_metadata->>''googlePlaceId'','''') is not null',table_name||'_google_identity_published_unique',table_name);
 end loop;
end $$;
-- Existing publication/editor RLS policies remain the access boundary.
commit;
