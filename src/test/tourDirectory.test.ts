import { describe, expect, it } from 'vitest'
import { formatTourDuration, tourCategoryTerm, tourDirectoryCopy } from '../lib/tourDirectory'

describe('tour durations', () => {
  it('presents fixed, ranged and mixed Turkish durations without dropping minutes', () => {
    expect(formatTourDuration({ from: 360, to: 480 }, 'tr')).toBe('6–8 saat')
    expect(formatTourDuration({ from: 30, to: 45 }, 'tr')).toBe('30–45 dakika')
    expect(formatTourDuration({ from: 90, to: 90 }, 'tr')).toBe('1 saat 30 dk')
    expect(formatTourDuration({ from: 90, to: 120 }, 'tr')).toBe('1 saat 30 dk–2 saat')
    expect(formatTourDuration({ from: 1440, to: 2880 }, 'tr')).toBe('1–2 gün')
    expect(formatTourDuration({ from: 60, to: 50 }, 'tr')).toBe('')
  })
  it.each(['en', 'tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh'])('uses the locale’s range and plural rules in %s', lang => {
    const unit = new Intl.NumberFormat(lang, { style: 'unit', unit: 'hour', unitDisplay: 'long' })
    expect(formatTourDuration({ from: 120, to: 120 }, lang)).toBe(unit.format(2))
    expect(formatTourDuration({ from: 60, to: 480 }, lang)).toBe(unit.formatRange(1, 8))
  })
})

describe('tour categories', () => {
  it.each(['en', 'tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh'])('provides keyword searches for each localized category in %s', lang => {
    const { categories } = tourDirectoryCopy(lang)
    expect(categories).toHaveLength(9)
    expect(tourCategoryTerm(0, lang)).toBe('')
    for (let index = 1; index < categories.length; index++) {
      expect(tourCategoryTerm(index, lang)).toBeTruthy()
      expect(categories[index]).toBeTruthy()
    }
  })
  it('uses a search keyword in the language available from Viator', () => {
    expect(tourCategoryTerm(5, 'tr')).toBe('nature')
    expect(tourCategoryTerm(5, 'es')).toBe('naturaleza')
  })
})
