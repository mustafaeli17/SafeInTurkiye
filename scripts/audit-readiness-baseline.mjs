// Read-only audit: no credentials, network requests or database writes.
import fs from 'node:fs';
const read = name => JSON.parse(fs.readFileSync(`src/data/${name}.json`, 'utf8'));
const entries = [
  ...read('directory'),
  ...['regionalHotels', 'regionalRestaurants', 'regionalActivities'].flatMap(name => read(name).map(x => ({...x, id:x.slug}))),
  ...read('photoAlternatives'),
  ...read('cinemas').map(x => ({...x, id:x.slug, description:{tr:'present', en:'present'}})),
].filter(x => read('photoPublication').galleries[x.id]?.length);
const chinese = read('directoryZh');
const photos = JSON.parse(fs.readFileSync('src/lib/reviewedPhotos.json', 'utf8'));
console.log(JSON.stringify({
  publishedEntries: entries.length,
  missingEditorialTranslations: Object.fromEntries(['en','tr','de','fr','ar','ru','zh'].map(lang => [lang, entries.filter(x => !(x.description?.[lang] || (lang === 'zh' && (chinese[x.id] || x.category === 'Cinema' || x.id.startsWith('cinema') || x.id.startsWith('paribu-'))))).map(x => x.id)])),
  images: Object.entries(photos).map(([id, photo]) => ({id, source:photo.source, license:photo.license, licenseUrl:photo.licenseUrl, author:photo.author, missingFiles:[photo.src, photo.thumbnail, ...photo.variants.map(v=>v.src)].filter(path=>!fs.existsSync(`public${path}`)), caveat:'Repository attribution metadata, not a new legal verification of the source file.'})),
}, null, 2));
