import {it,expect} from 'vitest';
import {distanceFare,routeFareRange} from '../lib/taxiCalculation';
it('uses actual alternate distances without invented traffic/weather premiums',()=>{
 expect(routeFareRange([10,12],71.94,47.92,230)).toEqual({amount:551.14,upper:646.98,hasRange:true});
 expect(routeFareRange([10],71.94,47.92,230)).toEqual({amount:551.14,upper:551.14,hasRange:false});
 expect(routeFareRange([0.1,0.2],71.94,47.92,230)).toEqual({amount:230,upper:230,hasRange:false});
 expect(()=>routeFareRange([],1,1,1)).toThrow();
});
it('uses opening and distance, respecting the minimum without invented premiums',()=>{
 expect(distanceFare(10,20,15,50)).toBe(170);
 expect(distanceFare(1,20,15,50)).toBe(50);
});
it('rejects invalid distance and tariff numbers',()=>{
 for(const km of [0,-1,NaN,Infinity])expect(()=>distanceFare(km,20,15,50)).toThrow();
 expect(()=>distanceFare(1,20,0,50)).toThrow();
});
