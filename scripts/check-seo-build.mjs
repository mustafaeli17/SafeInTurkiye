import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/index.html','utf8');
assert(html.includes('<title>SafeInTürkiye — Your Guide to Türkiye</title>'));
assert(html.includes('name="description" content="Plan your trip to Türkiye with trusted local information on transport, taxi fares, exchange rates, restaurants, attractions, safety and more."'));
const graph=JSON.parse(html.match(/application\/ld\+json">(.*?)<\/script>/s)[1]);
assert.equal(graph['@graph'].length,2);
for(const f of ['favicon.ico','favicon.svg','favicon-96x96.png','apple-touch-icon.png','icon-192.png','icon-512.png','robots.txt','sitemap.xml','site.webmanifest','assets/safeinturkiye-logo-Cto9pALo.png']) assert(fs.statSync('dist/'+f).size>0);
for(const [file,size] of [['favicon-96x96.png',96],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]) {
 const png=fs.readFileSync('dist/'+file);assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
}
console.log('Final HTML, JSON-LD, icon dimensions and all SEO assets verified.');
