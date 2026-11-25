// Each point is on the public, landside passenger stop or terminal approach.
// DHMİ/operator pages document ground transport; the point source identifies the exact pickup location.
export const arrivalAirportSource = 'https://www.hava.ist/duraklar.php?lang=en'
const dhmi = (slug:string) => 'https://www.dhmi.gov.tr/Sayfalar/Havalimani/'+slug+'/Ulasim.aspx'
function airport(name:string, tariffCity:string, lat:number, lng:number, sourceUrl:string, sourceName:string, pointSourceUrl:string, district?:string) {
  return {name,tariffCity,point:{lat,lng},sourceUrl,sourceName,pointSourceUrl,district}
}
const osm = (node:number) => 'https://www.openstreetmap.org/node/'+node
export const arrivalAirports = {
  IST:airport('İstanbul Havalimanı','İstanbul',41.25895,28.7426,arrivalAirportSource,'Havaist',arrivalAirportSource),
  SAW:airport('Sabiha Gökçen','İstanbul',40.908621,29.3146,arrivalAirportSource,'Havaist',arrivalAirportSource),
  ESB:airport('Ankara Esenboğa','Ankara',40.1154703,32.9955125,dhmi('Esenboga'),'DHMİ',osm(3182368307)),
  AYT:airport('Antalya','Antalya',36.9115258,30.802498,dhmi('Antalya'),'DHMİ',osm(8959640217),'Muratpaşa'),
  GZP:airport('Gazipaşa-Alanya','Antalya',36.2969351,32.3019729,'https://gzpairport.com/en-EN/to-from-the-airport/','TAV',osm(8014120585),'Gazipaşa'),
  ADB:airport('İzmir Adnan Menderes','İzmir',38.2912183,27.148288,dhmi('Adnanmenderes'),'DHMİ',osm(6926970420),'Gaziemir'),
  BJV:airport('Milas-Bodrum','Muğla',37.2436747,27.6733353,dhmi('Milasbodrum'),'DHMİ',osm(6237548786)),
  DLM:airport('Dalaman','Muğla',36.7173498,28.7851949,dhmi('Dalaman'),'DHMİ',osm(14275752501)),
  NAV:airport('Nevşehir Kapadokya','Nevşehir',38.7718052,34.5234566,dhmi('Kapadokya'),'DHMİ',osm(13817251906)),
  ASR:airport('Kayseri Erkilet','Kayseri',38.7653996,35.4855941,dhmi('Kayseri'),'DHMİ',osm(12979896149)),
  DNZ:airport('Denizli Çardak','Denizli',37.7742715,29.6914804,dhmi('Cardak'),'DHMİ',osm(5899218143)),
  YEI:airport('Bursa Yenişehir','Bursa',40.2567773,29.5436959,dhmi('Yenisehir'),'DHMİ',osm(10825362647)),
  GZT:airport('Gaziantep','Gaziantep',36.9432164,37.4769639,dhmi('Gaziantep'),'DHMİ',osm(11812687553)),
  KYA:airport('Konya','Konya',37.9852645,32.5771199,dhmi('Konya'),'DHMİ',osm(3251365492)),
  TZX:airport('Trabzon','Trabzon',40.9933651,39.7852477,dhmi('Trabzon'),'DHMİ',osm(8457391242)),
}
export type ArrivalAirport = keyof typeof arrivalAirports
