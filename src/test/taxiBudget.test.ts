import {expect,it} from 'vitest';
import cityGuides from '../data/cityGuides.json';
import {taxiBudgetRange,taxiBudgets} from '../lib/taxiBudget';

it.each(['İstanbul','Antalya','Nevşehir','Ankara','İzmir',...cityGuides.map(c=>c.name)])('%s returns a sourced standard-taxi budget without CMS data',city=>{
 const result=taxiBudgetRange(city,[10,12]);
 expect(result).not.toBeNull();
 expect(result!.amount).toBeGreaterThan(0);
 expect(result!.upper).toBeGreaterThanOrEqual(result!.amount);
 expect(result!.sourceUrls.every(url=>new URL(url).protocol==='https:')).toBe(true);
 expect(result!.amount%10).toBe(0);
});
it('does not borrow from another province or invent premium class prices',()=>{
 expect(taxiBudgetRange('Kayseri',[10])).toBeNull();
 expect(taxiBudgetRange('Unknown',[10])).toBeNull();
 expect(taxiBudgetRange('Ankara',[10],'BLACK')).toBeNull();
});
it('uses Trabzon tiered distance rate and minimum',()=>{
 expect(taxiBudgetRange('Trabzon',[10])).toMatchObject({amount:610,upper:620});
 expect(taxiBudgetRange('Trabzon',[1])).toMatchObject({amount:200,upper:210});
});
it('uses published regional samples rather than a fabricated percentage',()=>{
 expect(taxiBudgetRange('Aydın',[10])).toMatchObject({amount:600,upper:690});
 expect(taxiBudgetRange('Antalya',[10])).toMatchObject({amount:540,upper:550});
 expect(taxiBudgetRange('Ankara',[10])).toMatchObject({amount:460,upper:470});
});
it('rejects invalid route distances and keeps estimates separate from verified records',()=>{
 for(const distances of [[],[0],[-1],[NaN],[Infinity]])expect(()=>taxiBudgetRange('Ankara',distances)).toThrow();
 expect(Object.values(taxiBudgets).every(record=>!('verification_status' in record))).toBe(true);
});
