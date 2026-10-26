import type {NearbyPlaceRecord} from '../services/nearbyPlaces'

// Transient selected-place snapshot only: survives locale remounts, never persisted.
let selected:{place:NearbyPlaceRecord;expires:number}|null=null
export function rememberSelectedPlace(place:NearbyPlaceRecord,now=Date.now()){
 selected={place,expires:now+15*60_000}
}
export function selectedPlace(id:string|null,results:NearbyPlaceRecord[],now=Date.now()){
 if(!id)return null
 const current=results.find(place=>place.id===id)
 if(current)return current
 if(selected&&selected.expires<=now)selected=null
 return selected?.place.id===id?selected.place:null
}
