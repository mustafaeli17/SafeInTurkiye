import {readFile,access} from 'node:fs/promises';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(process.argv[2]||'sharp');
const artwork=JSON.parse(await readFile('src/data/cityArtwork.json','utf8'));
const hero=JSON.parse(await readFile('src/data/heroPhoto.json','utf8'));
let checked=0;
for(const src of [...artwork.flatMap(photo=>[photo.src,photo.thumbnail]),hero.src]){
 if(!src.startsWith('/photos/')||src.includes('..'))throw Error('Unsafe photo path');
 await access('public'+src);await access('dist'+src);
 const metadata=await sharp('public'+src).metadata();await sharp('public'+src).raw().toBuffer();
 if(!metadata.width||!metadata.height)throw Error('Unreadable artwork');
 checked++;
}
console.log(`PASS: ${checked} active images decoded; source and build paths exist.`);
