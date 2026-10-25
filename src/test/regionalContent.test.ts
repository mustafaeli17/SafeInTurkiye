import {describe,it,expect} from 'vitest';
import {findCityGuide} from '../lib/cityNavigation';
import {curatedDirectory} from '../lib/directory';
import cities from '../data/cityGuides.json';
import artwork from '../data/cityArtwork.json';
import {searchDestinations} from '../lib/searchDestinations';
describe('regional content',()=>{
 it('resolves destination aliases without hijacking generic searches',()=>{expect(findCityGuide('Bodrum')?.slug).toBe('mugla');expect(findCityGuide('Kuşadası')?.slug).toBe('aydin');expect(findCityGuide('Pamukkale')?.slug).toBe('denizli');expect(findCityGuide('tarih')).toBeUndefined();expect(findCityGuide('')).toBeUndefined();});
 it('supports real discovery for every regional city without restoring the manual catalog',()=>{expect(curatedDirectory).toEqual([]);for(const city of cities){expect(searchDestinations).toHaveProperty(city.name);expect(artwork.some(item=>item.slug===city.slug)).toBe(true);}});
});
