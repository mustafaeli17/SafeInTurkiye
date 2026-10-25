import {describe,it,expect,afterEach} from 'vitest';
import {directory,curatedDirectory,registerPublishedEntry} from '../lib/directory';
import {entryPhotos,publishedPhoto} from '../lib/directoryPhotos';
afterEach(()=>{const index=directory.findIndex(entry=>entry.id==='photo-test');if(index>=0)directory.splice(index,1);});
describe('published content images',()=>{
 it('does not resurrect the retired local gallery for a CMS entry',()=>{
  const entry=registerPublishedEntry({id:'photo-test',name:'Test',editorial_metadata:{gallery:['h2','a3','cinema-wide']}},'hotels');
  expect(curatedDirectory).toEqual([]);expect(entryPhotos(entry)).toEqual([]);expect(publishedPhoto(entry.id)).toBeUndefined();
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
