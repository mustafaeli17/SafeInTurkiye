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

type CatalogPayload = Pick<EditorialRow, 'name'|'description'|'address'|'website'|'city_id'|'active'|'status'|'image_url'|'editorial_metadata'>;
type WriteResult = {kind: 'saved'|'conflict'; row: EditorialRow};

function sameJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value,i) => sameJson(value,right[i]));
  }
  const a = Object.entries(left).filter(([, value]) => value !== undefined);
  const b = Object.entries(right).filter(([, value]) => value !== undefined);
  return a.length === b.length && a.every(([key, value]) => Object.hasOwn(right,key) && sameJson(value,(right as Record<string, unknown>)[key]));
}

export async function saveCatalogEntry(table: EditorialTable, id: string, previousVersion: string|null, payload: CatalogPayload): Promise<WriteResult> {
  const client = requireSupabase();
  const write = previousVersion === null
    ? client.from(table).insert({...payload,id})
    : client.from(table).update(payload).eq('id',id).eq('updated_at',previousVersion);
  const result = await write.select('*').abortSignal(AbortSignal.timeout(12000)).single();
  if (!result.error && result.data) return {kind:'saved', row: result.data as EditorialRow};

  // A response may be lost after commit. Reconcile by the same ID before allowing a retry.
  const read = await client.from(table).select('*').eq('id',id).abortSignal(AbortSignal.timeout(8000)).maybeSingle();
  if (read.error || !read.data) throw new Error('Catalog write could not be confirmed');
  const row = read.data as EditorialRow;
  if (Object.entries(payload).every(([key, value]) => sameJson(value,row[key as keyof EditorialRow]))) return {kind:'saved', row};
  if (previousVersion === null || row.updated_at !== previousVersion) return {kind:'conflict', row};
  throw new Error('Catalog write could not be confirmed');
}
