import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {taxiSearchUrl,parseTaxiPlaces} from '../lib/taxiSearch';
const feature=(name:string,kind:string,lat=40)=>({properties:{name,osm_value:kind,countrycode:'TR',state:'Ankara'},geometry:{coordinates:[32,lat]}});
it('prioritises actual airports and hospitals over similarly named roads and hotels',()=>{
 expect(parseTaxiPlaces({features:[feature('Trabzon Havalimanı Misafirhanesi','hotel'),feature('Trabzon Uluslararası Havalimanı','aerodrome')]},'Trabzon Havalimanı')[0].label).toContain('Uluslararası');
 expect(parseTaxiPlaces({features:[feature('Şehir Hastanesi Bağlantı Yolu','primary'),feature('Şehir Hastanesi','hospital')]},'Şehir Hastanesi')[0].label).toBe('Şehir Hastanesi, Ankara');
});
it('does not turn explicit airport hotel or road searches into airport searches',()=>{
 expect(parseTaxiPlaces({features:[feature('Trabzon Havalimanı Misafirhanesi','hotel'),feature('Trabzon Uluslararası Havalimanı','aerodrome')]},'Trabzon Havalimanı Misafirhanesi')[0].label).toContain('Misafirhanesi');
});
it('rejects malformed features without losing valid results or throwing',()=>{
 const foreign=feature('Foreign','hotel');foreign.properties.countrycode='DE';
 const invalid=[null,{}, {geometry:{coordinates:{}}}, {geometry:{coordinates:'32,40'}},foreign];
 expect(parseTaxiPlaces({features:[...invalid,feature('Valid','hotel')]})).toHaveLength(1);
});
it('handles numeric building numbers, trims and deduplicates address parts',()=>{
 const f=feature(' Hotel ','hotel');Object.assign(f.properties,{street:'Street',housenumber:12,city:'Ankara',state:' Ankara '});
 expect(parseTaxiPlaces({features:[f]})[0].label).toBe('Hotel, Street, 12, Ankara');
});
it('preserves the actual place name, full address and province without fabricating coordinates',()=>{
 const data={features:[{geometry:{coordinates:[29.311,40.894]},properties:{name:'Sabiha Gökçen Havalimanı (SAW)',street:'Kurtköy-Pendik Bağlantısı',district:'Sanayi',city:'İstanbul',state:'İstanbul',country:'Türkiye',countrycode:'TR'}}]};
 const [place]=parseTaxiPlaces(data);
 expect(place.label).toBe('Sabiha Gökçen Havalimanı (SAW), Kurtköy-Pendik Bağlantısı, Sanayi, İstanbul, Türkiye');
 expect(place.city).toBe('İstanbul');
 expect(place.lat).toBe(40.894);
 expect(parseTaxiPlaces({features:[{}, {geometry:{coordinates:[999,NaN]},properties:{name:'bad'}}]})).toEqual([]);
});
it.each(['Ankara','Kuşadası','İstanbul','Antalya','Bursa'])('searches %s without a fixed-city bias',query=>{
 const url=new URL(taxiSearchUrl(query));
 expect(url.searchParams.get('q')).toBe(query);
 expect(url.searchParams.get('countrycode')).toBe('TR');
 expect(url.searchParams.has('lat')).toBe(false);
 expect(url.searchParams.has('lon')).toBe(false);
 expect(url.searchParams.get('limit')).toBe('10');
});
it('encodes query text as a value rather than extra parameters',()=>{
 const url=new URL(taxiSearchUrl('  Ankara &lat=41  '));
 expect(url.searchParams.get('q')).toBe('Ankara &lat=41');
 expect(url.searchParams.has('lat')).toBe(false);
});
it('uses the shared address component for both taxi inputs',()=>{
 const app=readFileSync('src/App.tsx','utf8');
 expect(app).toContain('id="taxi-origin" label=');
 expect(app).toContain('id="taxi-destination" label=');
 expect(app).not.toContain('&limit=5&lat=41.0082&lon=28.9784');
});
