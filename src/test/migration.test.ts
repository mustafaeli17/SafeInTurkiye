import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(new URL('../../supabase/migrations/0001_initial_schema.sql', import.meta.url), 'utf8')

describe('initial Supabase migration', () => {
  it('uses valid function declarations and protects every application table with RLS', () => {
    expect(migration).toContain('create or replace function public.prevent_role_escalation()')
    for (const table of ['profiles', 'cities', 'data_sources', 'hotels', 'restaurants', 'activities', 'museums', 'attractions', 'exchange_offices', 'scams', 'emergency_contacts', 'taxi_tariffs', 'bookings', 'favorites', 'trips', 'reviews', 'reports', 'analytics_events']) {
      expect(migration).toContain(`alter table public.${table} enable row level security`)
    }
  })

  it('keeps role changes database-side and never exposes draft tariffs or sources publicly', () => {
    expect(migration).toContain("auth.uid() is not null and not public.is_admin()")
    expect(migration).toContain("verification_status = 'VERIFIED' and effective_from <= current_date")
    expect(migration).toContain("status = 'PUBLISHED' and verification_status = 'VERIFIED'")
    expect(migration).not.toContain('using (true)')
  })

  it('generates a pending booking reference on the database and does not accept a client confirmation', () => {
    expect(migration).toContain('create trigger bookings_generate_reference before insert')
    expect(migration).toContain("new.status := 'PENDING'")
    expect(migration).toContain("'SIT-' || to_char(current_date, 'YYYY')")
    expect(migration).toContain('Users create pending bookings')
  })
})
