import {describe,it,expect,afterEach} from 'vitest';
import {directory,curatedDirectory,registerPublishedEntry} from '../lib/directory';
import {entryPhotos,publishedPhoto} from '../lib/directoryPhotos';
afterEach(()=>{const index=directory.findIndex(entry=>entry.id==='photo-test');if(index>=0)directory.splice(index,1);});
describe('published content images',()=>{
 it('gives every curated entry a real image or explicitly labelled city context',()=>{
  for(const entry of curatedDirectory){
   const gallery=entryPhotos(entry);
   expect(gallery.length,entry.name).toBeGreaterThan(0);
   if(!entry.gallery.length)expect(gallery[0].cityContext).toBe(entry.city);
   expect(gallery[0].src).toMatch(/^\/photos\//);
  }
 });
 it('preserves a published image in both listing and detail',()=>{
  const entry=registerPublishedEntry({id:'photo-test',name:'Test',image_url:'https://example.com/photo.webp'},'hotels');
  expect(entryPhotos(entry)[0].src).toBe('https://example.com/photo.webp');
  expect(publishedPhoto(entry.id)?.src).toBe(entryPhotos(entry)[0].src);
 });
 it('rejects unsafe and credential-bearing URLs',()=>{
  for(const image_url of ['javascript:alert(1)','data:image/png;base64,AA','https://user:pass@example.com/a.jpg','not a url']){
   expect(entryPhotos(registerPublishedEntry({id:'photo-test',name:'Test',image_url},'hotels'))).toEqual([]);
  }
 });
});
