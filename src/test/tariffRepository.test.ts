import {beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({rows:[] as unknown[],query:{} as Record<string,ReturnType<typeof vi.fn>>}));
vi.mock('../lib/supabase',()=>({requireSupabase:()=>({from:()=>mock.query})}));
import {getCurrentTaxiTariffs,eligibleTariffs} from '../repositories/tariffRepository';
const tariff={vehicle_class:'YELLOW',opening_fare:20,per_km:15,minimum_fare:50,waiting_fare:100,effective_from:'2020-01-01',effective_to:null,cities:{name:'İstanbul'},last_verified_at:new Date().toISOString(),data_sources:{name:'Municipality',url:'https://example.org/tariff',verification_status:'VERIFIED'}};
beforeEach(()=>{
 mock.rows=[];
 for(const method of ['select','eq','lte','or','order'])mock.query[method]=vi.fn(()=>mock.query);
 mock.query.abortSignal=vi.fn(async()=>({data:mock.rows,error:null}));
});
it('rejects stale, future, expired, wrong-city and unknown-class records locally',()=>{
 const now=Date.parse('2026-09-29T12:00:00Z');const good={...tariff,last_verified_at:'2026-09-29T10:00:00Z'};
 const invalid=[{...good,last_verified_at:'2020-01-01'},{...good,last_verified_at:'2027-01-01'},{...good,effective_from:'2027-01-01'},{...good,effective_to:'2026-09-28'},{...good,cities:{name:'Ankara'}},{...good,vehicle_class:'GOLD'},{...good,effective_from:'2026-02-30'}];
 expect(eligibleTariffs(invalid,'İstanbul',now)).toEqual([]);
 expect(eligibleTariffs([good],'İstanbul',now)).toHaveLength(1);
});
it('rejects unproven, invalid and missing tariffs without a built-in fallback',async()=>{
 mock.rows=[{...tariff,data_sources:null},{...tariff,per_km:0},{...tariff,last_verified_at:'invalid'}];
 expect(await getCurrentTaxiTariffs('İstanbul')).toEqual([]);
});
it('retains real provenance and selects only one tariff per class in descending date order',async()=>{
 mock.rows=[tariff,{...tariff,opening_fare:10}];
 const rows=await getCurrentTaxiTariffs('İstanbul');
 expect(rows).toHaveLength(1);expect(rows[0].openingFare).toBe(20);
 expect(rows[0].sourceUrl).toBe('https://example.org/tariff');
 expect(mock.query.order).toHaveBeenCalledWith('effective_from',{ascending:false});
});
