import {it,expect} from 'vitest';
import {catalogWebsite} from '../lib/catalogLinks';
it('suppresses unresolved and unsafe CTAs without replacing them',()=>{
 expect(catalogWebsite('https://www.rixos.com/en/hotel-resort/rixos-downtown-antalya')).toBeNull();
 expect(catalogWebsite('javascript:alert(1)')).toBeNull();
 expect(catalogWebsite('https://www.bitaksi.com/home')).toBe('https://www.bitaksi.com/home');
});
