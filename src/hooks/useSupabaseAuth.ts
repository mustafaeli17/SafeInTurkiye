import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {authStorageKey,needsAuthClient,supabaseConfigured} from '../lib/supabaseConfig'

export type AppRole = 'user' | 'moderator' | 'editor' | 'admin'

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<AppRole>('user')
  const [loading, setLoading] = useState(needsAuthClient)
  const [accessError,setAccessError] = useState(false)
  const startAuth=useRef<null|(()=>void)>(null)
  const retryAccess=useRef<null|(()=>void)>(null)

  useEffect(() => {
    if (!supabaseConfigured) return
    let active = true
    let started = false
    let generation = 0
    let verifiedUserId: string | undefined
    let deferred: ReturnType<typeof setTimeout> | undefined
    let unsubscribe: (()=>void) | undefined
    const initialize=async()=>{
      if(started || !active)return
      started=true
      setLoading(true)
      const {requireSupabase}=await import('../lib/supabase')
      if(!active)return
      const client=requireSupabase()
      const receiveSession = (next: Session | null) => {
        const request = ++generation
        const userId = next?.user.id
        clearTimeout(deferred)
        setSession(next)
        if (!userId) {
          verifiedUserId=undefined
          setRole('user');setAccessError(false);setLoading(false)
          return
        }
        // A token refresh for this same verified account must not unmount an open editor.
        if (verifiedUserId !== userId) {
          verifiedUserId=undefined
          setRole('user');setLoading(true)
        }
        setAccessError(false)
        // Supabase releases the session lock after its auth callback returns.
        deferred=setTimeout(async()=>{
          try {
            const { data,error }=await client.from('profiles').select('role').eq('id',userId).abortSignal(AbortSignal.timeout(12000)).maybeSingle()
            if (!active || generation!==request) return
            if (error) throw error
            verifiedUserId=userId
            setRole(['admin','editor','moderator'].includes(data?.role??'')?data!.role as AppRole:'user')
          } catch {
            if (!active || generation!==request) return
            verifiedUserId=undefined
            setRole('user');setAccessError(true)
          } finally {
            if (active && generation===request) setLoading(false)
          }
        },0)
      }
      const checkSession=()=>{
        const request=++generation
        setAccessError(false);setLoading(true)
        void client.auth.getSession().then(({data,error})=>{
          if(!active||request!==generation)return
          if(error)throw error
          receiveSession(data.session)
        }).catch(()=>{
          if(!active||request!==generation)return
          receiveSession(null);setAccessError(true)
        })
      }
      retryAccess.current=checkSession
      checkSession()
      const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (!active) return
        receiveSession(nextSession)
      })
      unsubscribe=()=>listener.subscription.unsubscribe()
    }
    const start=()=>{void initialize().catch(()=>{
      if(!active)return
      started=false
      setSession(null);setRole('user');setAccessError(true);setLoading(false)
    })}
    const restore=()=>{if(needsAuthClient())start()}
    const storage=(event:StorageEvent)=>{if(event.key===authStorageKey&&event.newValue)start()}
    startAuth.current=start
    restore()
    window.addEventListener('storage',storage)
    window.addEventListener('hashchange',restore)
    window.addEventListener('pageshow',restore)
    return () => {
      active=false;generation+=1;clearTimeout(deferred);unsubscribe?.();startAuth.current=null;retryAccess.current=null
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
    accessError,
    retry:()=>{if(retryAccess.current)retryAccess.current();else startAuth.current?.()},
    isStaff: role === 'admin' || role === 'editor' || role === 'moderator',
    signIn: async(email: string, password: string) => (await auth()).signInWithPassword({ email, password }),
    signUp: async(email: string, password: string) => (await auth()).signUp({ email, password }),
    signOut: async() => (await auth()).signOut(),
  }
}
