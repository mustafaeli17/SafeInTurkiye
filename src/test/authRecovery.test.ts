import { afterEach,beforeEach, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({effect:undefined as undefined|(()=>()=>void),setters:[] as ReturnType<typeof vi.fn>[],session:vi.fn(),profile:vi.fn(),restore:vi.fn(),onAuth:vi.fn()}));
vi.mock('react',()=>({useRef:()=>({current:null}),useEffect:(fn:()=>()=>void)=>{mock.effect=fn;},useState:()=>{const setter=vi.fn();mock.setters.push(setter);return [null,setter];}}));
vi.mock('../lib/supabaseConfig',()=>({supabaseConfigured:true,authStorageKey:'test-auth',needsAuthClient:mock.restore}));
vi.mock('../lib/supabase',()=>({requireSupabase:()=>({auth:{getSession:mock.session,onAuthStateChange:mock.onAuth},from:()=>({select:()=>({eq:()=>({abortSignal:()=>({maybeSingle:mock.profile})})})})})}));
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
beforeEach(()=>{mock.setters=[];vi.clearAllMocks();mock.restore.mockReturnValue(true);mock.onAuth.mockReturnValue({data:{subscription:{unsubscribe:vi.fn()}}});vi.stubGlobal('window',new EventTarget());});
afterEach(()=>vi.unstubAllGlobals());
it('defers anonymous auth and restores a sign-in from another tab',async()=>{
 mock.restore.mockReturnValue(false);mock.session.mockResolvedValue({data:{session:null}});
 useSupabaseAuth();const cleanup=mock.effect!();expect(mock.session).not.toHaveBeenCalled();
 window.dispatchEvent(Object.assign(new Event('storage'),{key:'test-auth',newValue:'fixture'}));
 await vi.waitFor(()=>expect(mock.session).toHaveBeenCalledOnce());
 cleanup();
});
it('ignores an old session lookup that completes after a sign-out',async()=>{
 let resolve!: (value:unknown)=>void;
 mock.session.mockReturnValue(new Promise(done=>{resolve=done;}));
 useSupabaseAuth();const cleanup=mock.effect!();
 await vi.waitFor(()=>expect(mock.onAuth).toHaveBeenCalledOnce());
 mock.onAuth.mock.calls[0][0]('SIGNED_OUT',null);
 resolve({data:{session:{user:{id:'old'}}}});
 await new Promise(done=>setTimeout(done,0));
 expect(mock.setters[0]).toHaveBeenLastCalledWith(null);
 expect(mock.profile).not.toHaveBeenCalled();
 cleanup();
});
it('ends loading and fails closed when session lookup rejects',async()=>{
  mock.session.mockRejectedValue(new Error('network'));useSupabaseAuth();mock.effect!();
  await vi.waitFor(()=>expect(mock.setters[2]).toHaveBeenCalledWith(false));
  expect(mock.setters[1]).toHaveBeenCalledWith('user');expect(mock.setters[0]).toHaveBeenCalledWith(null);
});
it.each(['rejected','unknown-role','error'])('does not elevate a user on %s profile lookup',async kind=>{
  mock.session.mockResolvedValue({data:{session:{user:{id:'test'}}}});
  if(kind==='rejected')mock.profile.mockRejectedValue(new Error('network'));
  else mock.profile.mockResolvedValue({data:{role:kind==='error'?'admin':'owner'},error:kind==='error'?new Error('denied'):null});
  useSupabaseAuth();mock.effect!();await vi.waitFor(()=>expect(mock.setters[1]).toHaveBeenCalledWith('user'));
});
it('retains a validated admin role',async()=>{
  mock.session.mockResolvedValue({data:{session:{user:{id:'test'}}}});mock.profile.mockResolvedValue({data:{role:'admin'},error:null});
  useSupabaseAuth();mock.effect!();await vi.waitFor(()=>expect(mock.setters[1]).toHaveBeenCalledWith('admin'));
});
