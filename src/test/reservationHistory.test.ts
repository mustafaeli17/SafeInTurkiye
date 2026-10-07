import {beforeEach,expect,it,vi} from 'vitest'
import {reservationStatusCopy,reservationStatusIndex} from '../lib/reservationStatusCopy'
const mock=vi.hoisted(()=>({getUser:vi.fn(),from:vi.fn(),select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn(),abortSignal:vi.fn()}))
vi.mock('../lib/supabase',()=>({requireSupabase:()=>({auth:{getUser:mock.getUser},from:mock.from})}))
import {getOwnBookingRequests} from '../repositories/bookingRepository'
beforeEach(()=>{
 vi.clearAllMocks()
 mock.getUser.mockResolvedValue({data:{user:{id:'owner'}},error:null})
 for(const fn of [mock.from,mock.select,mock.eq,mock.order,mock.limit])fn.mockReturnValue(mock)
 mock.abortSignal.mockResolvedValue({data:[],error:null})
})
it('does not query requests when signed out',async()=>{
 mock.getUser.mockResolvedValue({data:{user:null},error:null})
 expect(await getOwnBookingRequests()).toBeNull();expect(mock.from).not.toHaveBeenCalled()
})
it('filters history by authenticated owner and restaurant type',async()=>{
 expect(await getOwnBookingRequests()).toEqual([])
 expect(mock.eq).toHaveBeenCalledWith('user_id','owner')
 expect(mock.eq).toHaveBeenCalledWith('listing_type','restaurant')
})
it('propagates history failure instead of presenting an empty successful result',async()=>{
 mock.abortSignal.mockResolvedValue({data:null,error:new Error('offline')})
 await expect(getOwnBookingRequests()).rejects.toThrow()
})
it('translates all request status states and gives final status precedence over contacted',()=>{
 for(const lang of ['en','tr','de','fr','ar','ru','zh'])expect(reservationStatusCopy[lang]).toHaveLength(10)
 expect(reservationStatusIndex('PENDING','CONTACTED')).toBe(6)
 expect(reservationStatusIndex('CONFIRMED','CONTACTED')).toBe(7)
 expect(reservationStatusIndex('REJECTED')).toBe(8)
 expect(reservationStatusIndex('CANCELLED')).toBe(9)
})
