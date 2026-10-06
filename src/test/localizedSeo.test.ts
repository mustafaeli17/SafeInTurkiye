import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {directory,entryPath} from '../lib/directory';
import {publicCities,cityPath} from '../lib/publicRoutes';
const read=(path:string)=>readFileSync(`dist${path}/index.html`,'utf8');
it('genuine Turkish detail pages have reciprocal alternates and self canonicals',()=>{
 for(const entry of directory.filter(e=>e.description.tr)){
  const path=entryPath(entry),en=read(path),tr=read('/tr'+path);
  for(const html of [en,tr]){
   expect(html).toContain(`hreflang="en" href="https://www.safeinturkiye.com${path}"`);
   expect(html).toContain(`hreflang="tr" href="https://www.safeinturkiye.com/tr${path}"`);
  }
  expect(tr).toContain('<html lang="tr"');
  expect(tr).toContain(`rel="canonical" href="https://www.safeinturkiye.com/tr${path}"`);
  const schema=JSON.parse(tr.match(/<script id="public-page-schema" type="application\/ld\+json">(.*?)<\/script>/s)![1]);
  expect(schema.description).toBe(entry.description.tr);
  expect(schema.url).toBe('https://www.safeinturkiye.com/tr'+path);
 }
});
it('all eleven existing city destinations have generated routes',()=>{
 expect(publicCities).toHaveLength(11);
 for(const city of publicCities)expect(read(cityPath(city.name))).toContain(`${city.name} Travel Guide`);
});
it('sitemap contains only canonical generated variants and no fictional locales',()=>{
 const xml=readFileSync('dist/sitemap.xml','utf8');
 const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 expect(new Set(urls).size).toBe(urls.length);
 for(const url of urls){
  const path=new URL(url).pathname;
  expect(path).not.toMatch(/^\/(de|fr|ar|ru|zh)\//);
  if(path!=='/')expect(path).not.toMatch(/\/$/);
  expect(read(path==='/'?'':path)).not.toContain('name="robots" content="noindex"');
 }
});
