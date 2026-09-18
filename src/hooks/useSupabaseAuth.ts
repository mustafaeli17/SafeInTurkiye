import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AppRole = 'user' | 'moderator' | 'editor' | 'admin'

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<AppRole>('user')
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true
    let generation = 0
    let deferred: ReturnType<typeof setTimeout> | undefined
    const loadRole = async (userId: string | undefined) => {
      const request = ++generation
      if (!userId) {
        if (active) setRole('user')
        return
      }
      const { data } = await client.from('profiles').select('role').eq('id', userId).maybeSingle()
      if (active && request === generation) setRole((data?.role as AppRole | undefined) ?? 'user')
    }
    client.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      void loadRole(data.session?.user.id)
      setLoading(false)
    })
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setRole('user')
      generation += 1
      clearTimeout(deferred)
      // Do not query PostgREST while the auth callback holds the session lock.
      deferred = setTimeout(() => { if (active) void loadRole(nextSession?.user.id) }, 0)
    })
    return () => { active = false; generation += 1; clearTimeout(deferred); listener.subscription.unsubscribe() }
  }, [])

  return {
    session,
    role,
    loading,
    isStaff: role === 'admin' || role === 'editor' || role === 'moderator',
    signIn: (email: string, password: string) => supabase?.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string) => supabase?.auth.signUp({ email, password }),
    signOut: () => supabase?.auth.signOut(),
  }
}
