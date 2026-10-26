import {expect,it} from 'vitest';
import {viatorSummary} from '../server/viatorSummary';
it('only presents supported metadata when present and valid in the provider response',()=>{
 expect(viatorSummary({})).toEqual({});expect(viatorSummary({reviews:{combinedAverageRating:8,totalReviews:-1},duration:{fixedDurationInMinutes:0}})).toEqual({});
 expect(viatorSummary({reviews:{combinedAverageRating:4.8,totalReviews:120},duration:{fixedDurationInMinutes:180},flags:['FREE_CANCELLATION']})).toEqual({rating:4.8,reviewCount:120,durationMinutes:{from:180,to:180},freeCancellation:true});
 expect(viatorSummary({duration:{variableDurationFromMinutes:120,variableDurationToMinutes:180}})).toEqual({durationMinutes:{from:120,to:180}});
});
