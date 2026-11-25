import {beforeEach, expect, it, vi} from 'vitest';
import {loadAdminCities} from '../repositories/adminCityReferences';
import {hasPublishedGoogleId, loadCatalogPage} from '../repositories/adminEditorialCatalog';

const requests = vi.hoisted(() => vi.fn<typeof fetch>());
vi.mock('../lib/supabase', async () => {
  const {createClient} = await import('@supabase/supabase-js');
  const client = createClient('https://isolated.example.test', 'fixture-anon-key', {
    global: {fetch: requests},
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
  });
  return {requireSupabase: () => client};
});
const signal = new AbortController().signal;
const json = (rows: unknown[], range: string) => Response.json(rows, {headers: {'content-range': range}});
const failed = () => Response.json({code: '42501', message: 'denied'}, {status: 403});
beforeEach(() => requests.mockReset());

it('sends category, literal search text, city, status and stable pagination to PostgREST', async () => {
  const name = '50%_Otel,*.(Ankara)';
  requests.mockResolvedValueOnce(json([{id: 'match'}], '500-500/501'));
  const page = await loadCatalogPage('restaurants', {name, city: 'city-id', status: 'DRAFT', page: 20}, signal);
  const [target, options] = requests.mock.calls[0];
  const url = new URL(String(target));
  expect(url.pathname).toBe('/rest/v1/restaurants');
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    name: 'imatch.***=' + name, city_id: 'eq.city-id', status: 'eq.DRAFT',
    order: 'name.asc,id.asc', offset: '500', limit: '25',
  });
  expect(new Headers(options?.headers).get('prefer')).toContain('count=exact');
  expect(page).toEqual({rows: [{id: 'match'}], total: 501});
});

it('distinguishes a failed query from a successful empty search', async () => {
  const filters = {name: '', status: '', city: '', page: 0};
  requests.mockResolvedValueOnce(failed()).mockResolvedValueOnce(json([], '*/0'));
  await expect(loadCatalogPage('hotels', filters, signal)).rejects.toThrow();
  await expect(loadCatalogPage('hotels', filters, signal)).resolves.toEqual({rows: [], total: 0});
  const url = new URL(String(requests.mock.calls[1][0]));
  for (const key of ['name','status','city_id']) expect(url.searchParams.has(key)).toBe(false);
});

it('verifies all pages before reporting which city references are missing', async () => {
  requests.mockResolvedValueOnce(json([{id: 'first'}], '0-0/2'))
    .mockResolvedValueOnce(json([{id: 'second'}], '1-1/2'));
  await expect(loadAdminCities(signal)).resolves.toEqual([{id: 'first'}, {id: 'second'}]);
  expect(new URL(String(requests.mock.calls[1][0])).searchParams.get('offset')).toBe('1');
  requests.mockResolvedValueOnce(json([{id: 'first'}], '0-0/2')).mockResolvedValueOnce(failed());
  await expect(loadAdminCities(signal)).rejects.toThrow();
});

it('rejects uncounted or incomplete city lists and accepts an exact empty one', async () => {
  requests.mockResolvedValueOnce(Response.json([]));
  await expect(loadAdminCities(signal)).rejects.toThrow();
  requests.mockResolvedValueOnce(json([], '*/2'));
  await expect(loadAdminCities(signal)).rejects.toThrow();
  requests.mockResolvedValueOnce(json([], '*/0'));
  await expect(loadAdminCities(signal)).resolves.toEqual([]);
});

it('checks duplicate Google identities across the category even when editing a filtered page', async () => {
  requests.mockResolvedValueOnce(json([{id: 'other'}], '0-0/*'))
    .mockResolvedValueOnce(json([{id: 'self'}], '0-0/*'))
    .mockResolvedValueOnce(failed());
  await expect(hasPublishedGoogleId('hotels', 'ChIJ-test', 'self')).resolves.toBe(true);
  const params = new URL(String(requests.mock.calls[0][0])).searchParams;
  expect(Object.fromEntries(params)).toMatchObject({
    'editorial_metadata->>googlePlaceId': 'eq.ChIJ-test', active: 'eq.true', status: 'eq.PUBLISHED',
  });
  expect(params.has('city_id')).toBe(false);
  await expect(hasPublishedGoogleId('hotels', 'ChIJ-test', 'self')).resolves.toBe(false);
  await expect(hasPublishedGoogleId('hotels', 'ChIJ-test', 'self')).rejects.toThrow();
});
