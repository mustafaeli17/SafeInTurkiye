import { distanceFare } from './taxiCalculation';

/** Published local price observations for budget estimates, NOT verified CMS tariffs.
 * Regional samples form a budget range, not a claim of uniform provincial pricing.
 * No invented effective dates, waiting charges or vehicle-class multipliers.
 */
type Sample = { opening:number; km:number; minimum:number; after5?:number };
type Budget = { samples:Sample[]; sources:string[]; scope:string };
const sample=(opening:number,km:number,minimum:number,after5?:number):Sample=>({opening,km,minimum,after5});
export const budgetReviewedAt='2026-10-06';
export const taxiBudgets:Record<string,Budget>={
 'İstanbul':{samples:[sample(71.94,47.92,230)],sources:['https://tuhim.ibb.gov.tr/media/27494/taksi-ta%C5%9F%C4%B1mac%C4%B1l%C4%B1%C4%9F%C4%B1-%C3%BCcret-tarifesi.pdf'],scope:'Standard taxi'},
 'Ankara':{samples:[sample(65,40,200)],sources:['https://taksibartin.com/ankara-taksi-ucreti-hesaplama/'],scope:'Standard taxi'},
 'Antalya':{samples:[sample(40,50,200),sample(50,50,200)],sources:['https://www.antalyakorfez.com/taksimetreye-zam-yeni-tarifeler-bu-gece-yururluge-giriyor','https://www.dha.com.tr/amp/yerel-haberler/antalya/antalyada-taksi-ve-otobus-ucretlerine-zam-bel-2836074'],scope:'Central Antalya; published opening amounts differ'},
 'İzmir':{samples:[sample(40,54,210),sample(64,68,310)],sources:['https://www.izmir.bel.tr/IBB-IZMIRBB-C1/Paylasim/MeclisKararOzetleri/24042026_102247_KararOzet_04.524%20b%C3%BCt%C3%A7e.pdf'],scope:'Metropolitan and Çeşme standard taxi samples; regional budget range'},
 'Muğla':{samples:[sample(150,50,250)],sources:['https://taksi724.com/bodrum-taksi-ucreti','https://www.hemenhesap.com/hesap/taksi/mugla'],scope:'Bodrum / Muğla standard taxi samples'},
 'Aydın':{samples:[sample(49,56,180),sample(56,63,210)],sources:['https://www.hemenhesap.com/hesap/taksi/aydin','https://sahilsiteleritaksi.com/'],scope:'Efeler and Kuşadası samples; regional budget range'},
 'Denizli':{samples:[sample(50,40,150),sample(61.25,47.50,180)],sources:['https://taksi724.com/denizli-taksi-ucreti-hesaplama','https://denizlikonaktaksi.com.tr/'],scope:'Published Denizli samples; regional budget range'},
 'Trabzon':{samples:[sample(71.50,58.50,208,49.40)],sources:['https://www.i24haber.com/3612-trabzon','https://www.haber61.net/trabzon/trabzonda-taksi-ucretlerine-zam-acilis-ve-indi-bindi-artti/626482'],scope:'Standard taxi; first 5 km then lower distance rate'},
 'Konya':{samples:[sample(55,50,200)],sources:['https://personel.com/blog/konya-taksi-ucretleri-2026-guncel-taksi-tarifesi-ve-fiyat-hesaplama','https://taksiucretihesaplama.online/konya-taksi-ucreti-hesaplama/'],scope:'Standard taxi'},
 'Bursa':{samples:[sample(52,45,150)],sources:['https://www.ulubursa.com/bursada-taksi-ucretlerine-zam-yeni-tarife-belli-oldu/','https://www.taksicibul.com/taksi-ucreti-hesaplama'],scope:'Central Bursa standard taxi'},
 'Nevşehir':{samples:[sample(52,65,200)],sources:['https://cappadociareviews.com/cappadocia-taxi-prices/'],scope:'Nevşehir / Göreme / Ürgüp; not Kayseri'},
};

export function taxiBudgetRange(city:string,distances:number[],vehicle='YELLOW'){
 const budget=taxiBudgets[city];
 if(!budget||vehicle!=='YELLOW')return null;
 if(!distances.length||distances.some(km=>!Number.isFinite(km)||km<=0))throw new Error('INVALID_FARE_INPUT');
 const fares=budget.samples.flatMap(s=>distances.map(km=>s.after5!==undefined
  ? Math.max(s.minimum,s.opening+Math.min(km,5)*s.km+Math.max(0,km-5)*s.after5)
  : distanceFare(km,s.opening,s.km,s.minimum)));
 // Outward rounding to readable ten-lira amounts, not a traffic surcharge.
 const amount=Math.floor(Math.min(...fares)/10)*10;
 const upper=Math.ceil(Math.max(...fares)/10)*10;
 return {amount,upper,hasRange:upper>amount,source:city+' · '+budgetReviewedAt,sourceUrls:budget.sources};
}
