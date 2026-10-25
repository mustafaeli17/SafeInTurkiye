import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
const manifest=JSON.parse(fs.readFileSync('dist/.vite/manifest.json','utf8'));
const entry=Object.entries(manifest).find(([,item])=>item.isEntry);
assert(entry,'Missing build entry');
const initial=new Set();
function visit(key){if(initial.has(key))return;initial.add(key);for(const dependency of manifest[key].imports??[])visit(dependency);}
visit(entry[0]);
let bytes=0,gzip=0;
for(const key of initial){const file=manifest[key].file;if(!file.endsWith('.js'))continue;const buffer=fs.readFileSync(path.join('dist',file));bytes+=buffer.length;gzip+=gzipSync(buffer).length;}
const assets=fs.readdirSync('dist/assets').filter(file=>file.endsWith('.js'));
const largest=Math.max(...assets.map(file=>fs.statSync(path.join('dist/assets',file)).size));
// Count all statically imported chunks, not just index.js. Splitting is not a
// reason to claim a smaller cold-load download or hide a regression.
assert(bytes<650000,`Initial JS budget exceeded: ${bytes}`);
assert(largest<500000,`Single JS chunk budget exceeded: ${largest}`);
assert(![...initial].some(key=>key.includes('leaflet')||key.includes('TaxiRouteMap')),'Taxi map must remain lazy');
console.log(JSON.stringify({initialJsBytes:bytes,initialGzipBytes:gzip,largestChunkBytes:largest,initialChunks:[...initial].map(key=>manifest[key].file)},null,2));
