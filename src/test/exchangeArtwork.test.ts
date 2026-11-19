import {expect,it} from 'vitest';
import {exchangeArtwork} from '../lib/exchangeArtwork';
import {searchDestinations} from '../lib/searchDestinations';
import {existsSync} from 'node:fs';
it.each([['Kuşadası','aydin'],['Didim','aydin'],['Bodrum','mugla'],['Pamukkale','denizli'],['Çeşme','izmir'],['Alaçatı','izmir']])('uses matching regional artwork for %s',(city,slug)=>{
 expect(exchangeArtwork(city)?.slug).toBe(slug);
});
it.each(Object.keys(searchDestinations))('has a real local image file for %s',city=>{
 const image=exchangeArtwork(city);
 expect(image).toBeDefined();
 expect(existsSync(`public${image!.src}`)).toBe(true);
 expect(image!.width).toBeGreaterThanOrEqual(1536);
});
it('does not substitute Istanbul for an unknown destination',()=>{expect(exchangeArtwork('unknown')).toBeUndefined()});
