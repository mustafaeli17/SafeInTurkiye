import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import photos from '../lib/placePhotos.json';
describe('verified place photographs',()=>{
 it('ships all attributed images with real local files',()=>{
  for(const p of Object.values(photos)){
   expect(existsSync('public'+p.src)).toBe(true);
   expect(readFileSync('public'+p.src).length).toBeGreaterThan(10000);
   expect(p.source).toMatch(/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
   expect(p.license).toMatch(/CC BY|CC0/);
  }
 });
 it('does not substitute unrelated stock images for unverified venues',()=>{
  const component=readFileSync('src/components/PlacePhoto.tsx','utf8');
  expect(component).not.toContain('unsplash');
  expect(component).toContain('!photo || failed');
 });
});
