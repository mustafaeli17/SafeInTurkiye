import {renderToStaticMarkup} from 'react-dom/server'
import {expect, it} from 'vitest'
import NearbyResultsMap from '../components/NearbyResultsMap'
import type {NearbyPlaceRecord} from '../services/nearbyPlaces'
import type {EditorialPlace} from '../lib/editorialDiscovery'

const cafe: NearbyPlaceRecord = {
  id: 'google:cafe-1', name: 'Kadıköy Cafe', category: 'cafe', coordinates: {lat: 40.99, lng: 29.02},
  distanceMeters: 200, address: null, phone: null, telephoneUrl: null, website: null,
  openingHours: null, sourceUrl: 'https://maps.google.com/?cid=1',
  photo: {url: '/api/place-photo?name=sample', sourceUrl: 'https://maps.google.com/?cid=1',
    authors: [{name: 'Cafe photographer', url: 'https://example.org/photographer'}]},
}
const museum = {...cafe, id: 'node/123', name: 'Kent Müzesi', category: 'museum' as const, photo: undefined}
const props = {lang: 'tr', onExpired: ()=>{}, title: 'Harita', errorText: 'Harita açılamadı'}

it('links the detail map name, directions and photo to the restaurant and keeps the photo credit link', ()=>{
  const html = renderToStaticMarkup(<NearbyResultsMap {...props} places={[cafe]}/>)
  const destinations = html.match(/href="https:\/\/www.google.com\/maps\/dir\/[^"]+"/g) ?? []
  expect(destinations.length).toBeGreaterThanOrEqual(2)
  expect(destinations.every(href=>href.includes('destination_place_id=cafe-1'))).toBe(true)
  expect(html).toContain('Yol tarifi')
  expect(html).toContain('href="https://example.org/photographer"')
})

it('keeps the results name as the detail action and directions tied to the currently selected location', ()=>{
  const html = renderToStaticMarkup(<NearbyResultsMap {...props} places={[cafe,museum]} activeId={museum.id} onOpen={()=>{}}/>)
  expect(html).toMatch(/<button[^>]*class="nearby-map-selection-name"[^>]*>Kent Müzesi/)
  expect(html).toMatch(/href="https:\/\/www.google.com\/maps\/dir\/[^"]*destination=40.99(?:%2C|,)29.02"/)
  expect(html).not.toContain('cafe-1')
})

it('uses a verified editorial Google place ID for the thumbnail and the directions link', ()=>{
  const place: EditorialPlace = {...cafe, id: 'cms:restaurants:42', photo: undefined, editorial: {
    table: 'restaurants', description: {}, fallbackDescription: '', image: null, gallery: ['https://example.org/photo.jpg'],
    imageRights: 'Licensed', imageSource: 'https://example.org/credits', sponsored: false, googlePlaceId: 'editorial-id',
  }}
  const html = renderToStaticMarkup(<NearbyResultsMap {...props} places={[place]}/>)
  expect((html.match(/destination_place_id=editorial-id/g)??[]).length).toBeGreaterThanOrEqual(2)
  expect(html).toContain('href="https://example.org/credits"')
})
