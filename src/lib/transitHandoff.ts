type TravelPoint = {label:string;lat:number;lng:number}
type TransitHandoff = {origin:TravelPoint;destination:TravelPoint}

// One navigation within this tab. Never persist the traveller's route or put it in a URL.
let pending:TransitHandoff|null = null
export function setTransitHandoff(value:TransitHandoff) { pending=value }
export function peekTransitHandoff() { return pending }
export function clearTransitHandoff() { pending=null }
