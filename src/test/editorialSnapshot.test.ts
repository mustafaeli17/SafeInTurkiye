import {expect,it,vi} from 'vitest'
// @ts-expect-error The build-only ESM script is intentionally outside app compilation.
import {publishedEditorialSnapshot} from '../../scripts/published-editorial-snapshot.mjs'
it('uses the public publication view and preserves CMS route identity and edits',async()=>{
 const fetcher=vi.fn(async(url:string)=>({ok:true,json:async()=>url.includes('/cities?')?[{id:'city',name:'İstanbul'}]:[{id:'one',kind:'hotels',slug:'existing-route',name:'Updated',description:'Updated description',city_id:'city',editorial_metadata:{description:{en:'Old',tr:'Açıklama'}}}]}))
 const rows=await publishedEditorialSnapshot('https://example.invalid','public-key',fetcher)
 expect(rows[0]).toMatchObject({slug:'existing-route',name:'Updated',city:'İstanbul',description:{en:'Updated description',tr:'Açıklama'}})
 expect(fetcher.mock.calls[0][0]).toContain('published_editorial_businesses')
})
it('refuses silent static fallback when the CMS build request fails',async()=>{
 await expect(publishedEditorialSnapshot('https://example.invalid','public-key',async()=>({ok:false,status:503}))).rejects.toThrow('legacy fallback refused')
})
it('keeps an intentionally empty published snapshot empty',async()=>{
 expect(await publishedEditorialSnapshot('https://example.invalid','public-key',async()=>({ok:true,json:async()=>[]}))).toEqual([])
})
