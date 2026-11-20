import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {authStorageKey,needsAuthClient,supabaseConfigured} from '../lib/supabaseConfig'

export type AppRole = 'user' | 'moderator' | 'editor' | 'admin'

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<AppRole>('user')
  const [loading, setLoading] = useState(needsAuthClient)
  const startAuth=useRef<null|(()=>void)>(null)

  useEffect(() => {
    if (!supabaseConfigured) return
    let active = true
    let started = false
    let generation = 0
    let deferred: ReturnType<typeof setTimeout> | undefined
    let unsubscribe: (()=>void) | undefined
    const initialize=async()=>{
      if(started || !active)return
      started=true
      setLoading(true)
      const {requireSupabase}=await import('../lib/supabase')
      if(!active)return
      const client=requireSupabase()
      const loadRole = async (userId: string | undefined) => {
        const request = ++generation
        if (!userId) {
          if (active) setRole('user')
          return
        }
        let nextRole: AppRole = 'user'
        try {
          const { data, error } = await client.from('profiles').select('role').eq('id', userId).abortSignal(AbortSignal.timeout(12000)).maybeSingle()
          if (!error && ['admin', 'editor', 'moderator'].includes(data?.role ?? '')) nextRole = data!.role as AppRole
        } catch { /* Network failures never grant staff privileges. */ }
        if (active && request === generation) setRole(nextRole)
      }
      const initialGeneration=generation
      client.auth.getSession().then(({ data }) => {
        if (!active || generation!==initialGeneration) return
        setSession(data.session)
        void loadRole(data.session?.user.id)
        setLoading(false)
      }).catch(() => {
        if (!active || generation!==initialGeneration) return
        setSession(null)
        setRole('user')
        setLoading(false)
      })
      const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (!active) return
        setSession(nextSession)
        setRole('user')
        setLoading(false)
        generation += 1
        clearTimeout(deferred)
        // Do not query PostgREST while the auth callback holds the session lock.
        deferred = setTimeout(() => { if (active) void loadRole(nextSession?.user.id) }, 0)
      })
      unsubscribe=()=>listener.subscription.unsubscribe()
    }
    const start=()=>{void initialize().catch(()=>{
      if(!active)return
      started=false
      setSession(null);setRole('user');setLoading(false)
    })}
    const restore=()=>{if(needsAuthClient())start()}
    const storage=(event:StorageEvent)=>{if(event.key===authStorageKey&&event.newValue)start()}
    startAuth.current=start
    restore()
    window.addEventListener('storage',storage)
    window.addEventListener('hashchange',restore)
    window.addEventListener('pageshow',restore)
    return () => {
      active=false;generation+=1;clearTimeout(deferred);unsubscribe?.();startAuth.current=null
      window.removeEventListener('storage',storage)
      window.removeEventListener('hashchange',restore)
      window.removeEventListener('pageshow',restore)
    }
  }, [])

  async function auth(){
    startAuth.current?.()
    return (await import('../lib/supabase')).requireSupabase().auth
  }
  return {
    session,
    role,
    loading,
    isStaff: role === 'admin' || role === 'editor' || role === 'moderator',
    signIn: async(email: string, password: string) => (await auth()).signInWithPassword({ email, password }),
    signUp: async(email: string, password: string) => (await auth()).signUp({ email, password }),
    signOut: async() => (await auth()).signOut(),
  }
}
