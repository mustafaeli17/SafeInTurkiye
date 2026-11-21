import {renderToStaticMarkup} from 'react-dom/server'
import {expect, it} from 'vitest'
import TravelHome from '../components/TravelHome'

const destinations = ['İstanbul', 'Antalya', 'İzmir', 'Bursa'].map(name => ({key: name, name}))
const handlers = {onCategory: () => {}, onSearch: () => {}, onNavigate: () => {}, onCity: () => {}}

it.each([
  ['tr', 'Tüm 4 şehri gör'], ['en', 'View all 4 cities'], ['de', 'Alle 4 Städte ansehen'],
  ['es', 'Ver las 4 ciudades'], ['fr', 'Voir les 4 villes'], ['ar', 'عرض كل المدن'],
  ['ru', 'Все города'], ['zh', '查看全部 4 个城市'],
])('keeps city discovery localised and exposes a real destination link in %s', (lang, label) => {
  const html = renderToStaticMarkup(<TravelHome lang={lang} cities={destinations} {...handlers}/>)
  expect(html).toContain(label)
  expect(html).toContain('aria-controls="home-city-cards"')
  expect(html).toContain('href="' + (lang === 'en' ? '' : '/' + lang) + '/cities/bursa"')
})

it('has no expand shortcut when every city fits the quick list', () => {
  const html = renderToStaticMarkup(<TravelHome lang="en" cities={destinations.slice(0, 3)} {...handlers}/>)
  expect(html).not.toContain('class="travel-city-jump"')
})
