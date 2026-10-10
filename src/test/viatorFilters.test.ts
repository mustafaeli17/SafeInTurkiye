import { describe, expect, it } from 'vitest'
import { viatorFilters } from '../services/viatorFilters'
import { tourFilterCopy, toursLabel } from '../lib/viatorCopy'
import { readFileSync } from 'node:fs'

const parse=(s:string)=>viatorFilters(new URLSearchParams(s),'2026-10-10')
describe('Viator full-catalog filters',()=>{
 it('keeps the existing unfiltered request unchanged',()=>expect(parse('')).toEqual({filtering:{},sorting:{sort:'DEFAULT'}}))
 it('maps documented price, duration, rating, date and flags',()=>{
  expect(parse('minPrice=20&maxPrice=100&duration=short&rating=4&date=2026-10-12&private=true&freeCancellation=true&skipLine=true&sort=priceAsc')).toEqual({
   filtering:{lowestPrice:20,highestPrice:100,durationInMinutes:{from:0,to:240},rating:{from:4,to:5},startDate:'2026-10-12',endDate:'2026-10-12',flags:['PRIVATE_TOUR','FREE_CANCELLATION','SKIP_THE_LINE']},sorting:{sort:'PRICE',order:'ASCENDING'},
  })
 })
 it.each(['minPrice=-1','minPrice=NaN','minPrice=Infinity','maxPrice=0','minPrice=100&maxPrice=10','duration=bad','rating=4.5','sort=bad','private=false','date=2026-02-30','date=2026-10-09','date=2028-01-01'])('rejects malformed filters: %s',q=>expect(()=>parse(q)).toThrow('INVALID_INPUT'))
 it('supports multi-day and descending rating without local page filtering',()=>expect(parse('duration=multi&sort=rating')).toEqual({filtering:{durationInMinutes:{from:1441}},sorting:{sort:'TRAVELER_RATING',order:'DESCENDING'}}))
 it.each(['en','tr','es','de','fr','ar','ru','zh'])('has all filter labels in %s',lang=>{
  expect(tourFilterCopy(lang)).toHaveLength(23)
  expect(tourFilterCopy(lang).every(Boolean)).toBe(true)
  expect(toursLabel(lang)).toBeTruthy()
 })
 it('provides home and city entry points, removes the activities promotion',()=>{
  const app=readFileSync('src/App.tsx','utf8'),home=readFileSync('src/components/TravelHome.tsx','utf8')
  expect(home).toContain("label: toursLabel(lang), icon: Ticket, page: 'tours'")
  expect(app).toContain("tab:'tours',label:toursLabel(lang),icon:'🧭'")
  expect(app).toContain('initialCity={publicCities.find(c=>c.name===selectedCityName)?.slug}')
  expect(app).not.toContain('{toursLabel(lang)} →')
  expect(app).toContain('<option value="es">Español (ES)</option>')
 })
})
