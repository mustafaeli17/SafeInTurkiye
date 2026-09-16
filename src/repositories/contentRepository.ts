import { requireSupabase } from '../lib/supabase'

export type ContentTable = 'hotels' | 'restaurants' | 'activities'

export async function getPublishedContent(table: ContentTable, cityId?: string) {
  let query = requireSupabase().from(table).select('*').eq('active', true).eq('status', 'PUBLISHED')
  if (cityId) query = query.eq('city_id', cityId)
  const { data, error } = await query.order('name')
  if (error) throw error
  return data
}
