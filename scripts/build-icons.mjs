// Render the code-native SVG favicon. Usage: node scripts/build-icons.mjs <sharp module path>
import {createRequire} from 'node:module';
import {readFile, writeFile} from 'node:fs/promises';
const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || 'sharp');
const root = new URL('../public/', import.meta.url);
const svg = await readFile(new URL('favicon.svg', root));
for (const [size, name] of [[32,'favicon-32x32.png'],[48,'favicon-48x48.png'],[96,'favicon-96x96.png'],[180,'apple-touch-icon.png'],[192,'icon-192.png'],[512,'icon-512.png']]) {
 await sharp(svg).resize(size,size).png().toFile(new URL(name,root).pathname.replace(/^\/([A-Z]:)/i,'$1'));
}
const sizes=[16,32,48];
// Classic uncompressed BGRA DIB frames, including the legacy AND mask.
// Avoid requiring support for PNG-compressed ICO frames in small favicon sizes.
const frames=await Promise.all(sizes.map(async size=>{
 const rgba=await sharp(svg).resize(size,size).ensureAlpha().raw().toBuffer();
 const pixels=Buffer.alloc(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const src=(y*size+x)*4,dst=((size-1-y)*size+x)*4;
  pixels[dst]=rgba[src+2];pixels[dst+1]=rgba[src+1];pixels[dst+2]=rgba[src];pixels[dst+3]=rgba[src+3];
 }
 const mask=Buffer.alloc(Math.ceil(size/32)*4*size);
 const dib=Buffer.alloc(40);dib.writeUInt32LE(40,0);dib.writeInt32LE(size,4);dib.writeInt32LE(size*2,8);
 dib.writeUInt16LE(1,12);dib.writeUInt16LE(32,14);dib.writeUInt32LE(pixels.length+mask.length,20);
 return Buffer.concat([dib,pixels,mask]);
}));
const header=Buffer.alloc(6+16*frames.length);header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);
let offset=header.length;
frames.forEach((frame,i)=>{const p=6+i*16;header[p]=sizes[i];header[p+1]=sizes[i];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(frame.length,p+8);header.writeUInt32LE(offset,p+12);offset+=frame.length;});
await writeFile(new URL('favicon.ico',root),Buffer.concat([header,...frames]));
