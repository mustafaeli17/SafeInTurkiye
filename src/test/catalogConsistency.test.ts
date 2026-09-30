import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {curatedDirectory,directoryEntry,entryPath} from '../lib/directory';
import cities from '../data/cityGuides.json';
describe('built editorial catalog consistency (requires a production build)',()=>{
 it('has exactly the published entity set in sitemap, with no archive orphans',()=>{
  const xml=readFileSync('dist/sitemap.xml','utf8');
  const actual=[...xml.matchAll(/<loc>https:\/\/www.safeinturkiye.com([^<]*)<\/loc>/g)].map(m=>m[1]).sort();
  const expected=['/',...curatedDirectory.map(entryPath),...cities.map(c=>`/cities/${c.slug}`)].sort();
  expect(actual).toEqual(expected);
 });
 it('resolves every published detail and produces its own HTML metadata',()=>{
  for(const entry of curatedDirectory){
   const path=entryPath(entry);expect(directoryEntry(path)?.id).toBe(entry.id);
   const file=`dist${path}/index.html`;expect(existsSync(file)).toBe(true);
   expect(readFileSync(file,'utf8')).toContain(`https://www.safeinturkiye.com${path}`);
  }
 });
 it('does not resolve missing or retired editorial detail routes',()=>{
  expect(directoryEntry('/hotels/does-not-exist')).toBeUndefined();
  expect(directoryEntry('/hotels/colossae-pamukkale')).toBeUndefined();
 });
});
