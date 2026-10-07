import { expect, it } from 'vitest'
import { restaurantRequestCopy } from '../lib/restaurantRequestCopy'
it('supplies every reservation field and status in all seven supported languages',()=>{
  expect(Object.keys(restaurantRequestCopy).sort()).toEqual(['ar','de','en','fr','ru','tr','zh'])
  for(const [lang,copy] of Object.entries(restaurantRequestCopy)){
    expect(copy).toHaveLength(14)
    expect(copy.every(text=>text.trim().length>0)).toBe(true)
    // "Date" is also the correct French label, not an English fallback.
    if(lang!=='en') for(let i=0;i<14;i++) if(!(lang==='fr'&&i===5)) expect(copy[i]).not.toBe(restaurantRequestCopy.en[i])
  }
})
