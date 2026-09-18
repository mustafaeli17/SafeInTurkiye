import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

// Keep local preview placeholders from being treated as a real Supabase
// client. Otherwise every sign-in attempt becomes the misleading "Invalid API
// key" response even though the preview was intentionally started offline.
const placeholderKey = !anonKey || anonKey === 'preview-anon-key' || anonKey === 'your-anon-key' || anonKey.includes('replace-me')

export const supabaseConfigured = Boolean(url && anonKey && !placeholderKey)

// Keeping this nullable prevents a build-time placeholder key from making the
// application look connected when it is not configured.
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  return supabase
}
