import { requireSupabase } from '../lib/supabase'

export interface BookingRequest {
  listingType: 'hotel' | 'restaurant' | 'activity'
  listingId?: string
  listingName: string
  guestName: string
  guestEmail: string
  visitDate: string
  guestCount: number
  notes?: string
}

export async function createBooking(request: BookingRequest) {
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
  }).select('reference_code, status').single()
  if (error) throw error
  return data
}
