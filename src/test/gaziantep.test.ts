import {expect,it} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {publicCities,cityPath} from '../lib/publicRoutes';
import {findCityGuide} from '../lib/cityNavigation';
import {searchDestinations} from '../lib/searchDestinations';
import artwork from '../data/cityArtwork.json';
import copy from '../data/gaziantepCopy.json';
import es from '../data/citiesEs.json';
import zh from '../data/citiesZh.json';
import {cityTransportCopy} from '../lib/cityTransportCopy';

it('connects Gaziantep and Antep to the shared city and provider discovery flows',()=>{
 expect(publicCities.filter(c=>c.slug==='gaziantep')).toHaveLength(1);
 expect(cityPath('Gaziantep')).toBe('/cities/gaziantep');
 expect(findCityGuide('Antep')?.name).toBe('Gaziantep');
 expect(searchDestinations.Gaziantep).toEqual({lat:37.0662,lng:37.3833});
 expect(readFileSync('api/viator.ts','utf8')).toContain("gaziantep: ['Gaziantep']");
 const photo=artwork.find(city=>city.slug==='gaziantep')!;
 for(const key of ['src','thumbnail'] as const) expect(existsSync('public'+photo[key])).toBe(true);
});
it.each(['en','tr','de','fr','ar','ru','zh','es'])('has Gaziantep visitor and transport copy in %s',lang=>{
 const localized=lang==='es'?es.Gaziantep:lang==='zh'?zh.Gaziantep:copy[lang as keyof typeof copy];
 expect(localized.tagline.length).toBeGreaterThan(10);
 expect(cityTransportCopy.Gaziantep[lang]).toContain('GAZİULAŞ');
});
