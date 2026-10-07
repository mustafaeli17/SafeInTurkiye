import { requireSupabase } from '../lib/supabase'
import { foundationEnabled } from '../lib/foundationConfig'

export interface BookingRequest {
  listingType: 'hotel' | 'restaurant' | 'activity'
  listingId?: string
  listingName: string
  guestName: string
  guestEmail: string
  visitDate: string
  guestCount: number
  notes?: string
  visitTime?: string
  guestPhone?: string
}

export async function getOwnBookingRequests() {
  const client = requireSupabase()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) return null
  // Explicit ownership filter as defence in depth; RLS remains authoritative.
  const { data, error } = await client.from('bookings')
    .select(foundationEnabled ? 'id,reference_code,listing_name,visit_date,guest_count,status,notes,contact_stage,visit_time' : 'id,reference_code,listing_name,visit_date,guest_count,status,notes')
    .eq('user_id', auth.user.id).eq('listing_type', 'restaurant')
    .order('created_at', { ascending: false }).limit(100)
    .abortSignal(AbortSignal.timeout(12000))
  if (error) throw error
  return (data ?? []) as unknown as {id:string;reference_code:string;listing_name:string;visit_date:string;guest_count:number;status:string;contact_stage?:string;visit_time?:string}[]
}

export async function createBooking(request: BookingRequest) {
  if (request.visitTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(request.visitTime)) throw new Error('Invalid time.')
  if (request.guestPhone && (request.guestPhone.length > 40 || !/^[+\d ()-]{5,40}$/.test(request.guestPhone))) throw new Error('Invalid phone.')
  if (!request.listingName.trim() || !request.guestName.trim() || request.guestName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.guestEmail) || !Number.isInteger(request.guestCount) || request.guestCount < 1 || request.guestCount > 20 || !/^\d{4}-\d{2}-\d{2}$/.test(request.visitDate) || Number.isNaN(Date.parse(request.visitDate)) || (request.notes?.length ?? 0) > 4000) throw new Error('Invalid booking request.')
  const client = requireSupabase()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) throw new Error('Sign in is required to create a booking request.')

  // reference_code and status are intentionally omitted: the database trigger owns both.
  const { data, error } = await client.from('bookings').insert({
    user_id: auth.user.id,
    listing_type: request.listingType,
    listing_id: request.listingId ?? null,
    listing_name: request.listingName,
    guest_name: request.guestName,
    guest_email: request.guestEmail,
    visit_date: request.visitDate,
    guest_count: request.guestCount,
    notes: request.notes ?? null,
    ...(foundationEnabled ? {visit_time:request.visitTime ?? null,guest_phone:request.guestPhone ?? null} : {}),
  }).select('reference_code, status').single()
  if (error) throw error
  return data
}
