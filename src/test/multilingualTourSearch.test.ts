import {describe,it,expect} from 'vitest'
import {mentionedSearchCity,searchCities} from '../services/searchCities'
import {tourIntent,tourSearchTerm,localizedTourTerm} from '../services/tourSearch'
describe('Multilingual destination and tour search',()=>{
  it.each([
    ['es','Estambul traslado al aeropuerto'],['de','istanbul Flughafentransfer'],['fr','istanbul transfert aéroport'],['en','istanbul airport transfer'],
  ])('aligns common search with %s catalog',(language,expected)=>{
    expect(localizedTourTerm(tourSearchTerm('伊斯坦布尔机场接送'),language)).toBe(expected)
  })
  it.each([
    ['Istanbul airport transfer','istanbul airport transfer'],
    ['İstanbul havalimanı transferi','istanbul airport transfer'],
    ['Estambul traslado al aeropuerto','istanbul airport transfer'],
    ['Стамбул трансфер из аэропорта','istanbul airport transfer'],
    ['伊斯坦布尔机场接送','istanbul airport transfer'],
    ['إسطنبول نقل المطار','istanbul airport transfer'],
    ['Istanbul Flughafentransfer','istanbul airport transfer'],
    ['Istanbul transfert aéroport','istanbul airport transfer'],
    ['Istanbul luchthaventransfer','istanbul airport transfer'],
    ['Estambul visita privada por la ciudad','istanbul private city tour'],
    ['Стамбул частная экскурсия по городу','istanbul private city tour'],
    ['伊斯坦布尔私人城市游','istanbul private city tour'],
    ['إسطنبول جولة خاصة في المدينة','istanbul private city tour'],
    ['Istanbul private Stadtführung','istanbul private city tour'],
    ['Istanbul visite privée de la ville','istanbul private city tour'],
    ['Istanbul privé stadstour','istanbul private city tour'],
    ['Istanbul ozel sehir turu','istanbul private city tour'],
    ['伊斯坦布尔博物馆之旅','istanbul museum tour'],
    ['Стамбул экскурсия по музею','istanbul museum tour'],
  ])('maps %s to the same destination and search', (input,expected)=>{
    expect(mentionedSearchCity(input)).toBe('istanbul')
    expect(tourSearchTerm(input)).toBe(expected)
    expect(tourIntent(input)).toBe(true)
  })
  it.each(Object.entries(searchCities))('recognizes all aliases for %s',(slug,aliases)=>{
    for(const alias of aliases)expect(mentionedSearchCity(`${alias} tour`)).toBe(slug)
  })
  it('does not guess ambiguous cities or match partial words',()=>{
    expect(mentionedSearchCity('Istanbul Antalya transfer')).toBeUndefined()
    expect(mentionedSearchCity('Bursary tour')).toBeUndefined()
    expect(tourIntent('restaurant')).toBe(false)
    expect(tourIntent('İstanbul metro')).toBe(false)
    expect(tourIntent('bad\u0000query')).toBe(false)
    expect(tourSearchTerm('Topkapı özel müze turu')).toBe('topkapi private museum tour')
    expect(tourSearchTerm('Bodrum boat tour')).toBe('bodrum boat tour')
  })
})
