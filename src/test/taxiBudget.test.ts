import {expect,it} from 'vitest';
import {taxiBudgetRange,taxiBudgets} from '../lib/taxiBudget';
import {searchDestinations} from '../lib/searchDestinations';

const now = Date.parse('2026-11-21T12:00:00Z');
const fare = (city:string, km:number[], district?:string) => taxiBudgetRange(city, km, 'YELLOW', now, district);

it.each([
 ['İstanbul',550], ['Ankara',470], ['Antalya',540,'Muratpaşa'], ['Nevşehir',700],
 ['İzmir',580,'Konak'], ['Muğla',780], ['Aydın',610,'Efeler'], ['Denizli',630],
 ['Trabzon',770], ['Bursa',620], ['Konya',560], ['Gaziantep',550],
] as [string,number,string?][])('%s gives one local standard-taxi estimate for one 10 km route', (city, amount, district) => {
 const result = fare(city,[10],district);
 expect(result).toMatchObject({amount,upper:amount,hasRange:false});
 expect(result!.sourceUrls.every(url=>new URL(url).protocol==='https:')).toBe(true);
});
it('covers every advertised destination by its departure province',()=>{
 const districtProvinces:Record<string,string> = {Cappadocia:'Nevşehir',Bodrum:'Muğla','Kuşadası':'Aydın',Didim:'Aydın',Pamukkale:'Denizli','Çeşme':'İzmir','Alaçatı':'İzmir'};
 const provinces = new Set(Object.keys(searchDestinations).map(city => districtProvinces[city] ?? city));
 provinces.add('Kayseri'); // A second, separately priced airport gateway for Cappadocia.
 expect(Object.keys(taxiBudgets).sort()).toEqual([...provinces].sort());
});
it('uses only the province and class of the starting point',()=>{
 for (const city of ['Sivas','Unknown','']) expect(fare(city,[10])).toBeNull();
 expect(fare('Kayseri',[1])).toMatchObject({amount:225,upper:225,minimumFare:225});
 expect(fare('Kayseri',[10])).toMatchObject({amount:730,hasRange:false});
 expect(fare('Nevşehir',[10])).toMatchObject({amount:700,hasRange:false});
 expect(taxiBudgetRange('Ankara',[10],'BLACK',now)).toBeNull();
});
it('uses Gaziantep opening, distance and minimum without arbitrary surcharges',()=>{
 expect(fare('Gaziantep',[1])).toMatchObject({amount:200,upper:200,minimumFare:200});
 expect(fare('Gaziantep',[10,12])).toMatchObject({amount:550,upper:650,hasRange:true});
});
it('applies Trabzon distance bands and its short-trip minimum',()=>{
 expect(fare('Trabzon',[5])).toMatchObject({amount:460,upper:460});
 expect(fare('Trabzon',[1])).toMatchObject({amount:260,upper:260});
});
it('honours tariff districts and bounds the estimate if the provider omitted the district',()=>{
 expect(fare('İzmir',[1],'Çeşme')).toMatchObject({amount:310,minimumFare:310});
 expect(fare('İzmir',[1],'Karaburun')).toMatchObject({amount:280});
 expect(fare('İzmir',[10],'Tire')).toMatchObject({amount:740});
 expect(fare('İzmir',[1],'Konak')).toMatchObject({amount:210,minimumFare:210});
 expect(fare('Aydın',[1],'Kuşadası')).toMatchObject({amount:240});
 expect(fare('Aydın',[1],'Didim')).toMatchObject({amount:240});
 expect(fare('Aydın',[10])).toMatchObject({amount:600,upper:690,hasRange:true});
 expect(fare('Antalya',[10],'Alanya')).toMatchObject({amount:760});
 expect(fare('Antalya',[10])).toMatchObject({amount:540,upper:760,hasRange:true});
});
it('rejects invalid distances, stale rates and unsupported classes',()=>{
 for(const distances of [[],[0],[-1],[NaN],[Infinity]]) expect(()=>fare('Ankara',distances)).toThrow();
 expect(taxiBudgetRange('Ankara',[10],'YELLOW',Date.parse('2026-12-23'))).toBeNull();
 expect(Object.values(taxiBudgets).every(record=>!('verification_status' in record))).toBe(true);
});
