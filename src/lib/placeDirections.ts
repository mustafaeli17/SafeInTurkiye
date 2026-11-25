import type {NearbyPlaceRecord} from '../services/nearbyPlaces'
import {isEditorialPlace} from './editorialDiscovery'

export function placeGoogleId(place: NearbyPlaceRecord) {
  return isEditorialPlace(place) ? place.editorial.googlePlaceId
    : place.id.startsWith('google:') ? place.id.slice(7) : undefined
}
export function placeDirectionsUrl(place: NearbyPlaceRecord) {
  return coordinatesDirectionsUrl(place.coordinates, placeGoogleId(place))
}

export function coordinatesDirectionsUrl({lat,lng}: NearbyPlaceRecord['coordinates'], placeId?:string|null) {
  const params = new URLSearchParams({api: '1', destination: `${lat},${lng}`})
  if (placeId) params.set('destination_place_id', placeId)
  return 'https://www.google.com/maps/dir/?' + params
}
