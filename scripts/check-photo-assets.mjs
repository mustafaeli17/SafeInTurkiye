import {readFile,access} from 'node:fs/promises';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(process.argv[2]||'sharp');
const artwork=JSON.parse(await readFile('src/data/cityArtwork.json','utf8'));
const hero=JSON.parse(await readFile('src/data/heroPhoto.json','utf8'));
const directory=JSON.parse(await readFile('src/data/directoryPhotos.json','utf8'));
let checked=0;
const homeImages=[...hero.srcSet.split(',').map(candidate=>candidate.trim().split(/\s+/)[0]),hero.layers.ferry,'/photos/home-bosphorus-sky.webp'];
for(const src of [...artwork.flatMap(photo=>[photo.src,photo.thumbnail]),...homeImages]){
 if(!src.startsWith('/photos/')||src.includes('..'))throw Error('Unsafe photo path');
 await access('public'+src);await access('dist'+src);
 const metadata=await sharp('public'+src).metadata();await sharp('public'+src).raw().toBuffer();
 if(!metadata.width||!metadata.height)throw Error('Unreadable artwork');
 checked++;
}
for(const {section,author,source,license} of directory){
  if(!author||!source.startsWith('https://unsplash.com/photos/')||license!=='https://unsplash.com/license')throw Error('Missing photo provenance: '+section);
  for(const [suffix,width,height] of [['',1600,640],['-768',768,520]]){
    const src='/photos/directory/'+section+suffix+'.webp';
    await access('dist'+src);
    const image=sharp('public'+src);
    const metadata=await image.metadata();
    if(metadata.width!==width||metadata.height!==height||metadata.format!=='webp')throw Error('Invalid directory hero: '+src);
    await image.raw().toBuffer();
    checked++;
  }
}
console.log(`PASS: ${checked} active images decoded; source and build paths exist.`);
