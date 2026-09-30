/** Distance-only meter estimate. Does not invent a traffic premium or class multiplier. */
export function distanceFare(km:number,opening:number,perKm:number,minimum:number):number{
 if(![km,opening,perKm,minimum].every(Number.isFinite)||km<=0||opening<0||perKm<=0||minimum<0)throw new Error('INVALID_FARE_INPUT');
 const result=Math.max(minimum,opening+km*perKm);
 if(!Number.isFinite(result))throw new Error('INVALID_FARE_INPUT');
 return Math.round(result*100)/100;
}

/** Range across supplied route distances, not a traffic/price confidence interval. */
export function routeFareRange(distances:number[],opening:number,perKm:number,minimum:number){
 if(!distances.length)throw new Error('INVALID_FARE_INPUT');
 const fares=distances.map(km=>distanceFare(km,opening,perKm,minimum));
 const min=Math.min(...fares),max=Math.max(...fares);
 return {amount:min,upper:max,hasRange:max-min>=1};
}
