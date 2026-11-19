import {expect,it} from 'vitest'
import {addressSearchText} from '../lib/addressSearchCopy'
it.each(['tr','en','de','fr','es','ru','ar','zh'])('has separate loading, empty and error messages in %s',lang=>{
 const messages=['loading','empty','error'].map(state=>addressSearchText(lang,state as 'loading'|'empty'|'error'))
 expect(new Set(messages).size).toBe(3)
 expect(messages.every(Boolean)).toBe(true)
 expect(addressSearchText(lang,'')).toBe('')
})
