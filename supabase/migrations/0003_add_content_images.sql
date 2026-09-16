-- Adds editorial image and featured controls to the existing public catalogue.
alter table public.hotels add column if not exists image_url text, add column if not exists featured boolean not null default false;
alter table public.restaurants add column if not exists image_url text, add column if not exists featured boolean not null default false;
alter table public.activities add column if not exists image_url text, add column if not exists featured boolean not null default false;
alter table public.museums add column if not exists image_url text, add column if not exists featured boolean not null default false;
alter table public.attractions add column if not exists image_url text, add column if not exists featured boolean not null default false;
