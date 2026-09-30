import {it,expect} from 'vitest';
import {curatedDirectory} from '../lib/directory';
import {translatedDescription} from '../lib/contentTranslation';
import {activityContent} from '../lib/activityLabels';
import cities from '../data/cityGuides.json';
import zhCities from '../data/citiesZh.json';
it('has Chinese descriptions for every published hotel, restaurant and activity',()=>{
 for(const entry of curatedDirectory){
  const text=translatedDescription(entry,'zh');
  expect(text,entry.id).toMatch(/[\u4e00-\u9fff]/);
  expect(text,entry.id).not.toEqual(entry.description.en);
 }
});
it('refreshes activity descriptions when language changes instead of retaining English state',()=>{
 const entry=curatedDirectory.find(e=>e.id==='uludag')!;
 const item={id:entry.id,title:entry.name,description:entry.description.en};
 expect(activityContent(item,'zh').description).toBe(translatedDescription(entry,'zh'));
 expect(activityContent(item,'tr').description).toBe(entry.description.tr);
});
it('covers old and new cities in Chinese',()=>{
 for(const name of ['İstanbul','Ankara','Antalya','İzmir','Cappadocia',...cities.map(c=>c.name)])expect(zhCities).toHaveProperty(name);
});
