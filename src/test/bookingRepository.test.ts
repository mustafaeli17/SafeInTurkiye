import { beforeEach, describe, expect, it, vi } from 'vitest'
const mock=vi.hoisted(()=>({getUser:vi.fn(),insert:vi.fn(),single:vi.fn()}))
vi.mock('../lib/supabase',()=>({requireSupabase:()=>({auth:{getUser:mock.getUser},from:()=>({insert:mock.insert})})}))
import { createBooking } from '../repositories/bookingRepository'
const request={listingType:'restaurant' as const,listingName:'Test restaurant',guestName:'Test guest',guestEmail:'test@example.com',visitDate:'2030-01-01',guestCount:2}
describe('reservation requests',()=>{
  beforeEach(()=>{vi.clearAllMocks();mock.getUser.mockResolvedValue({data:{user:{id:'user-id'}},error:null});mock.insert.mockReturnValue({select:()=>({single:mock.single})});mock.single.mockResolvedValue({data:{reference_code:'TEST',status:'PENDING'},error:null})})
  it('leaves status and reference ownership to the database',async()=>{expect(await createBooking(request)).toEqual({reference_code:'TEST',status:'PENDING'});const payload=mock.insert.mock.calls[0][0];expect(payload).not.toHaveProperty('status');expect(payload).not.toHaveProperty('reference_code');expect(payload.user_id).toBe('user-id')})
  it('does not insert unauthenticated requests',async()=>{mock.getUser.mockResolvedValue({data:{user:null},error:null});await expect(createBooking(request)).rejects.toThrow();expect(mock.insert).not.toHaveBeenCalled()})
  it('rejects invalid party size before contacting Supabase',async()=>{await expect(createBooking({...request,guestCount:0})).rejects.toThrow();expect(mock.getUser).not.toHaveBeenCalled()})
  it('does not report success when storage fails',async()=>{mock.single.mockResolvedValue({data:null,error:new Error('storage failure')});await expect(createBooking(request)).rejects.toThrow()})
})
