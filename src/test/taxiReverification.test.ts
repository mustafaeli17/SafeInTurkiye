import {expect,it} from 'vitest';
import {budgetIsCurrent,taxiBudgetRange} from '../lib/taxiBudget';

it('shows one rounded estimate on the published Istanbul yellow taxi sample for the airport trip',()=>{
 const now=Date.parse('2026-11-21T12:00:00Z');
 expect(taxiBudgetRange('İstanbul',[49.6],'YELLOW',now)).toMatchObject({amount:2450,upper:2450,hasRange:false,source:'İstanbul · 2026-11-21'});
 expect(taxiBudgetRange('İstanbul',[0.5],'YELLOW',now)).toMatchObject({amount:230,upper:230,minimumFare:230});
 expect(taxiBudgetRange('İzmir',[10],'YELLOW',now)?.minimumFare).toBeUndefined();
});
it('rejects an expired, future or impossible review date',()=>{
 expect(budgetIsCurrent('2026-11-21',Date.parse('2026-11-20T21:00:00Z'))).toBe(true);
 expect(budgetIsCurrent('2026-11-21',Date.parse('2026-12-20T21:00:00Z'))).toBe(false);
 expect(taxiBudgetRange('İstanbul',[49.6],'YELLOW',Date.parse('2026-12-22T00:00:00Z'))).toBeNull();
 expect(taxiBudgetRange('Antalya',[49.6],'YELLOW',Date.parse('2026-11-20T12:00:00Z'))).toBeNull();
 expect(budgetIsCurrent('2026-02-30',Date.parse('2026-03-12'))).toBe(false);
 expect(budgetIsCurrent('',Date.parse('2026-03-12'))).toBe(false);
});
