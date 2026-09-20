import {mkdir,writeFile} from 'node:fs/promises';
const files={
 izmir:'Izmir square clock tower.jpg',
 ankara:"Ataturk's Mausoleum (6225341313).jpg",
 antalya:'Antalya Harbour from high From south ın 2011 10.jpg',
 h2:'Swissotel Büyük EFES.jpg',h3:'Ciragan Palace 2014.JPG',
 a1:'Göreme Open Air Museum 01.jpg',a2:'Anadolu Medeniyetleri Müzesi.jpg',a3:'Topkapi Palace, Istanbul.jpg',
 modern:'İstanbul Modern 2023.jpg',erciyes:'KAYAK ERCİYES .jpg',
};
await mkdir('public/photos',{recursive:true});
const result={};
async function request(url){
 for(let attempt=0;attempt<4;attempt++){
  const response=await fetch(url,{headers:{'User-Agent':'SafeInTurkiyePhotoReview/1.0 (https://www.safeinturkiye.com)'}});
  if(response.status!==429)return response;
  await new Promise(resolve=>setTimeout(resolve,5000*(attempt+1)));
 }
 throw Error('Provider rate limited; retry later');
}
for(const [id,file] of Object.entries(files)){
 const url=new URL('https://commons.wikimedia.org/w/api.php');
 url.search=new URLSearchParams({action:'query',format:'json',titles:'File:'+file,prop:'imageinfo',iiprop:'url|extmetadata|size',iiurlwidth:'1600'});
 await new Promise(resolve=>setTimeout(resolve,1500));
 const response=await request(url);if(!response.ok)throw Error(response.status);
 const page=Object.values((await response.json()).query.pages)[0];
 const info=page.imageinfo?.[0];if(!info)throw Error('Missing '+file);
 const license=info.extmetadata.LicenseShortName?.value;
 if(!/CC BY|CC0/.test(license))throw Error('Review license '+file+': '+license);
 const image=await request(info.thumburl||info.url);if(!image.ok)throw Error('Image '+image.status);
 await writeFile('public/photos/'+id+'.jpg',Buffer.from(await image.arrayBuffer()));
 result[id]={src:'/photos/'+id+'.jpg',source:info.descriptionurl,author:info.extmetadata.Artist.value.replace(/<[^>]*>/g,'').trim(),license,licenseUrl:info.extmetadata.LicenseUrl?.value,width:info.thumbwidth||info.width,height:info.thumbheight||info.height};
 console.log(id,result[id].width,result[id].height,license);
}
await writeFile('src/lib/placePhotos.json',JSON.stringify(result,null,2)+'\n');
