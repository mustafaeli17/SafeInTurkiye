// Render the code-native SVG favicon. Usage: node scripts/build-icons.mjs <sharp module path>
import {createRequire} from 'node:module';
import {readFile, writeFile} from 'node:fs/promises';
const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || 'sharp');
const root = new URL('../public/', import.meta.url);
const svg = await readFile(new URL('favicon.svg', root));
for (const [size, name] of [[96,'favicon-96x96.png'],[180,'apple-touch-icon.png'],[192,'icon-192.png'],[512,'icon-512.png']]) {
 await sharp(svg).resize(size,size).png().toFile(new URL(name,root).pathname.replace(/^\/([A-Z]:)/i,'$1'));
}
const sizes=[16,32,48];
const frames=await Promise.all(sizes.map(size=>sharp(svg).resize(size,size).png().toBuffer()));
const header=Buffer.alloc(6+16*frames.length);header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);
let offset=header.length;
frames.forEach((frame,i)=>{const p=6+i*16;header[p]=sizes[i];header[p+1]=sizes[i];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(frame.length,p+8);header.writeUInt32LE(offset,p+12);offset+=frame.length;});
await writeFile(new URL('favicon.ico',root),Buffer.concat([header,...frames]));
