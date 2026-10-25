import sharp from 'sharp';
// Encoding/size optimization only. Keep the original logo as the editable source.
await sharp('src/assets/safeinturkiye-logo.png').resize({width:600,withoutEnlargement:true}).webp({lossless:true}).toFile('public/brand-logo.webp');
