import {describe,it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {additionalTransitCities} from '../lib/additionalTransitCities'
import {transitDeparture} from '../lib/transit'
describe('Transit convenience and destination coverage',()=>{
 it('covers all seven additional destinations with official HTTPS sources',()=>{expect(Object.keys(additionalTransitCities).sort()).toEqual(['Muğla','Aydın','Denizli','Trabzon','Konya','Bursa','Cappadocia'].sort());for(const city of Object.values(additionalTransitCities)){expect(city.url).toMatch(/^https:\/\//);expect(city.modes).toContain('bus')}})
 it('now means request time, not page-load time',()=>{expect(transitDeparture('',100000000)).toBe(new Date(100000000).toISOString());expect(transitDeparture('',100060000)).toBe(new Date(100060000).toISOString())})
 it('routes both selected endpoints by coordinates and defaults to now',()=>{const source=readFileSync('src/components/TransitJourney.tsx','utf8');expect(source).toContain('useState(false)');expect(source).toContain("transitDeparture(scheduled?departure:'')");expect(source).toContain('destination:destinationCoordinates??destination.trim()');expect(source).toContain('setDestinationCoordinates(null)')})
 it('debounces and cancels address searches and does not force suggestion selection',()=>{const source=readFileSync('src/components/TransitAddressInput.tsx','utf8');expect(source).toContain('},350)');expect(source).toContain('controller.abort()');expect(source).toContain('taxiSearchUrl(value)');expect(source).toContain("e.key==='Escape'");expect(source).toContain('OpenStreetMap')})
})
