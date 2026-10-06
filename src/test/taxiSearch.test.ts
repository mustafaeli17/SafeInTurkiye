import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {taxiSearchUrl} from '../lib/taxiSearch';
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
