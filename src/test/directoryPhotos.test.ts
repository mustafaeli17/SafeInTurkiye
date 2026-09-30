import {describe,it,expect,afterEach} from 'vitest';
import {directory,curatedDirectory,registerPublishedEntry} from '../lib/directory';
import {entryPhotos,publishedPhoto} from '../lib/directoryPhotos';
afterEach(()=>{const index=directory.findIndex(entry=>entry.id==='photo-test');if(index>=0)directory.splice(index,1);});
describe('published content images',()=>{
 it('gives every published editorial entry a licensed entity image, never city context',()=>{
  for(const entry of curatedDirectory){
   const gallery=entryPhotos(entry);
   expect(gallery.length,entry.name).toBeGreaterThan(0);
   expect(entry.gallery.length).toBeGreaterThan(0);
   expect(gallery[0].cityContext).toBeUndefined();
   expect(gallery[0].license).toMatch(/^(CC|Public domain)/);
   expect(publishedPhoto(entry.id)?.src).toBe(gallery[0].src);
   expect(gallery[0].src).toMatch(/^\/photos\//);
  }
 });
 it('does not treat an unreviewed CMS URL as a licensed entity photo',()=>{
  const entry=registerPublishedEntry({id:'photo-test',name:'Test',image_url:'https://example.com/photo.webp'},'hotels');
  expect(entryPhotos(entry)).toEqual([]);
  expect(publishedPhoto(entry.id)).toBeUndefined();
 });
 it('rejects unsafe and credential-bearing URLs',()=>{
  for(const image_url of ['javascript:alert(1)','data:image/png;base64,AA','https://user:pass@example.com/a.jpg','not a url']){
   expect(entryPhotos(registerPublishedEntry({id:'photo-test',name:'Test',image_url},'hotels'))).toEqual([]);
  }
 });
});
