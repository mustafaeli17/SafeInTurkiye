import {readFile,writeFile,mkdir} from 'node:fs/promises';
const entries=JSON.parse(await readFile('src/data/directory.json','utf8'));
const publication=JSON.parse(await readFile('src/data/photoPublication.json','utf8'));
const alternatives=JSON.parse(await readFile('src/data/photoAlternatives.json','utf8'));
const regionalHotels=JSON.parse(await readFile('src/data/regionalHotels.json','utf8'));
entries.push(...regionalHotels.map(hotel=>({...hotel,kind:'hotels'})));
const restaurants=JSON.parse(await readFile('src/data/regionalRestaurants.json','utf8'));
entries.push(...restaurants.map(restaurant=>({...restaurant,kind:'restaurants'})));
const cities=JSON.parse(await readFile('src/data/cityGuides.json','utf8'));
const originalCities=JSON.parse(await readFile('src/data/originalCityRoutes.json','utf8'));
const activities=JSON.parse(await readFile('src/data/regionalActivities.json','utf8'));
entries.push(...activities.map(activity=>({...activity,kind:'activities',website:cities.find(city=>city.name===activity.city).source})));
entries.push(...alternatives);
const cinemas=JSON.parse(await readFile('src/data/cinemas.json','utf8'));
entries.push(...cinemas.map(cinema=>({...cinema,kind:'activities',description:{en:'Check current films, screening times and languages on the cinema’s official page. Ticket purchases take place on the operator’s website.',tr:'Güncel filmleri, seansları ve gösterim dilini sinemanın resmî sayfasından kontrol edin. Bilet işlemleri işletmenin sitesinde yapılır.'}})));
for(let i=entries.length-1;i>=0;i--)if(!publication.galleries[entries[i].id||entries[i].slug]?.length)entries.splice(i,1);
entries.push(...[...originalCities,...cities].map(city=>({kind:'cities',slug:city.slug,name:city.name,description:city.description,website:city.source})));
const base=await readFile('dist/index.html','utf8');
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const origin='https://www.safeinturkiye.com';
const locations=[origin+'/'];
const routeFor=entry=>`/${entry.kind}/${entry.slug}`;
const linkFor=entry=>`<a href="${routeFor(entry)}">${escape(entry.name)}</a>`;
const safeExternal=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?escape(url.href):null;}catch{return null;}};
const publicPaths=new Set();
for(const entry of entries){
 if(!['cities','hotels','restaurants','activities'].includes(entry.kind)||!/^[a-z0-9-]+$/.test(entry.slug))throw Error('Invalid directory path');
 const path=`/${entry.kind}/${entry.slug}`,url=origin+path;
 if(publicPaths.has(path))throw Error(`Duplicate public path: ${path}`);
 publicPaths.add(path);
 const title=escape(`${entry.name}${entry.kind==='cities'?' Travel Guide':''} | SafeInTürkiye`),description=escape(entry.description.en);
 let html=base.replace(/<title>.*?<\/title>/,`<title>${title}</title>`)
  .replace(/(<meta name="description" content=")[^"]*/,`$1${description}`)
  .replace(/(<link rel="canonical" href=")[^"]*/,`$1${url}`)
  .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*/g,`$1${title}`)
  .replace(/(<meta (?:property="og:description"|name="twitter:description") content=")[^"]*/g,`$1${description}`)
  .replace(/(<meta property="og:url" content=")[^"]*/,`$1${url}`);
 const website=safeExternal(entry.website);
 const schema={'@context':'https://schema.org','@type':entry.kind==='hotels'?'Hotel':entry.kind==='restaurants'?'Restaurant':entry.kind==='cities'?'TouristDestination':'Place',name:entry.name,url,description:entry.description.en,...(website?{sameAs:entry.website}:{}),...(entry.address?{address:entry.address}:{}),...(entry.phone?{telephone:entry.phone}:{})};
 html=html.replace(/<script type="application\/ld\+json">.*?<\/script>/s,`<script id="public-page-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`);
 // Visible content for everyone before JS loads, not crawler-only or hidden text.
 // React replaces this progressive fallback with the existing interactive page.
 const related=entries.filter(other=>other!==entry&&(entry.kind==='cities'?other.city===entry.name:other.city===entry.city));
 const relatedGroups=['hotels','restaurants','activities'].map(kind=>{
  const items=related.filter(other=>other.kind===kind);
  return items.length?`<section><h2>${({hotels:'Hotels',restaurants:'Restaurants',activities:'Activities'})[kind]}</h2><ul>${items.map(other=>`<li>${linkFor(other)}</li>`).join('')}</ul></section>`:'';
 }).join('');
 const body=`<main class="max-w-5xl mx-auto px-4 py-8 space-y-6"><nav aria-label="Breadcrumb"><a href="/">SafeInTürkiye</a> / ${escape(entry.name)}</nav><h1 class="text-3xl font-extrabold">${escape(entry.name)}</h1><p>${description}</p>${entry.address?`<p>${escape(entry.address)}</p>`:''}${entry.phone?`<p>${escape(entry.phone)}</p>`:''}${website?`<p><a href="${website}" rel="noopener noreferrer">Official website</a></p>`:''}${relatedGroups}</main>`;
 html=html.replace('<div id="root"></div>',`<div id="root">${body}</div>`);
 const translated=entry.kind!=='cities'&&entry.description.tr;
 const alternates=translated?`<link rel="alternate" hreflang="en" href="${url}"><link rel="alternate" hreflang="tr" href="${origin}/tr${path}"><link rel="alternate" hreflang="x-default" href="${url}">`:'';
 html=html.replace('</head>',`${alternates}</head>`);
 await mkdir(`dist${path}`,{recursive:true});await writeFile(`dist${path}/index.html`,html);locations.push(url);
 if(translated){
  const trUrl=`${origin}/tr${path}`;
  const trDescription=escape(entry.description.tr);
  const trBody=`<main class="max-w-5xl mx-auto px-4 py-8 space-y-6"><nav aria-label="Gezinme"><a href="/">SafeInTürkiye</a></nav><h1 class="text-3xl font-extrabold">${escape(entry.name)}</h1><p>${trDescription}</p>${entry.address?`<p>${escape(entry.address)}</p>`:''}${entry.phone?`<p>${escape(entry.phone)}</p>`:''}${website?`<a href="${website}">Resmî site / rezervasyon</a>`:''}<nav aria-label="Dil"><a href="${path}" hreflang="en">English</a> <a href="/tr${path}" hreflang="tr">Türkçe</a></nav></main>`;
  let trHtml=html.replace(/<html lang="[^"]*"/, '<html lang="tr"')
   .replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*/g,`$1${trDescription}`)
   .replace(/(<link rel="canonical" href=")[^"]*/,`$1${trUrl}`)
   .replace(/(<meta property="og:url" content=")[^"]*/,`$1${trUrl}`)
   .replace(/<script id="public-page-schema" type="application\/ld\+json">.*?<\/script>/s,`<script id="public-page-schema" type="application/ld+json">${JSON.stringify({...schema,url:trUrl,description:entry.description.tr}).replaceAll('<','\\u003c')}</script>`)
   .replace(`<div id="root">${body}</div>`,`<div id="root">${trBody}</div>`);
  await mkdir(`dist/tr${path}`,{recursive:true});await writeFile(`dist/tr${path}/index.html`,trHtml);locations.push(trUrl);
 }
}
const homeBody=`<main class="max-w-5xl mx-auto px-4 py-8 space-y-6"><h1 class="text-3xl font-extrabold">Türkiye, made easier.</h1><p>Practical local information for a safer, smarter and more enjoyable trip.</p><nav aria-label="Destinations"><h2>City guides</h2><ul>${entries.filter(entry=>entry.kind==='cities').map(entry=>`<li>${linkFor(entry)}</li>`).join('')}</ul></nav>${['hotels','restaurants','activities'].map(kind=>`<section><h2>${({hotels:'Hotels',restaurants:'Restaurants',activities:'Activities'})[kind]}</h2><ul>${entries.filter(entry=>entry.kind===kind).map(entry=>`<li>${linkFor(entry)}</li>`).join('')}</ul></section>`).join('')}</main>`;
await writeFile('dist/index.html',base.replace('<div id="root"></div>',`<div id="root">${homeBody}</div>`));
// Static-host 404 body; not a catch-all rewrite to a successful homepage.
await writeFile('dist/404.html',`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | SafeInTürkiye</title></head><body><main><a href="/">SafeInTürkiye</a><h1>Page not found</h1><p>This address does not match a public page.</p><a href="/">Back to SafeInTürkiye</a></main></body></html>`);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations.map(url=>`<url><loc>${url}</loc></url>`).join('')}</urlset>`);
console.log(`Built ${entries.length} directory pages with unique metadata and sitemap entries.`);
