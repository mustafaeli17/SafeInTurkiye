import { distanceFare } from './taxiCalculation.ts';

type Sample = { opening:number; km:number; minimum:number; after5?:number; districts?:string[] };
type Budget = { samples:Sample[]; sources:string[]; scope:string; reviewedAt:string };
function sample(opening:number, km:number, minimum:number, districtNames?:string, after5?:number):Sample {
  return { opening, km, minimum, after5, districts:districtNames?.split('|') };
}

// Local planning examples reviewed individually. A review date is not a tariff effective date.
export const taxiBudgets:Record<string,Budget> = {
  'İstanbul': {
    scope:'Standard yellow taxi', reviewedAt:'2026-11-21',
    samples:[sample(71.94, 47.92, 230)],
    sources:['https://iteo.org.tr/haber/yeni-taksimetre-tarifesi-yururluge-girdi',
      'https://tuhim.ibb.gov.tr/media/27494/taksi-ta%C5%9F%C4%B1mac%C4%B1l%C4%B1%C4%9F%C4%B1-%C3%BCcret-tarifesi.pdf'],
  },
  'Ankara': {
    scope:'Ankara metered taxis', reviewedAt:'2026-11-21',
    samples:[sample(65, 40, 200)],
    sources:['https://www.ankarataksimetre.com.tr/tarife/',
      'https://www.yeniankara.com.tr/ankara/ankara-taksi-ucretleri-2026-ise-her-gun-taksiyle-gitmek-ayda-kac-tl-tutuyor-189828'],
  },
  'Antalya': {
    scope:'Five central districts and fourteen outer districts', reviewedAt:'2026-11-21',
    samples:[sample(40, 50, 200, 'Muratpaşa|Kepez|Konyaaltı|Döşemealtı|Aksu'),
      sample(60, 70, 250, 'Gazipaşa|Alanya|Manavgat|Serik|Akseki|Gündoğmuş|İbradı|Korkuteli|Kemer|Kumluca|Elmalı|Finike|Kaş|Demre')],
    sources:['https://www.antalyakorfez.com/antalyada-taksimetre-tartismasi-mehmet-ali-alkandan-aciklama'],
  },
  'İzmir': {
    scope:'Municipal decision 524, standard taxi tables on pages 1–8', reviewedAt:'2026-11-21',
    samples:[sample(40, 54, 210, 'Balçova|Bayraklı|Bornova|Buca|Çiğli|Gaziemir|Güzelbahçe|Karabağlar|Karşıyaka|Konak|Narlıdere|Aliağa|Bayındır|Foça|Kemalpaşa|Menderes|Menemen|Seferihisar|Torbalı|Urla'),
      sample(64, 68, 310, 'Çeşme|Selçuk'),
      sample(64, 68, 280, 'Karaburun'),
      sample(64, 68, 210, 'Tire|Ödemiş|Kiraz|Beydağ'),
      sample(55.2, 62, 280, 'Bergama|Kınık|Dikili')],
    sources:['https://tuhim.izmir.bel.tr/tr/Tasitlar/1',
      'https://www.izmir.bel.tr/IBB-IZMIRBB-C1/Paylasim/MeclisKararOzetleri/24042026_102247_KararOzet_04.524%20b%C3%BCt%C3%A7e.pdf'],
  },
  'Muğla': {
    scope:'Province-wide, effective 16 November, includes Bodrum', reviewedAt:'2026-11-21',
    samples:[sample(180, 60, 300)],
    sources:['https://www.muglapostasi.com.tr/muglada-ulasima-yuzde-20-zam',
      'https://bodrumolay.com/muglada-taksi-ucretlerine-yuzde-20-zam-indi-bindi-kac-tl-oldu/'],
  },
  'Aydın': {
    scope:'Efeler and coastal metered examples', reviewedAt:'2026-11-21',
    samples:[sample(49, 56, 210, 'Efeler'),
      sample(56, 63, 240, 'Kuşadası|Didim')],
    sources:['https://sahilsiteleritaksi.com/',
      'https://www.hemenhesap.com/hesap/taksi/aydin',
      'https://www.aydinpost.com/aydinda-taksi-ve-servis-ucretlerine-zam-geldi'],
  },
  'Denizli': {
    scope:'Urban metered taxi, includes Pamukkale', reviewedAt:'2026-11-21',
    samples:[sample(70, 56, 210)],
    sources:['https://www.denizligunes.com/toplu-ulasimda-zamli-yolculuk',
      'https://airportnavi.com/tr/havalimanlari/denizli'],
  },
  'Trabzon': {
    scope:'First five kilometres and subsequent distance, effective 19 October', reviewedAt:'2026-11-21',
    samples:[sample(90, 73, 260, undefined, 62)],
    sources:['https://www.haber61.net/trabzon/trabzon-da-taksi-ucretleri-zamlandi-iste-yeni-tarife/646317'],
  },
  'Konya': {
    scope:'Urban metered taxi', reviewedAt:'2026-11-21',
    samples:[sample(55, 50, 200)],
    sources:['https://fatihtaksiduragi.com/konya-taksi-ucretleri/'],
  },
  'Bursa': {
    scope:'City metered taxi; excludes seasonal fixed Uludağ trips', reviewedAt:'2026-11-21',
    samples:[sample(65, 55, 190)],
    sources:['https://www.bursa.bel.tr/storage/medya/meclis_kararlari/260929-1008_15.09.2026-MECLiS-KARARLARI.pdf',
      'https://www.bursabasin.com/bursada-taksi-ucretleri-pazar-gunu-zamlaniyor'],
  },
  'Nevşehir': {
    scope:'Nevşehir / Göreme / Ürgüp', reviewedAt:'2026-11-21',
    samples:[sample(52, 65, 200)],
    sources:['https://www.urguphaber.com.tr/2026/04/10/taksi-ucretlerine-zam-yapildi/',
      'https://cappadociareviews.com/cappadocia-taxi-prices/'],
  },
  'Kayseri': {
    scope:'Kayseri metered taxi, including the Kayseri airport gateway to Cappadocia', reviewedAt:'2026-11-21',
    samples:[sample(75, 65, 225)],
    sources:['https://kayseri.bel.tr/uploads/karar-ozet/report-22-05-2026-14-52.PDF'],
  },
  'Gaziantep': {
    scope:'Standard metered taxi', reviewedAt:'2026-11-21',
    samples:[sample(50, 50, 200)],
    sources:['https://www.gazianteppusula.com/haber/27489973/gaziantepte-taksiye-zam',
      'https://www.gazianteppostasi.com/news/gaziantep-te-taksi-ucretlerine-zam-gelecek-mi-soforler-odasi-ndan-aciklama-yapildi'],
  },
};

