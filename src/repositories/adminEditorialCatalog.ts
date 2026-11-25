import type {EditorialRow, EditorialTable} from '../lib/editorialDiscovery';
import {requireSupabase} from '../lib/supabase';

export const catalogPageSize = 25;
export type CatalogFilters = {name: string; status: string; city: string; page: number};

export async function loadCatalogPage(table: EditorialTable, filters: CatalogFilters, signal: AbortSignal) {
  let query = requireSupabase().from(table).select('*', {count: 'exact'});
  const name = filters.name.trim();
  // PostgreSQL's ***= prefix treats the entire remaining search text literally.
  if (name) query = query.regexIMatch('name', '***=' + name);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.city) query = query.eq('city_id', filters.city);
  const offset = filters.page * catalogPageSize;
  const {data, error, count} = await query.order('name').order('id')
    .range(offset, offset + catalogPageSize - 1).abortSignal(signal);
  if (error?.code === 'PGRST103' && filters.page > 0) return {rows: [], total: 0};
  if (error || count === null || !Array.isArray(data)) throw new Error('Catalog unavailable');
  return {rows: data as EditorialRow[], total: count};
}

export async function hasPublishedGoogleId(table: EditorialTable, placeId: string, editingId?: string) {
  const {data, error} = await requireSupabase().from(table).select('id')
    .eq('active', true).eq('status', 'PUBLISHED').eq('editorial_metadata->>googlePlaceId', placeId)
    .limit(2).abortSignal(AbortSignal.timeout(12000));
  if (error || !Array.isArray(data)) throw new Error('Google identity lookup unavailable');
  return data.some(row => row.id !== editingId);
}
