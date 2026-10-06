import {writeFile} from 'node:fs/promises';
const origin=new URL(process.argv[2]);
if(origin.protocol!=='https:'||!origin.hostname.endsWith('.vercel.app'))throw Error('Pass an HTTPS Vercel preview origin');
const paths=['/','/cities/istanbul','/cities/aydin','/hotels/efe-kusadasi','/hotels/efe-kusadasi/','/tr/hotels/efe-kusadasi','/restaurants/beyti-florya','/activities/topkapi-palace','/cities/nonexistent-city','/hotels/nonexistent-hotel','/this-page-does-not-exist','/robots.txt','/sitemap.xml'];
const results=[];
for(const path of paths){
 const requested=new URL(path,origin).href;
 const response=await fetch(requested,{redirect:'manual',signal:AbortSignal.timeout(15000)});
 const location=response.headers.get('location');
 const html=await response.text();
 const blocked=Boolean(location?.includes('vercel.com/sso-api'));
 results.push({requested,status:response.status,finalUrl:blocked?null:response.url,redirect:location?new URL(location,origin).origin+new URL(location,origin).pathname:null,blockedByAuthentication:blocked,canonical:html.match(/rel="canonical" href="([^"]+)"/)?.[1]??null,title:html.match(/<title>(.*?)<\/title>/s)?.[1]??null,bodyExcerpt:blocked?null:html.match(/<main[^>]*>(.*?)<\/main>/s)?.[1]?.replace(/<[^>]*>/g,' ').slice(0,240)??null});
}
await writeFile('PHASE2-PREVIEW-HTTP.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
console.log(JSON.stringify({requests:results.length,authenticationBlocked:results.filter(r=>r.blockedByAuthentication).length}));
