import {it,expect} from 'vitest';
import {locationErrorText} from '../lib/locationError';
it('maps permission denial to city-centre fallback, never raw diagnostics',()=>{
 expect(locationErrorText(1,'en')).toContain('permission was declined');
 expect(locationErrorText(1,'tr')).toContain('şehir merkezi');
 for(const code of [1,2,3,500,NaN])expect(locationErrorText(code,'en')).not.toMatch(/500|undefined|null|API/);
});
