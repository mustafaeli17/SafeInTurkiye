import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({result:{data:[] as unknown[]|null,error:null as unknown},query:{} as Record<string,ReturnType<typeof vi.fn>>}));
vi.mock('../lib/supabase',()=>({requireSupabase:()=>({from:()=>mocks.query})}));
import {getPublishedContent} from '../repositories/contentRepository';
beforeEach(()=>{
 mocks.result={data:[],error:null};
 for(const method of ['select','eq','order'])mocks.query[method]=vi.fn(()=>mocks.query);
 mocks.query.abortSignal=vi.fn(async()=>mocks.result);
});
describe('published CMS content',()=>{
 it('keeps an empty published catalog empty',async()=>{
  expect(await getPublishedContent('hotels')).toEqual([]);
  expect(mocks.query.eq).toHaveBeenCalledWith('active',true);
  expect(mocks.query.eq).toHaveBeenCalledWith('status','PUBLISHED');
  expect(mocks.query.abortSignal).toHaveBeenCalled();
 });
 it('does not hide a provider failure as an empty catalog',async()=>{
  mocks.result={data:null,error:new Error('offline')};
  await expect(getPublishedContent('activities')).rejects.toThrow('offline');
 });
});
