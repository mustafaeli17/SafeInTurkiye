import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {searchLanguages,localizePath} from '../lib/searchLocales';
import {searchPagePaths,searchPage,searchPageSchema} from '../lib/searchPages';
import {publicCities,cityPath} from '../lib/publicRoutes';
const htmlCache=new Map<string,string>();
const read=(path:string)=>{let html=htmlCache.get(path);if(!html){html=readFileSync(`dist${path}/index.html`,'utf8');htmlCache.set(path,html);}return html;};
it('every public page has eight genuine translated variants with reciprocal alternates',()=>{
 expect(searchPagePaths).toHaveLength(27);
 for(const path of searchPagePaths)for(const lang of searchLanguages){
  const localized=localizePath(path,lang),html=read(localized==='/'?'':localized);
  expect(html).toContain('<html lang="'+lang+'"');
  expect(html).toContain('rel="canonical" href="https://www.safeinturkiye.com'+localized+'"');
  for(const other of searchLanguages)expect(html).toContain('hreflang="'+other+'" href="https://www.safeinturkiye.com'+localizePath(path,other)+'"');
  expect(html).toContain(searchPage(path,lang).description.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#x27;'));
  const schema=JSON.parse(html.match(/<script id="public-page-schema" type="application\/ld\+json">(.*?)<\/script>/s)![1]);
  expect(schema).toEqual(searchPageSchema(path,lang));
 }
});
it('uses natural localized city names without changing canonical slugs',()=>{
 for(const [lang,name] of [['es','Estambul'],['ru','Стамбул'],['ar','إسطنبول'],['zh','伊斯坦布尔']]){
  expect(searchPage('/cities/istanbul',lang).title).toContain(name);
  expect(localizePath('/cities/istanbul',lang)).toBe('/'+lang+'/cities/istanbul');
 }
});
it('all twelve existing city destinations have generated routes',()=>{
 expect(publicCities).toHaveLength(12);
 for(const city of publicCities)expect(read(cityPath(city.name))).toContain(`${city.name} Travel Guide`);
});
it('initial HTML links lead to real generated pages and each city retains its highlights',()=>{
 const known=new Set(searchPagePaths);
 for(const path of searchPagePaths)for(const lang of searchLanguages){
  const page=searchPage(path,lang);
  for(const link of page.links){
   const base=new URL(link.href,'https://www.safeinturkiye.com').pathname;
   expect(known.has(base.replace(/^\/(tr|de|fr|es|ar|ru|zh)(?=\/|$)/,'')||'/')).toBe(true);
   expect(read(base==='/'?'':base)).toContain('<h1');
  }
  if(page.city)expect(page.highlights.length).toBeGreaterThanOrEqual(2);
 }
});
it('sitemap contains only canonical generated variants and no fictional locales',()=>{
 const xml=readFileSync('dist/sitemap.xml','utf8');
 const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 expect(new Set(urls).size).toBe(urls.length);
 for(const url of urls){
  const path=new URL(url).pathname;
  expect(urls.length).toBeGreaterThanOrEqual(216);
  if(path!=='/')expect(path).not.toMatch(/\/$/);
  expect(read(path==='/'?'':path)).not.toContain('name="robots" content="noindex"');
 }
});
it('retired Turkish bookmarks retain Turkish on the permanent redirect',()=>{
 const config=JSON.parse(readFileSync('vercel.json','utf8'));
 const rows=config.redirects.filter((r:{source:string})=>r.source.startsWith('/tr/'));
 expect(rows).toHaveLength(91);
 for(const row of rows){expect(row.destination).toMatch(/^\/tr\/(hotels|restaurants|activities)(\?|$)/);expect(row.permanent).toBe(true);}
});
