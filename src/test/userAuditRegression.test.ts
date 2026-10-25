import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import routes from '../data/sectionRoutes.json';
import {sectionFromPath,sectionPath,transferIntent} from '../lib/sectionNavigation';
import {parseGooglePlaces} from '../services/googleNearby';
import {cityDisplayName,cityLocale} from '../lib/cityLocale';
import {sectionSeo} from '../lib/seo';
import {validBookingTime} from '../lib/bookingTime';
describe('User audit regressions',()=>{
 it('rejects past visits using Türkiye time, including the next-day boundary',()=>{
  const now=Date.parse('2030-01-01T22:00:00Z');
  expect(validBookingTime('2030-01-02','00:30',now)).toBe(false);
  expect(validBookingTime('2030-01-02','01:30',now)).toBe(true);
  expect(validBookingTime('2030-02-30','12:00',now)).toBe(false);
 });
 it.each(Object.entries(routes))('provides a stable address for %s',(key,route)=>{
  expect(sectionFromPath(route.path+'/')).toBe(key);
  expect(sectionPath(key as keyof typeof routes)).toBe(route.path);
  const html=readFileSync(`dist${route.path}/index.html`,'utf8');
  expect(html).toContain(`https://www.safeinturkiye.com${route.path}`);
  expect(readFileSync('dist/sitemap.xml','utf8')).toContain(`https://www.safeinturkiye.com${route.path}`);
 });
 it.each(['airport transfer','havalimanı transfer','traslado','трансфер','机场接送'])('recognises transfer intent: %s',q=>expect(transferIntent(q)).toBe(true));
 it('excludes parent hotels and malls, keeps actual restaurant records',()=>{
  const p={id:'restaurant',displayName:{text:'Restaurant'},location:{latitude:41,longitude:29},types:['restaurant'],googleMapsUri:'https://maps.google.com/?cid=1'};
  const found=parseGooglePlaces({places:[p,{...p,id:'hotel',primaryType:'hotel'},{...p,id:'mall',primaryType:'shopping_mall'},{...p,id:'inside',primaryType:'turkish_restaurant',types:['restaurant','food']}]},{lat:41,lng:29},'restaurant');
  expect(found.places.map(x=>x.name)).toHaveLength(2);
 });
 it('localises Turkish Cappadocia and German/Arabic Antalya',()=>{
  expect(cityDisplayName('Cappadocia','tr')).toBe('Kapadokya');
  expect(sectionSeo('city','Antalya','tr').title).toContain('Gezi Rehberi');
  expect(cityLocale('Antalya','de')).not.toEqual(cityLocale('Antalya','ar'));
 });
});
