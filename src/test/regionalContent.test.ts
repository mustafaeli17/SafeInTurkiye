import {describe,it,expect} from 'vitest';
import {findCityGuide} from '../lib/cityNavigation';
import {curatedDirectory} from '../lib/directory';
import cities from '../data/cityGuides.json';
import photos from '../lib/placePhotos.json';
describe('regional content',()=>{
 it('resolves destination aliases without hijacking generic searches',()=>{
  expect(findCityGuide('Bodrum')?.slug).toBe('mugla');
  expect(findCityGuide('Kuşadası')?.slug).toBe('aydin');
  expect(findCityGuide('Pamukkale')?.slug).toBe('denizli');
  expect(findCityGuide('tarih')).toBeUndefined();
  expect(findCityGuide('')).toBeUndefined();
 });
 it('has at least three sourced hotels and activities per new city',()=>{
  for(const city of cities)for(const kind of ['hotels','activities']){
   expect(curatedDirectory.filter(entry=>entry.city===city.name&&entry.kind===kind).length).toBeGreaterThanOrEqual(3);
  }
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
