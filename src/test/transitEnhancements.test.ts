import {describe,it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {additionalTransitCities} from '../lib/additionalTransitCities'
import {resolveTransitEndpoint} from '../lib/transitEndpoint'
import {transitDeparture} from '../lib/transit'
describe('Transit convenience and destination coverage',()=>{
 it('covers all additional destinations with official HTTPS sources',()=>{expect(Object.keys(additionalTransitCities).sort()).toEqual(['Muğla','Aydın','Denizli','Trabzon','Konya','Bursa','Cappadocia','Gaziantep'].sort());for(const city of Object.values(additionalTransitCities)){expect(city.url).toMatch(/^https:\/\//);expect(city.modes).toContain('bus')}})
 it('now means request time, not page-load time',()=>{expect(transitDeparture('',100000000)).toBe(new Date(100000000).toISOString());expect(transitDeparture('',100060000)).toBe(new Date(100060000).toISOString())})
 it('uses a pending selection before the previously typed address and sends only coordinates',async()=>{
  const previous={lat:41,lng:28},selected={lat:41.1,lng:28.9,label:'Selected address'};
  expect(await resolveTransitEndpoint(Promise.resolve(selected),previous,'previous')).toEqual({lat:41.1,lng:28.9});
  expect(await resolveTransitEndpoint(Promise.resolve(null),previous,'previous')).toBeNull();
  expect(await resolveTransitEndpoint(null,previous,'unused')).toEqual(previous);
  expect(await resolveTransitEndpoint(null,null,' Taksim ')).toBe('Taksim');
  const source=readFileSync('src/components/TransitJourney.tsx','utf8');expect(source).toContain("transitDeparture(scheduled?departure:'')");
 })
 it('debounces and cancels address searches and does not force suggestion selection',()=>{const source=readFileSync('src/components/TransitAddressInput.tsx','utf8');expect(source).toContain('},350)');expect(source).toContain('controller.abort()');expect(source).toContain('/api/address');expect(source).toContain("e.key==='Escape'");expect(source).toContain('Google Maps')})
})
