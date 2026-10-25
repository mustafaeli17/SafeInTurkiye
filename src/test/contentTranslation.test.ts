import {it,expect} from 'vitest';
import {translatedDescription} from '../lib/contentTranslation';
import cities from '../data/cityGuides.json';
import zhCities from '../data/citiesZh.json';
it('uses the published CMS translation rather than a retired ID-based description',()=>{
 const entry={id:'uludag',description:{en:'Published description',tr:'Yayımlanmış açıklama',zh:'已发布的说明'}};
 expect(translatedDescription(entry,'zh')).toBe(entry.description.zh);expect(translatedDescription(entry,'tr')).toBe(entry.description.tr);expect(translatedDescription(entry,'de')).toBe(entry.description.en);
});
it('covers old and new cities in Chinese',()=>{for(const name of ['İstanbul','Ankara','Antalya','İzmir','Cappadocia',...cities.map(c=>c.name)])expect(zhCities).toHaveProperty(name);});
