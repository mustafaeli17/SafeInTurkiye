import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {taxiSearchUrl,parseTaxiPlaces} from '../lib/taxiSearch';
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
 expect(url.searchParams.get('limit')).toBe('5');
});
it('encodes query text as a value rather than extra parameters',()=>{
 const url=new URL(taxiSearchUrl('  Ankara &lat=41  '));
 expect(url.searchParams.get('q')).toBe('Ankara &lat=41');
 expect(url.searchParams.has('lat')).toBe(false);
});
it('uses the unbiased helper for both taxi address inputs',()=>{
 const app=readFileSync('src/App.tsx','utf8');
 expect(app).toContain('taxiSearchUrl(taxiOriginText)');
 expect(app).toContain('taxiSearchUrl(taxiDestText)');
 expect(app).not.toContain('&limit=5&lat=41.0082&lon=28.9784');
});
