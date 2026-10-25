import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {curatedDirectory,directoryEntry,entryPath} from '../lib/directory';
import {publicCities as cities} from '../lib/publicRoutes';
import sections from '../data/sectionRoutes.json';
import retired from '../data/retiredDirectory.json';
describe('built editorial catalog consistency (requires a production build)',()=>{
 it('has exactly the published entity set in sitemap, with no archive orphans',()=>{
  const xml=readFileSync('dist/sitemap.xml','utf8');
  const actual=[...xml.matchAll(/<loc>https:\/\/www.safeinturkiye.com([^<]*)<\/loc>/g)].map(m=>m[1]).sort();
  const expected=['/',...Object.values(sections).map(s=>s.path),'/privacy','/terms','/about','/contact',...curatedDirectory.map(entryPath),...curatedDirectory.filter(entry=>entry.description.tr).map(entry=>'/tr'+entryPath(entry)),...cities.map(c=>`/cities/${c.slug}`)].sort();
  expect(actual).toEqual(expected);
 });
 it('keeps provider discovery pages while the pre-API catalog stays empty',()=>{
  expect(curatedDirectory).toEqual([]);
  for(const kind of ['hotels','restaurants','activities'])expect(readFileSync(`dist/${kind}/index.html`,'utf8')).toContain(`https://www.safeinturkiye.com/${kind}`);
 });
 it('does not resolve missing or retired editorial detail routes',()=>{
  expect(directoryEntry('/hotels/does-not-exist')).toBeUndefined();
  expect(directoryEntry('/hotels/colossae-pamukkale')).toBeUndefined();
  const sitemap=readFileSync('dist/sitemap.xml','utf8');
  const config=JSON.parse(readFileSync('vercel.json','utf8'));
  for(const {kind,slug} of retired){
   const path=`/${kind}/${slug}`;
   expect(directoryEntry(path)).toBeUndefined();
   expect(sitemap).not.toContain(path+'<');
   expect(existsSync(`dist${path}/index.html`)).toBe(false);
   expect(config.redirects.some((r:{source:string;permanent:boolean})=>r.source===path&&r.permanent)).toBe(true);
  }
 });
});
