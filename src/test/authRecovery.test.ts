import { beforeEach, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({effect:undefined as undefined|(()=>void),setters:[] as ReturnType<typeof vi.fn>[],session:vi.fn(),profile:vi.fn()}));
vi.mock('react',()=>({useEffect:(fn:()=>void)=>{mock.effect=fn;},useState:()=>{const setter=vi.fn();mock.setters.push(setter);return [null,setter];}}));
vi.mock('../lib/supabase',()=>({supabase:{auth:{getSession:mock.session,onAuthStateChange:()=>({data:{subscription:{unsubscribe:vi.fn()}}})},from:()=>({select:()=>({eq:()=>({abortSignal:()=>({maybeSingle:mock.profile})})})})}}));
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
beforeEach(()=>{mock.setters=[];vi.clearAllMocks();});
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
