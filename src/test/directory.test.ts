import {describe,it,expect} from 'vitest';
import {directory,directoryEntry,entryPath} from '../lib/directory';
import {safeWebsite} from '../services/nearbyPlaces';
import photos from '../lib/reviewedPhotos.json';
describe('real directory detail routes',()=>{
 it('gives every entry a unique supported path and official source',()=>{
  expect(new Set(directory.map(entryPath)).size).toBe(directory.length);
  for(const entry of directory){
   expect(directoryEntry(entryPath(entry))).toBe(entry);
   expect(directoryEntry(entryPath(entry)+'/')).toBe(entry);
   expect(safeWebsite(entry.website)).not.toBeNull();
   expect(safeWebsite(entry.sourceUrl)).not.toBeNull();
   expect(entry.description.tr).toBeTruthy();
   expect(entry.description.en).toBeTruthy();
  }
 });
 it('uses only registered licensed photos and never fabricates ratings or prices',()=>{
  for(const entry of directory){
   for(const id of entry.gallery)expect(photos).toHaveProperty(id);
   expect(entry).not.toHaveProperty('rating');expect(entry).not.toHaveProperty('price');
  }
 });
 it('does not resolve arbitrary or traversed paths',()=>{
  expect(directoryEntry('/hotels/missing')).toBeUndefined();
  expect(directoryEntry('/hotels/../akra-antalya')).toBeUndefined();
 });
});
