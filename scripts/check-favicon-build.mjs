import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/index.html','utf8');
const links=html.match(/<link\b[^>]+>/g).filter(tag=>/rel="(?:icon|apple-touch-icon|manifest)"/.test(tag));
assert.equal(links.length,6);
for(const tag of links){
 const href=tag.match(/href="([^"]+)"/)[1];
 assert(href.endsWith('?v=blue-crescent-1'));
 assert(fs.statSync('dist'+href.split('?')[0]).size>0);
}
for(const [file,size] of [['favicon-32x32.png',32],['favicon-48x48.png',48],['favicon-96x96.png',96],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]){
 const png=fs.readFileSync('dist/'+file);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
 assert(png.equals(fs.readFileSync('public/'+file)));
}
const ico=fs.readFileSync('dist/favicon.ico');
assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
for(const [i,size] of [16,32,48].entries()){
 const entry=6+i*16,offset=ico.readUInt32LE(entry+12),length=ico.readUInt32LE(entry+8);
 assert.equal(ico[entry],size);assert.equal(ico[entry+1],size);
 assert(offset+length<=ico.length);assert.equal(ico.readUInt32LE(offset),40);
 assert.equal(ico.readInt32LE(offset+4),size);assert.equal(ico.readInt32LE(offset+8),size*2);
 assert.equal(ico.readUInt16LE(offset+14),32);
}
const manifest=JSON.parse(fs.readFileSync('dist/site.webmanifest','utf8'));
for(const icon of manifest.icons){
 assert.equal(icon.type,'image/png');
 const png=fs.readFileSync('dist'+icon.src.split('?')[0]);
 assert.equal(icon.sizes,`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`);
}
console.log('PASS: final head, all favicon paths, 6 PNG dimensions, 3 ICO DIB frames and manifest icons.');
