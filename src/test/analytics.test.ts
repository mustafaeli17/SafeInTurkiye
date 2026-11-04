import {describe,it,expect} from 'vitest';
import {analyticsUrl,trackingOptOut} from '../lib/analytics';
describe('analytics privacy boundary',()=>{
 it('honours either browser privacy signal without blocking normal navigation',()=>{
  expect(trackingOptOut({globalPrivacyControl:true})).toBe(true);
  expect(trackingOptOut({doNotTrack:'1'})).toBe(true);
  expect(trackingOptOut({doNotTrack:'0',globalPrivacyControl:true})).toBe(true);
  expect(trackingOptOut({})).toBe(false);
 });
 it('drops all search parameters',()=>expect(analyticsUrl('https://www.safeinturkiye.com/?email=private&lat=41')).toBe('https://www.safeinturkiye.com/'));
 it('excludes previews, local development, admin and tokens',()=>{
  for (const url of ['http://localhost:5187/','https://preview.vercel.app/','https://www.safeinturkiye.com/#admin','https://www.safeinturkiye.com/#access_token=secret','https://www.safeinturkiye.com/admin','invalid']) expect(analyticsUrl(url)).toBeNull();
 });
});
