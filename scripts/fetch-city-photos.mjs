// Import only explicitly selected, openly licensed source photographs.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(process.argv[2]||'sharp');
const files={
 antalya:'View of Konyaaltı Beach and Beydağları Mountains, Antalya.jpg',
 mugla:'Bodrum castle2.jpg',
 aydin:'Güvercinada Castle, Kuşadası.jpg',
 denizli:'Denizli - Pamukkale Travertines.jpg',
 trabzon:'Sumela Monastery!.jpg',
 konya:'Maulana mausoleum konya.jpg',
 bursa:'Uludag.JPG',
 'koza-han':'Koza Han.jpg',
 'karatay-tile-museum':'Karatay Madrasa, Konya, Turkey 09.jpg',
};
const registry=JSON.parse(await readFile('src/lib/placePhotos.json','utf8'));
await mkdir('public/photos',{recursive:true});
for(const [id,file] of Object.entries(files)){
 if(registry[id]?.src===`/photos/${id}-city.webp`&&decodeURIComponent(registry[id].source).replaceAll('_',' ').endsWith(`File:${file}`))continue;
 const endpoint=new URL('https://commons.wikimedia.org/w/api.php');
 endpoint.search=new URLSearchParams({action:'query',format:'json',titles:`File:${file}`,prop:'imageinfo',iiprop:'url|extmetadata|size',iiurlwidth:'1600'});
 const response=await fetch(endpoint,{signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error(`Metadata ${id}: ${response.status}`);
 const info=Object.values((await response.json()).query.pages)[0].imageinfo?.[0];
 const license=info?.extmetadata.LicenseShortName?.value;
 if(!/^CC (BY|BY-SA) [\d.]+$/.test(license??''))throw Error(`License review required: ${id} ${license}`);
 const download=await fetch(info.thumburl||info.url,{signal:AbortSignal.timeout(30000)});
 if(!download.ok)throw Error(`Image ${id}: ${download.status}`);
 const bytes=Buffer.from(await download.arrayBuffer());
 const output=await sharp(bytes).rotate().resize({width:1600,withoutEnlargement:true}).webp({quality:86}).toBuffer({resolveWithObject:true});
 await writeFile(`public/photos/${id}-city.webp`,output.data);
 await sharp(bytes).rotate().resize({width:640,withoutEnlargement:true}).webp({quality:82}).toFile(`public/photos/${id}-city-small.webp`);
 registry[id]={src:`/photos/${id}-city.webp`,thumbnail:`/photos/${id}-city-small.webp`,source:info.descriptionurl,author:info.extmetadata.Artist.value.replace(/<[^>]*>/g,'').trim(),license,licenseUrl:info.extmetadata.LicenseUrl.value,width:output.info.width,height:output.info.height};
 await writeFile('src/lib/placePhotos.json',JSON.stringify(registry,null,2)+'\n');
 console.log(`${id}: ${output.info.width}x${output.info.height}, ${output.data.length} bytes, ${license}`);
}
