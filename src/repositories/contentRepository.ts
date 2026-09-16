import { requireSupabase } from '../lib/supabase'

export type ContentTable = 'hotels' | 'restaurants' | 'activities'

export interface ContentItem {
  id: string
  name: string
  description: string | null
  address: string | null
  website: string | null
  image_url: string | null
  featured: boolean
  active: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export async function getPublishedContent(table: ContentTable, cityId?: string) {
  let query = requireSupabase().from(table).select('*').eq('active', true).eq('status', 'PUBLISHED')
  if (cityId) query = query.eq('city_id', cityId)
  const { data, error } = await query.order('name')
  if (error) throw error
  return data
}

export async function getManageableContent(table: ContentTable) {
  const { data, error } = await requireSupabase().from(table).select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ContentItem[]
}

export async function saveContent(table: ContentTable, item: Omit<ContentItem, 'id'> & { id?: string }) {
  const payload = { ...item }
  const { data, error } = item.id
    ? await requireSupabase().from(table).update(payload).eq('id', item.id).select().single()
    : await requireSupabase().from(table).insert(payload).select().single()
  if (error) throw error
  return data as ContentItem
}
