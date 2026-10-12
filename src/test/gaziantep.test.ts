import {expect,it} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {publicCities,cityPath} from '../lib/publicRoutes';
import {findCityGuide} from '../lib/cityNavigation';
import {searchDestinations} from '../lib/searchDestinations';
import photos from '../lib/placePhotos.json';

it('connects Gaziantep and Antep to the shared city and provider discovery flows',()=>{
 expect(publicCities.filter(c=>c.slug==='gaziantep')).toHaveLength(1);
 expect(cityPath('Gaziantep')).toBe('/cities/gaziantep');
 expect(findCityGuide('Antep')?.name).toBe('Gaziantep');
 expect(searchDestinations.Gaziantep).toEqual({lat:37.0662,lng:37.3833});
 expect(readFileSync('api/viator.ts','utf8')).toContain("gaziantep: ['Gaziantep']");
 for(const key of ['src','thumbnail'] as const) expect(existsSync('public'+photos.gaziantep[key])).toBe(true);
});
