import {expect,it} from 'vitest';
import {taxiBudgetRange} from '../lib/taxiBudget';
it('uses the Istanbul tariff rechecked against ITEO on 10 November for the airport route',()=>{
 const now=Date.parse('2026-11-10T12:00:00Z');
 expect(taxiBudgetRange('İstanbul',[49.6],'YELLOW',now)).toMatchObject({amount:2440,upper:2450,source:'İstanbul · 2026-11-10'});
 expect(taxiBudgetRange('İstanbul',[0.5],'YELLOW',now)).toMatchObject({amount:230,upper:230});
 expect(taxiBudgetRange('İstanbul',[49.6],'YELLOW',Date.parse('2026-12-11T00:00:00Z'))).toBeNull();
 expect(taxiBudgetRange('Antalya',[49.6],'YELLOW',now)).toBeNull();
});
