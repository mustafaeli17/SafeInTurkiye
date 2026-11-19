import {expect,it} from 'vitest'
import {formatTransitDuration} from '../lib/transitDuration'

it('formats long journeys without losing minutes or rounding twice',()=>{
 expect(formatTransitDuration('21360s','tr')).toBe('5 saat 56 dk')
 expect(formatTransitDuration('13200s','tr')).toBe('3 saat 40 dk')
 expect(formatTransitDuration('3600s','tr')).toBe('1 saat')
 expect(formatTransitDuration('3599s','tr')).toBe('1 saat')
 expect(formatTransitDuration('1560s','tr')).toBe('26 dk')
})
it.each(['en','tr','de','fr','es','ar','ru','zh'])('formats durations in %s',locale=>{
 const result=formatTransitDuration('21360s',locale)
 expect(result).toBeTruthy()
 expect(result).not.toContain('356')
 expect(result).not.toContain('NaN')
})
