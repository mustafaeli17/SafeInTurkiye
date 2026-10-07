import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import NearbyPlaces from '../components/NearbyPlaces'

describe('shared nearby address search', () => {
  it.each(['restaurant', 'hotel', 'activity', undefined] as const)('exposes address input for %s', fixedCategory => {
    const html = renderToStaticMarkup(<NearbyPlaces kind="essential" lang="en" center={{lat:41,lng:29}} cityName="İstanbul" fixedCategory={fixedCategory} />)
    expect(html).toContain('Address or area')
    expect(html).toContain('role="combobox"')
    expect(html).not.toContain('>Refresh<')
    expect(html).not.toContain('>İstanbul centre<')
    expect(html).toContain('Use my location')
  })
  it.each(['tr','en','de','fr','ar','ru','zh'])('supports exchange address search in %s', lang => {
    const html = renderToStaticMarkup(<NearbyPlaces kind="exchange" lang={lang} center={{lat:37.84,lng:27.84}} cityName="Aydın" />)
    expect(html).toContain('role="combobox"')
    if(lang !== 'en') expect(html).not.toContain('Address or area')
  })
})
