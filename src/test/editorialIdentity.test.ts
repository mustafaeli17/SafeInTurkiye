import {expect,it} from 'vitest'
import {registerPublishedEntry,directory} from '../lib/directory'
it('preserves migrated public slug and gallery while treating CMS name/address as authoritative',()=>{
 const entry=registerPublishedEntry({id:'test-editorial',public_slug:'legacy-hotel',name:'Updated name',description:'Updated description',address:'Updated address',website:'https://example.com',editorial_metadata:{name:'Old name',description:{en:'Old',tr:'Türkçe'},gallery:['existing-photo'],city:'İstanbul'}},'hotels')
 expect(entry.slug).toBe('legacy-hotel');expect(entry.name).toBe('Updated name');expect(entry.description.en).toBe('Updated description');expect(entry.description.tr).toBe('Türkçe');expect(entry.gallery).toEqual(['existing-photo']);expect(entry.address).toBe('Updated address')
 directory.splice(directory.findIndex(item=>item.id===entry.id),1)
})
