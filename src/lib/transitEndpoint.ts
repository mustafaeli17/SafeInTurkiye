type Point={lat:number;lng:number}

/** After a traveller selects a suggestion, wait for its actual place coordinates. */
export async function resolveTransitEndpoint(pending:Promise<Point|null>|null,selected:Point|null,text:string){
 const point=pending?await pending:selected
 if(point)return {lat:point.lat,lng:point.lng}
 return pending?null:text.trim()
}
