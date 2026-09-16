-- SafeInTürkiye initial schema. This migration intentionally contains no seed,
-- service-role key, or other secret. Apply it only through an approved Supabase flow.
create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'moderator', 'editor', 'admin');
create type public.content_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
create type public.verification_status as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'EXPIRED');
create type public.source_type as enum ('GOVERNMENT', 'MUNICIPALITY', 'OPERATOR', 'BUSINESS', 'EDITORIAL', 'USER_SUBMITTED');
create type public.booking_status as enum ('PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED');
create type public.vehicle_class as enum ('YELLOW', 'TURQUOISE', 'BLACK');
create type public.listing_type as enum ('hotel', 'restaurant', 'activity');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.cities (
  id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
  active boolean not null default true, status public.content_status not null default 'DRAFT',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.data_sources (
  id uuid primary key default gen_random_uuid(), name text not null, url text, source_type public.source_type not null,
  verification_status public.verification_status not null default 'UNVERIFIED', active boolean not null default true,
  status public.content_status not null default 'DRAFT', last_verified_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.hotels (
  id uuid primary key default gen_random_uuid(), city_id uuid references public.cities(id) on delete set null,
  source_id uuid references public.data_sources(id) on delete set null, name text not null, description text,
  address text, website text, active boolean not null default true, status public.content_status not null default 'DRAFT',
  verification_status public.verification_status not null default 'UNVERIFIED', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.restaurants (like public.hotels including defaults including constraints including indexes);
create table public.activities (like public.hotels including defaults including constraints including indexes);
create table public.museums (like public.hotels including defaults including constraints including indexes);
create table public.attractions (like public.hotels including defaults including constraints including indexes);
create table public.exchange_offices (like public.hotels including defaults including constraints including indexes);
alter table public.restaurants add foreign key (city_id) references public.cities(id) on delete set null, add foreign key (source_id) references public.data_sources(id) on delete set null;
alter table public.activities add foreign key (city_id) references public.cities(id) on delete set null, add foreign key (source_id) references public.data_sources(id) on delete set null;
alter table public.museums add foreign key (city_id) references public.cities(id) on delete set null, add foreign key (source_id) references public.data_sources(id) on delete set null;
alter table public.attractions add foreign key (city_id) references public.cities(id) on delete set null, add foreign key (source_id) references public.data_sources(id) on delete set null;
alter table public.exchange_offices add foreign key (city_id) references public.cities(id) on delete set null, add foreign key (source_id) references public.data_sources(id) on delete set null;
create table public.scams (
  id uuid primary key default gen_random_uuid(), city_id uuid references public.cities(id) on delete set null,
  source_id uuid references public.data_sources(id) on delete set null, title text not null, description text not null,
  active boolean not null default true, status public.content_status not null default 'DRAFT',
  verification_status public.verification_status not null default 'UNVERIFIED', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(), city_id uuid references public.cities(id) on delete set null,
  name text not null, phone text not null, description text, active boolean not null default true,
  status public.content_status not null default 'DRAFT', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.taxi_tariffs (
  id uuid primary key default gen_random_uuid(), city_id uuid not null references public.cities(id) on delete restrict,
  source_id uuid references public.data_sources(id) on delete set null, vehicle_class public.vehicle_class not null default 'YELLOW',
  opening_fare numeric(10,2) not null check (opening_fare >= 0), per_km numeric(10,2) not null check (per_km >= 0),
  minimum_fare numeric(10,2) not null check (minimum_fare >= 0), waiting_fare numeric(10,2) not null check (waiting_fare >= 0),
  effective_from date not null, effective_to date, active boolean not null default true,
  verification_status public.verification_status not null default 'UNVERIFIED', last_verified_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from), unique (city_id, vehicle_class, effective_from)
);
create sequence public.booking_reference_seq;
create table public.bookings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  listing_type public.listing_type not null, listing_id uuid, listing_name text not null, guest_name text not null,
  guest_email text not null, visit_date date not null, guest_count integer not null check (guest_count > 0), notes text,
  reference_code text not null unique, status public.booking_status not null default 'PENDING',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.favorites (user_id uuid not null references auth.users(id) on delete cascade, listing_type public.listing_type not null, listing_id uuid not null, created_at timestamptz not null default now(), primary key (user_id, listing_type, listing_id));
create table public.trips (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, title text not null, starts_on date, ends_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.reviews (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, listing_type public.listing_type not null, listing_id uuid not null, rating smallint not null check (rating between 1 and 5), body text, status public.content_status not null default 'DRAFT', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.reports (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, subject text not null, body text not null, status public.content_status not null default 'DRAFT', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.analytics_events (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null, event_name text not null, properties jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

create index on public.taxi_tariffs (city_id, active, effective_from desc);
create index on public.bookings (user_id, created_at desc);
create index on public.hotels (city_id, active, status);
create index on public.restaurants (city_id, active, status);
create index on public.activities (city_id, active, status);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email)); return new; end $$;
create or replace function public.get_user_role() returns public.user_role language sql stable security definer set search_path = public as $$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$ select coalesce(public.get_user_role() in ('moderator', 'editor', 'admin'), false) $$;
create or replace function public.is_editor_or_admin() returns boolean language sql stable security definer set search_path = public as $$ select coalesce(public.get_user_role() in ('editor', 'admin'), false) $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select coalesce(public.get_user_role() = 'admin', false) $$;
create or replace function public.prevent_role_escalation() returns trigger language plpgsql security definer set search_path = public as $$ begin if new.role is distinct from old.role and not public.is_admin() then raise exception 'Only an admin can change roles'; end if; return new; end $$;
create or replace function public.generate_booking_reference() returns trigger language plpgsql set search_path = public as $$ begin new.reference_code := 'SIT-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.booking_reference_seq')::text, 7, '0'); new.status := 'PENDING'; return new; end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create trigger profiles_prevent_role_escalation before update on public.profiles for each row execute procedure public.prevent_role_escalation();
create trigger bookings_generate_reference before insert on public.bookings for each row execute procedure public.generate_booking_reference();
create trigger profiles_updated before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger cities_updated before update on public.cities for each row execute procedure public.set_updated_at();
create trigger sources_updated before update on public.data_sources for each row execute procedure public.set_updated_at();
create trigger hotels_updated before update on public.hotels for each row execute procedure public.set_updated_at();
create trigger restaurants_updated before update on public.restaurants for each row execute procedure public.set_updated_at();
create trigger activities_updated before update on public.activities for each row execute procedure public.set_updated_at();
create trigger museums_updated before update on public.museums for each row execute procedure public.set_updated_at();
create trigger attractions_updated before update on public.attractions for each row execute procedure public.set_updated_at();
create trigger exchange_offices_updated before update on public.exchange_offices for each row execute procedure public.set_updated_at();
create trigger scams_updated before update on public.scams for each row execute procedure public.set_updated_at();
create trigger emergency_contacts_updated before update on public.emergency_contacts for each row execute procedure public.set_updated_at();
create trigger taxi_tariffs_updated before update on public.taxi_tariffs for each row execute procedure public.set_updated_at();
create trigger bookings_updated before update on public.bookings for each row execute procedure public.set_updated_at();
create trigger trips_updated before update on public.trips for each row execute procedure public.set_updated_at();
create trigger reviews_updated before update on public.reviews for each row execute procedure public.set_updated_at();
create trigger reports_updated before update on public.reports for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security; alter table public.cities enable row level security; alter table public.data_sources enable row level security;
alter table public.hotels enable row level security; alter table public.restaurants enable row level security; alter table public.activities enable row level security; alter table public.museums enable row level security; alter table public.attractions enable row level security; alter table public.exchange_offices enable row level security; alter table public.scams enable row level security; alter table public.emergency_contacts enable row level security; alter table public.taxi_tariffs enable row level security; alter table public.bookings enable row level security; alter table public.favorites enable row level security; alter table public.trips enable row level security; alter table public.reviews enable row level security; alter table public.reports enable row level security; alter table public.analytics_events enable row level security;

create policy "Users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Editors read profiles" on public.profiles for select to authenticated using (public.is_editor_or_admin());
create policy "Admins update profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads published cities" on public.cities for select using (active and status = 'PUBLISHED');
create policy "Public reads verified published sources" on public.data_sources for select using (active and status = 'PUBLISHED' and verification_status = 'VERIFIED');
create policy "Public reads published hotels" on public.hotels for select using (active and status = 'PUBLISHED');
create policy "Public reads published restaurants" on public.restaurants for select using (active and status = 'PUBLISHED');
create policy "Public reads published activities" on public.activities for select using (active and status = 'PUBLISHED');
create policy "Public reads published museums" on public.museums for select using (active and status = 'PUBLISHED');
create policy "Public reads published attractions" on public.attractions for select using (active and status = 'PUBLISHED');
create policy "Public reads published exchange offices" on public.exchange_offices for select using (active and status = 'PUBLISHED');
create policy "Public reads published scams" on public.scams for select using (active and status = 'PUBLISHED');
create policy "Public reads published emergency contacts" on public.emergency_contacts for select using (active and status = 'PUBLISHED');
create policy "Public reads current verified tariffs" on public.taxi_tariffs for select using (active and verification_status = 'VERIFIED' and effective_from <= current_date and (effective_to is null or effective_to >= current_date));

create policy "Editors manage cities" on public.cities for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "Editors manage sources" on public.data_sources for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "Editors manage hotels" on public.hotels for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "Editors manage restaurants" on public.restaurants for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "Editors manage activities" on public.activities for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "Editors manage museums" on public.museums for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "Editors manage attractions" on public.attractions for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "Editors manage exchange offices" on public.exchange_offices for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "Editors manage scams" on public.scams for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "Editors manage emergency contacts" on public.emergency_contacts for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "Editors manage tariffs" on public.taxi_tariffs for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

create policy "Users read own bookings" on public.bookings for select to authenticated using (user_id = auth.uid());
create policy "Users create pending bookings" on public.bookings for insert to authenticated with check (user_id = auth.uid() and status = 'PENDING');
create policy "Staff read bookings" on public.bookings for select to authenticated using (public.is_staff());
create policy "Staff update booking status" on public.bookings for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Users manage own favorites" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own trips" on public.trips for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Published reviews are public" on public.reviews for select using (status = 'PUBLISHED');
create policy "Users create and read own reviews" on public.reviews for select to authenticated using (user_id = auth.uid());
create policy "Users create reviews" on public.reviews for insert to authenticated with check (user_id = auth.uid() and status = 'DRAFT');
create policy "Users update own reviews" on public.reviews for update to authenticated using (user_id = auth.uid() and status = 'DRAFT') with check (user_id = auth.uid() and status = 'DRAFT');
create policy "Staff manage reviews" on public.reviews for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Users read own reports" on public.reports for select to authenticated using (user_id = auth.uid());
create policy "Users create reports" on public.reports for insert to authenticated with check (user_id = auth.uid() and status = 'DRAFT');
create policy "Staff manage reports" on public.reports for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Anyone records anonymous analytics" on public.analytics_events for insert with check (true);
create policy "Staff read analytics" on public.analytics_events for select to authenticated using (public.is_staff());

insert into storage.buckets (id, name, public) values ('safeinturkiye-media', 'safeinturkiye-media', true) on conflict (id) do nothing;
create policy "Public reads published media" on storage.objects for select using (bucket_id = 'safeinturkiye-media');
create policy "Editors upload media" on storage.objects for insert to authenticated with check (bucket_id = 'safeinturkiye-media' and public.is_editor_or_admin());
create policy "Editors update media" on storage.objects for update to authenticated using (bucket_id = 'safeinturkiye-media' and public.is_editor_or_admin()) with check (bucket_id = 'safeinturkiye-media' and public.is_editor_or_admin());
create policy "Editors delete media" on storage.objects for delete to authenticated using (bucket_id = 'safeinturkiye-media' and public.is_editor_or_admin());
