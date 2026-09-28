import {readFile,access} from 'node:fs/promises';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(process.argv[2]||'sharp');
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const licensed=await read('src/lib/placePhotos.json');
const official=await read('src/lib/officialPhotos.json');
let checked=0;
for(const [id,photo] of Object.entries({...licensed,...official})){
 for(const src of [photo.src,photo.thumbnail].filter(Boolean)){
  if(!src.startsWith('/photos/')||src.includes('..'))throw Error(`Unsafe photo path: ${id}`);
  await access(`public${src}`);await access(`dist${src}`);
  const metadata=await sharp(`public${src}`).metadata();
  await sharp(`public${src}`).raw().toBuffer();
  if(!metadata.width||!metadata.height)throw Error(`Unreadable photo: ${id}`);
  checked++;
 }
}
const entries=[...await read('src/data/directory.json'),...await read('src/data/regionalHotels.json'),...await read('src/data/regionalRestaurants.json'),...await read('src/data/regionalActivities.json')];
const missing=entries.filter(entry=>!(entry.gallery?.some(id=>licensed[id])||(['koza-han','karatay-tile-museum'].includes(entry.slug)&&licensed[entry.slug])||official[entry.id]));
console.log(`PASS: ${checked} image files decoded; public and production build paths exist.`);
console.log(`MISSING CONTENT: ${missing.length}/${entries.length} entries have no registered photograph.`);
for(const entry of missing)console.log(`${entry.city}: ${entry.name}`);
const contextCities=new Set(['İstanbul','Ankara','İzmir','Antalya','Cappadocia','Kapadokya','Muğla','Aydın','Denizli','Trabzon','Konya','Bursa','Kayseri']);
const uncovered=missing.filter(entry=>!contextCities.has(entry.city));
console.log(`Context coverage: ${missing.length-uncovered.length} explicitly labelled city images; ${uncovered.length} uncovered entries.`);
if(uncovered.length||(!process.argv.includes('--allow-city-context')&&missing.length))process.exitCode=2;
