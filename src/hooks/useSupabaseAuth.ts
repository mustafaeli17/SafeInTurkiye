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
    const loadRole = async (userId: string | undefined) => {
      if (!userId) {
        if (active) setRole('user')
        return
      }
      const { data } = await client.from('profiles').select('role').eq('id', userId).maybeSingle()
      if (active) setRole((data?.role as AppRole | undefined) ?? 'user')
    }
    client.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      void loadRole(data.session?.user.id)
      setLoading(false)
    })
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void loadRole(nextSession?.user.id)
    })
    return () => { active = false; listener.subscription.unsubscribe() }
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
