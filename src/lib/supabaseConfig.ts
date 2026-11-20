export const supabaseUrl=String(import.meta.env.VITE_SUPABASE_URL??'').trim()
export const supabaseAnonKey=String(import.meta.env.VITE_SUPABASE_ANON_KEY??'').trim()
const placeholder=!supabaseAnonKey || supabaseAnonKey==='preview-anon-key' || supabaseAnonKey==='your-anon-key' || supabaseAnonKey.includes('replace-me')
export const supabaseConfigured=Boolean(supabaseUrl && !placeholder)

// Keep the SDK's existing project-scoped storage key for returning users.
export const authStorageKey=supabaseConfigured?`sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`:''

export function needsAuthClient(){
  if(!supabaseConfigured || typeof window==='undefined')return false
  const {hash,search}=window.location
  if(hash.split('?')[0]==='#admin' || new URLSearchParams(search).has('code') || /(?:^#|&)(?:access_token|error_description)=/.test(hash))return true
  try{return Object.hasOwn(window.localStorage,authStorageKey)}
  catch{return true} // Let the SDK handle browsers that restrict storage access.
}
