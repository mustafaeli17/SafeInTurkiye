import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {authStorageKey,supabaseAnonKey,supabaseConfigured,supabaseUrl} from './supabaseConfig'
export {supabaseConfigured} from './supabaseConfig'

// Keeping this nullable prevents a build-time placeholder key from making the
// application look connected when it is not configured.
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { storageKey:authStorageKey, persistSession: true, autoRefreshToken: true } })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  return supabase
}
