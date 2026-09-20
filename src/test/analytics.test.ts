import {describe,it,expect} from 'vitest';
import {analyticsUrl} from '../lib/analytics';
describe('analytics privacy boundary',()=>{
 it('drops all search parameters',()=>expect(analyticsUrl('https://www.safeinturkiye.com/?email=private&lat=41')).toBe('https://www.safeinturkiye.com/'));
 it('excludes previews, local development, admin and tokens',()=>{
  for (const url of ['http://localhost:5187/','https://preview.vercel.app/','https://www.safeinturkiye.com/#admin','https://www.safeinturkiye.com/#access_token=secret','https://www.safeinturkiye.com/admin','invalid']) expect(analyticsUrl(url)).toBeNull();
 });
});
