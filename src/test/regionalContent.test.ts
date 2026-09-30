import {describe,it,expect} from 'vitest';
import {findCityGuide} from '../lib/cityNavigation';
import {curatedDirectory} from '../lib/directory';
import cities from '../data/cityGuides.json';
import photos from '../lib/placePhotos.json';
import reviewed from '../lib/reviewedPhotos.json';
import publication from '../data/photoPublication.json';
describe('regional content',()=>{
 it('resolves destination aliases without hijacking generic searches',()=>{
  expect(findCityGuide('Bodrum')?.slug).toBe('mugla');
  expect(findCityGuide('Kuşadası')?.slug).toBe('aydin');
  expect(findCityGuide('Pamukkale')?.slug).toBe('denizli');
  expect(findCityGuide('tarih')).toBeUndefined();
  expect(findCityGuide('')).toBeUndefined();
 });
 it('publishes only the photo-approved catalog instead of padding city quotas',()=>{
  expect(curatedDirectory.map(e=>e.id).sort()).toEqual(Object.keys(publication.galleries).sort());
  for(const entry of curatedDirectory)for(const id of entry.gallery){
   expect(reviewed).toHaveProperty(id);
   expect(reviewed[id as keyof typeof reviewed].rightsStatus).toBe('verified-open');
  }
  for(const city of cities)expect(curatedDirectory.some(e=>e.city===city.name&&e.kind==='activities')).toBe(true);
  expect(curatedDirectory.some(e=>e.slug==='colossae-pamukkale')).toBe(false);
 });
 it('provides licensed regional photographs with listing thumbnails',()=>{
  for(const id of ['antalya',...cities.map(city=>city.slug)]){
   const photo=photos[id as keyof typeof photos];
   expect(photo.source).toContain('commons.wikimedia.org');
   expect(photo.license).toContain('CC');
   expect(photo).toHaveProperty('thumbnail');
  }
 });
});
