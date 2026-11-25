import {requireSupabase} from '../lib/supabase';

export type AdminCity = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  status: string;
  updated_at: string;
};

export function matchCityReference(destination: {name:string; slug:string}, rows: AdminCity[]) {
  const candidates = rows.filter(city => city.slug === destination.slug || city.name === destination.name);
  const city = candidates[0];
  if (!city) return {status:'missing' as const};
  if (candidates.length !== 1 || city.name !== destination.name || city.slug !== destination.slug) {
    return {status:'conflict' as const,candidates};
  }
  return {status:city.active && city.status === 'PUBLISHED' ? 'ready' as const : 'inactive' as const,city};
}

export async function loadAdminCities(signal: AbortSignal): Promise<AdminCity[]> {
  const rows: AdminCity[] = [];
  const client = requireSupabase();
  let expected: number | undefined;
  do {
    const {data, error, count} = await client.from('cities')
      .select('id,name,slug,active,status,updated_at', {count: 'exact'})
      .order('name').order('id').range(rows.length, rows.length + 99).abortSignal(signal);
    if (error || !Array.isArray(data) || count === null || (expected !== undefined && expected !== count)) {
      throw new Error('City references could not be verified');
    }
    expected = count;
    if (data.length === 0 && rows.length !== expected) throw new Error('Incomplete city references');
    rows.push(...data);
  } while (rows.length < expected);
  if (rows.length !== expected || new Set(rows.map(row => row.id)).size !== expected) {
    throw new Error('City references changed while loading');
  }
  return rows;
}
