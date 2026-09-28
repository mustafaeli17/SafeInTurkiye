import {readFile,writeFile,mkdir} from 'node:fs/promises';
const entries=JSON.parse(await readFile('src/data/directory.json','utf8'));
const regionalHotels=JSON.parse(await readFile('src/data/regionalHotels.json','utf8'));
entries.push(...regionalHotels.map(hotel=>({...hotel,kind:'hotels'})));
const restaurants=JSON.parse(await readFile('src/data/regionalRestaurants.json','utf8'));
entries.push(...restaurants.map(restaurant=>({...restaurant,kind:'restaurants'})));
const cities=JSON.parse(await readFile('src/data/cityGuides.json','utf8'));
const activities=JSON.parse(await readFile('src/data/regionalActivities.json','utf8'));
entries.push(...activities.map(activity=>({...activity,kind:'activities',website:cities.find(city=>city.name===activity.city).source})));
entries.push(...cities.map(city=>({kind:'cities',slug:city.slug,name:city.name,description:city.description,website:city.source})));
const base=await readFile('dist/index.html','utf8');
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const origin='https://www.safeinturkiye.com';
const locations=[origin+'/'];
for(const entry of entries){
 if(!['cities','hotels','restaurants','activities'].includes(entry.kind)||!/^[a-z0-9-]+$/.test(entry.slug))throw Error('Invalid directory path');
 const path=`/${entry.kind}/${entry.slug}`,url=origin+path;
 const title=escape(`${entry.name} | SafeInTürkiye`),description=escape(entry.description.en);
 let html=base.replace(/<title>.*?<\/title>/,`<title>${title}</title>`)
  .replace(/(<meta name="description" content=")[^"]*/,`$1${description}`)
  .replace(/(<link rel="canonical" href=")[^"]*/,`$1${url}`)
  .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*/g,`$1${title}`)
  .replace(/(<meta (?:property="og:description"|name="twitter:description") content=")[^"]*/g,`$1${description}`)
  .replace(/(<meta property="og:url" content=")[^"]*/,`$1${url}`);
 const schema={'@context':'https://schema.org','@type':entry.kind==='hotels'?'Hotel':entry.kind==='restaurants'?'Restaurant':'Place',name:entry.name,url,description:entry.description.en,sameAs:entry.website,...(entry.address?{address:entry.address}:{}),...(entry.phone?{telephone:entry.phone}:{})};
 html=html.replace(/<script type="application\/ld\+json">.*?<\/script>/s,`<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`);
 await mkdir(`dist${path}`,{recursive:true});await writeFile(`dist${path}/index.html`,html);locations.push(url);
}
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations.map(url=>`<url><loc>${url}</loc></url>`).join('')}</urlset>`);
console.log(`Built ${entries.length} directory pages with unique metadata and sitemap entries.`);
