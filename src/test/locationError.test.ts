import {it,expect} from 'vitest';
import {locationErrorText} from '../lib/locationError';
import {searchLanguages} from '../lib/searchLocales';
it('maps permission denial to city-centre fallback, never raw diagnostics',()=>{
 expect(locationErrorText(1,'en')).toContain('permission was declined');
 expect(locationErrorText(1,'tr')).toContain('şehir merkezi');
 for(const code of [1,2,3,500,NaN])expect(locationErrorText(code,'en')).not.toMatch(/500|undefined|null|API/);
});
it.each(searchLanguages)('offers local recovery guidance for every geolocation failure in %s',lang=>{
 const states=([1,2,3,'unsupported'] as const).map(code=>locationErrorText(code,lang));
 expect(new Set(states).size).toBe(4);
 if(lang!=='en')for(const message of states)expect(message).not.toMatch(/Location|location could not|address or city|Choose a city/);
 expect(locationErrorText(1,lang+'-XX')).toBe(states[0]);
});
