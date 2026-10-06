import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {directory,entryPath} from '../lib/directory';
import cities from '../data/cityGuides.json';
const html=(path:string)=>readFileSync(`dist${path==='/'?'':path}/index.html`,'utf8');
it('exposes published content and crawlable detail links without JavaScript',()=>{
 const home=html('/');
 expect(home).not.toContain('<div id="root"></div>');
 for(const entry of directory){
  const path=entryPath(entry),page=html(path);
  expect(home).toContain(`href="${path}"`);
  expect(page).toContain('<h1');
  expect(page).toContain('rel="canonical" href="https://www.safeinturkiye.com'+path+'"');
  expect(page).toContain('id="public-page-schema"');
  expect(page).not.toContain('<div id="root"></div>');
 }
});
it('generates one discoverable canonical page for each existing city route',()=>{
 const sitemap=readFileSync('dist/sitemap.xml','utf8');
 const locations=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 expect(new Set(locations).size).toBe(locations.length);
 for(const city of cities){
  const path='/cities/'+city.slug;
  expect(html(path)).toContain(`${city.name} Travel Guide | SafeInTürkiye`);
  expect(html('/')).toContain(`href="${path}"`);
  expect(locations).toContain('https://www.safeinturkiye.com'+path);
 }
 for(const url of locations){const path=new URL(url).pathname;expect(existsSync(`dist${path==='/'?'':path}/index.html`)).toBe(true);}
 expect(locations.some(url=>/admin|account|api\//.test(url))).toBe(false);
});
it('ships an explicit noindex error document, not in the sitemap',()=>{
 expect(readFileSync('dist/404.html','utf8')).toContain('name="robots" content="noindex"');
 expect(readFileSync('dist/sitemap.xml','utf8')).not.toContain('404');
});
