import {describe,it,expect} from 'vitest';
import {readFileSync, existsSync} from 'node:fs';
import {homeDescription,homeTitle,sectionSeo} from '../lib/seo';
describe('SEO and real public assets',()=>{
 it('ships homepage metadata before JavaScript renders',()=>{
  const html=readFileSync('index.html','utf8');
  expect(html).toContain(`<title>${homeTitle}</title>`);
  expect(html).toContain(`name="description" content="${homeDescription}"`);
  expect(html).toContain('rel="canonical" href="https://www.safeinturkiye.com/"');
  const schema=JSON.parse(html.match(/application\/ld\+json">(.*?)<\/script>/s)![1]);
  expect(schema['@graph'].map((item:{'@type':string})=>item['@type'])).toEqual(['WebSite','Organization']);
  for(const item of schema['@graph']) expect(item.name).toBe('SafeInTürkiye');
 });
 it('ships real favicon variants, manifest, sitemap and robots',()=>{
  for(const file of ['favicon.svg','favicon.ico','favicon-96x96.png','apple-touch-icon.png','icon-192.png','icon-512.png','robots.txt','sitemap.xml','site.webmanifest']) expect(existsSync('public/'+file)).toBe(true);
  const ico=readFileSync('public/favicon.ico');expect(ico.readUInt16LE(2)).toBe(1);expect(ico.readUInt16LE(4)).toBe(3);
  const sitemap=readFileSync('public/sitemap.xml','utf8');expect(sitemap.match(/<loc>/g)).toHaveLength(1);
  expect(readFileSync('public/robots.txt','utf8')).toContain('Sitemap: https://www.safeinturkiye.com/sitemap.xml');
 });
 it('gives existing sections distinct titles without inventing routes',()=>{
  const keys=['home','taxi','transit','currency','nearme','stay','food','experiences','safety','assistant','city'];
  expect(new Set(keys.map(key=>sectionSeo(key,'Ankara').title)).size).toBe(keys.length);
  expect(sectionSeo('home','Ankara').description).toBe(homeDescription);
  expect(sectionSeo('city','Ankara').title).toContain('Ankara');
 });
});
