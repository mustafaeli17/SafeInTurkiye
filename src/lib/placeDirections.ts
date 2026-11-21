import type {NearbyPlaceRecord} from '../services/nearbyPlaces'
import {isEditorialPlace} from './editorialDiscovery'

export function placeDirectionsUrl(place: NearbyPlaceRecord) {
  const {lat, lng} = place.coordinates
  const params = new URLSearchParams({api: '1', destination: `${lat},${lng}`})
  const placeId = isEditorialPlace(place) ? place.editorial.googlePlaceId
    : place.id.startsWith('google:') ? place.id.slice(7) : undefined
  if (placeId) params.set('destination_place_id', placeId)
  return 'https://www.google.com/maps/dir/?' + params
}