export const BUDGET_RECHECK_DAYS = 30;
// Tariff review days are local to Türkiye. A 02:00 Istanbul review already belongs
// to the new day even though the UTC date (and the browser's timezone) may differ.
export function budgetReviewExpiresAt(reviewedAt:string) {
  return Date.parse(reviewedAt+'T00:00:00+03:00') + BUDGET_RECHECK_DAYS*86400000;
}
export function budgetIsCurrent(reviewedAt:string, now=Date.now()) {
  const reviewed = Date.parse(reviewedAt+'T00:00:00Z');
  if (!Number.isFinite(reviewed) || !/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt) ||
    new Date(reviewed).toISOString().slice(0,10) !== reviewedAt) return false;
  const expires = budgetReviewExpiresAt(reviewedAt);
  return now >= expires - BUDGET_RECHECK_DAYS*86400000 && now < expires;
}

export function taxiBudgetRange(city:string, distances:number[], vehicle='YELLOW', now=Date.now(), district?:string) {
  const budget = Object.hasOwn(taxiBudgets,city) ? taxiBudgets[city] : undefined;
  if (!budget || vehicle !== 'YELLOW' || !budgetIsCurrent(budget.reviewedAt,now)) return null;
  if (!distances.length || distances.some(km=>!Number.isFinite(km) || km<=0)) throw new Error('INVALID_FARE_INPUT');

  // Use only the resolved origin's administrative district. A missing district may still
  // have a useful regional range; no neighbouring province is used to fill a gap.
  const local = district && budget.samples.find(s => s.districts?.includes(district));
  const samples = local ? [local] : budget.samples;
  const fares = samples.flatMap(s => distances.map(km => s.after5 === undefined
    ? distanceFare(km,s.opening,s.km,s.minimum)
    : Math.max(s.minimum,s.opening+Math.min(km,5)*s.km+Math.max(0,km-5)*s.after5)));
  const low = Math.min(...fares), high = Math.max(...fares);
  const hasRange = high-low >= 1;
  const lowestMinimum = Math.min(...samples.map(s => s.minimum));
  // A single meter estimate is a single rounded amount. Outward rounding alone cannot create uncertainty.
  let amount = low;
  if (hasRange) amount = Math.max(lowestMinimum,Math.floor(low/10)*10);
  else if (low !== lowestMinimum) amount = Math.max(lowestMinimum,Math.round(low/10)*10);
  const upper = hasRange ? Math.ceil(high/10)*10 : amount;
  const minimumFare = samples.every(s=>s.minimum===lowestMinimum) ? lowestMinimum : undefined;
  return {amount,upper,hasRange,minimumFare,source:[city,local && district,budget.reviewedAt].filter(Boolean).join(' · '),sourceUrls:budget.sources};
}
