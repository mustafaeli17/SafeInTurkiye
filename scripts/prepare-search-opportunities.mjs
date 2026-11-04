// Offline editorial research backlog. Does NOT publish routes or claim search volume.
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
const templates={
 en:[['{city} taxi fare','how much is a taxi in {city}'],['{city} public transport','how to get around {city}'],['currency exchange in {city}','where to exchange money in {city}'],['pharmacy in {city}','ATM near me in {city}'],['hotels in {city}','where to stay in {city}'],['restaurants in {city}','where to eat in {city}'],['things to do in {city}','museums in {city}'],['private tours in {city}','guided tours in {city}']],
 tr:[['{city} taksi ücreti','{city} taksi ne kadar'],['{city} toplu taşıma','{city} şehir içi ulaşım'],['{city} döviz büroları','{city} nerede döviz bozdurulur'],['{city} eczane','{city} yakındaki ATM'],['{city} otelleri','{city} nerede kalınır'],['{city} restoranları','{city} nerede yemek yenir'],['{city} gezilecek yerler','{city} müzeleri'],['{city} özel tur','{city} rehberli tur']],
 de:[['{city} Taxipreise','was kostet ein Taxi in {city}'],['öffentliche Verkehrsmittel in {city}','unterwegs in {city}'],['Geld wechseln in {city}','Wechselstuben in {city}'],['Apotheke in {city}','Geldautomat in {city}'],['Hotels in {city}','wo übernachten in {city}'],['Restaurants in {city}','wo essen in {city}'],['Sehenswürdigkeiten in {city}','Museen in {city}'],['private Touren in {city}','Stadtführungen in {city}']],
 fr:[['prix taxi {city}','combien coûte un taxi à {city}'],['transports en commun {city}','comment se déplacer à {city}'],['changer de l’argent à {city}','bureau de change {city}'],['pharmacie {city}','distributeur de billets {city}'],['hôtels {city}','où dormir à {city}'],['restaurants {city}','où manger à {city}'],['que faire à {city}','musées {city}'],['visite privée {city}','visite guidée {city}']],
 es:[['precio taxi {city}','cuánto cuesta un taxi en {city}'],['transporte público en {city}','cómo moverse por {city}'],['cambiar dinero en {city}','casas de cambio en {city}'],['farmacia en {city}','cajero automático en {city}'],['hoteles en {city}','dónde alojarse en {city}'],['restaurantes en {city}','dónde comer en {city}'],['qué hacer en {city}','museos en {city}'],['tour privado en {city}','visita guiada en {city}']],
 ar:[['أجرة التاكسي في {city}','كم سعر التاكسي في {city}'],['المواصلات العامة في {city}','كيف أتنقل في {city}'],['صرف العملات في {city}','مكاتب الصرافة في {city}'],['صيدلية في {city}','صراف آلي في {city}'],['فنادق في {city}','أين أسكن في {city}'],['مطاعم في {city}','أين آكل في {city}'],['أماكن سياحية في {city}','متاحف في {city}'],['جولة خاصة في {city}','جولة مع مرشد في {city}']],
 ru:[['{city} стоимость такси','{city} сколько стоит такси'],['{city} общественный транспорт','{city} как передвигаться по городу'],['{city} обмен валюты','{city} где поменять деньги'],['{city} аптека','{city} банкоматы'],['{city} отели','{city} где остановиться'],['{city} рестораны','{city} где поесть'],['{city} достопримечательности','{city} музеи'],['{city} индивидуальные экскурсии','{city} экскурсии с гидом']],
 zh:[['{city}出租车价格','{city}打车多少钱'],['{city}公共交通','{city}市内怎么出行'],['{city}兑换外币','{city}哪里可以换钱'],['{city}药店','{city}自动取款机'],['{city}酒店','{city}住哪里'],['{city}餐厅','{city}哪里吃饭'],['{city}有什么好玩的','{city}博物馆'],['{city}私人游','{city}导览游']]
};
const paths=['/taxi','/transport','/exchange','/near-me','/hotels','/restaurants','/activities','/tours'];
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {publicCities}=await server.ssrLoadModule('/src/lib/publicRoutes.ts');
 const {cityDisplayName}=await server.ssrLoadModule('/src/lib/cityLocale.ts');
 const {searchLanguages,localizePath}=await server.ssrLoadModule('/src/lib/searchLocales.ts');
 const {searchPagePaths}=await server.ssrLoadModule('/src/lib/searchPages.ts');
 const rows=[];
 for(const lang of searchLanguages)for(const city of publicCities)for(const [i,pair] of templates[lang].entries()){
  for(const pattern of pair){
   rows.push({language:lang,city:city.slug,query:pattern.replaceAll('{city}',cityDisplayName(city.name,lang)),
    evidence:'editorial_candidate_not_measured',monthlySearchVolume:null,currentRanking:null,
    cityLanding:'https://www.safeinturkiye.com'+localizePath('/cities/'+city.slug,lang),
    toolLanding:'https://www.safeinturkiye.com'+localizePath(paths[i],lang)+'?city='+city.slug,
    toolCanonical:'https://www.safeinturkiye.com'+localizePath(paths[i],lang),
    nextAction:'Validate demand in Search Console/Keyword Planner; improve the existing destination/tool, do not create one page per query.'});
  }
 }
 if(rows.length!==1536)throw Error('Unexpected destination/language coverage');
 if(new Set(rows.map(r=>r.language+'|'+r.query)).size!==rows.length)throw Error('Duplicate query');
 for(const path of paths)if(!searchPagePaths.includes(path))throw Error('Unknown landing '+path);
 await mkdir('docs/marketing',{recursive:true});
 await writeFile('docs/marketing/search-opportunities-2026-11-04.json',JSON.stringify({
  date:'2026-11-04',method:'12 existing destinations × 8 supported languages × 8 intents × 2 editorial query variants. Not 1536 observed searches, indexed pages or verified keywords.',
  rows
 },null,2)+'\n');
 console.log(`Validated ${rows.length} candidate queries; ${publicCities.length} destinations; ${searchLanguages.length} languages. No routes or sitemap changed.`);
}finally{await server.close();}
