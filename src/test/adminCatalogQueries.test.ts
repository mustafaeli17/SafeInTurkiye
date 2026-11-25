import {beforeEach, expect, it, vi} from 'vitest';
import {loadAdminCities,matchCityReference} from '../repositories/adminCityReferences';
import {hasPublishedGoogleId, loadCatalogPage,saveCatalogEntry} from '../repositories/adminEditorialCatalog';

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

it('reconciles a committed catalog insert after a lost response using the same ID', async()=>{
  const id='00000000-0000-0000-0000-000000001234';
  const payload={name:'Fixture hotel',active:true,status:'DRAFT',editorial_metadata:{phone:'+902120000000',gallery:[],coordinates:undefined}};
  const row={...payload,id,updated_at:'2026-11-25T13:00:00Z',editorial_metadata:{gallery:[],phone:'+902120000000'}};
  requests.mockResolvedValueOnce(Response.json({message:'timeout'},{status:504})).mockResolvedValueOnce(Response.json([row]));
  expect(await saveCatalogEntry('hotels',id,null,payload)).toEqual({kind:'saved',row});
  expect(JSON.parse(String(requests.mock.calls[0][1]?.body)).id).toBe(id);
  expect(new URL(String(requests.mock.calls[1][0])).searchParams.get('id')).toBe('eq.'+id);
});

it('returns the newer server version on conflict and never overwrites it on recovery',async()=>{
  const id='00000000-0000-0000-0000-000000001234';
  const payload={name:'Unsaved change',active:true,status:'DRAFT'};
  const row={...payload,id,name:'Newer version',updated_at:'revision-2'};
  requests.mockResolvedValueOnce(Response.json({code:'PGRST116'},{status:406})).mockResolvedValueOnce(Response.json([row]));
  expect(await saveCatalogEntry('museums',id,'revision-1',payload)).toEqual({kind:'conflict',row});
  expect(new URL(String(requests.mock.calls[0][0])).searchParams.get('updated_at')).toBe('eq.revision-1');
  expect(requests.mock.calls.map(([,options])=>options?.method)).toEqual(['PATCH','GET']);
  requests.mockResolvedValueOnce(failed()).mockResolvedValueOnce(failed());
  await expect(saveCatalogEntry('museums',id,'revision-1',payload)).rejects.toThrow();
});

it('requires the same city reference to match both the public name and slug',()=>{
  const dest={name:'İzmir',slug:'izmir'};
  const good={...dest,id:'1',active:true,status:'PUBLISHED',updated_at:'v1'};
  expect(matchCityReference(dest,[]).status).toBe('missing');
  expect(matchCityReference(dest,[good]).status).toBe('ready');
  expect(matchCityReference(dest,[{...good,active:false}]).status).toBe('inactive');
  expect(matchCityReference(dest,[{...good,slug:'wrong-slug'}]).status).toBe('conflict');
  expect(matchCityReference(dest,[{...good,slug:'wrong-slug'},{...good,id:'2',name:'Other'}]).status).toBe('conflict');
});
