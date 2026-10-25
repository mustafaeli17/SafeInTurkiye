import {writeFile} from 'node:fs/promises';
const base='https://www.safeinturkiye.com';
const sitemapResponse=await fetch(base+'/sitemap.xml');
const sitemap=await sitemapResponse.text();
const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
const results=[];
for(const url of [...new Set([...urls,base+'/does-not-exist-audit',base+'/hotels/not-a-real-hotel',base+'/hotels/efe-kusadasi',base+'/tr/hotels/efe-kusadasi',base+'/robots.txt',base+'/favicon.ico',base+'/favicon-96x96.png',base+'/site.webmanifest','https://safeinturkiye.com/'])]){
 const start=performance.now();
 const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)});const body=await r.text();
 const attr=(pattern)=>body.match(pattern)?.[1]??null;
 results.push({url,status:r.status,redirect:r.headers.get('location'),ms:Math.round(performance.now()-start),bytes:Buffer.byteLength(body),contentType:r.headers.get('content-type'),title:attr(/<title>(.*?)<\/title>/s),canonical:attr(/rel="canonical" href="([^"]+)"/),robots:attr(/name="robots" content="([^"]+)"/),h1s:(body.match(/<h1[ >]/g)||[]).length,hreflangs:[...body.matchAll(/hreflang="([^"]+)"/g)].map(m=>m[1]),headers:Object.fromEntries(['strict-transport-security','content-security-policy','x-frame-options','x-content-type-options','referrer-policy','cache-control','permissions-policy'].map(h=>[h,r.headers.get(h)])),...(url.endsWith('robots.txt')?{body}:{})});
}
const probes=[];
for(const path of ['/api/places?lat=no&lng=29&category=restaurant&lang=en','/api/viator?city=invalid&lang=en','/api/reference-rates','/api/assistant']){
 const r=await fetch(base+path,{signal:AbortSignal.timeout(20000)});const body=await r.text();
 probes.push({path,status:r.status,contentType:r.headers.get('content-type'),body:body.slice(0,500)});
}
await writeFile(new URL('./http-results.json',import.meta.url),JSON.stringify({baseline:'924674c',checkedAt:new Date().toISOString(),sitemapCount:urls.length,results,probes},null,2));
console.log(JSON.stringify({sitemapCount:urls.length,statuses:results.map(({url,status,redirect,h1s,canonical,robots})=>({url,status,redirect,h1s,canonical,robots})),probes},null,2));
