import {expect,it} from 'vitest';
import {renderToString} from 'react-dom/server';
import {existsSync,statSync} from 'node:fs';
import {publicCities} from '../lib/publicRoutes';
import artwork from '../data/cityArtwork.json';
import CityArtwork from '../components/CityArtwork';
import {cityArtworkNotice} from '../lib/cityArtworkCopy';
import TransitPlanner from '../components/TransitPlanner';
import RailTravelGuide from '../components/RailTravelGuide';
import {railCopy} from '../lib/railTravelCopy';
import LocalTransportTips from '../components/LocalTransportTips';
import {groomingCategoryLabel} from '../lib/groomingCopy';

it.each(['tr','en','es','de','fr','ar','ru','zh'])('keeps local transport guidance collapsed and grooming labels localized: %s',locale=>{
 const html=renderToString(<LocalTransportTips locale={locale}/>);
 expect(html.match(/<details/g)).toHaveLength(2);
 expect(html.match(/<summary/g)).toHaveLength(2);
 expect(html).not.toMatch(/<details[^>]*\bopen/);
 expect(groomingCategoryLabel('barber',locale)).toBeTruthy();
 expect(groomingCategoryLabel('hair_salon',locale)).toBeTruthy();
 expect(groomingCategoryLabel('restaurant',locale)).toBeUndefined();
});

it('provides local small and large artwork for every public city without changing venue photos',()=>{
 expect(artwork.map(p=>p.slug).sort()).toEqual(publicCities.map(p=>p.slug).sort());
 expect(new Set(artwork.map(p=>p.sourceFile)).size).toBe(12);
 for(const p of artwork){
  for(const file of [p.thumbnail,p.src]){
   expect(existsSync(`public${file}`)).toBe(true);
   expect(statSync(`public${file}`).size).toBeLessThan(500_000);
  }
  const html=renderToString(<CityArtwork city={p.name} lang="tr"/>);
  expect(html).toContain('srcSet=');
  expect(html).toContain('loading="lazy"');
  expect(html).toContain('width="1536"');
  expect(html).toContain('yapay zekâ');
 }
});
it.each(['tr','en','es','de','fr','ar','ru','zh'])('localizes rail guidance and image disclosure in %s',lang=>{
 expect(railCopy[lang]).toHaveLength(6);
 expect(cityArtworkNotice[lang]).toBeTruthy();
 const html=renderToString(<RailTravelGuide locale={lang}/>);
 expect(html).toContain(railCopy[lang][0]);
 expect(html).toContain('https://ebilet.tcddtasimacilik.gov.tr/');
 expect(html).toContain('Basmane');
});
it('places Metrobus once inside the Istanbul mode accordion only',()=>{
 const istanbul=renderToString(<TransitPlanner lang="tr" initialCity="İstanbul"/>);
 expect(istanbul.match(/Metrobüs · İETT/g)).toHaveLength(1);
 expect(istanbul).toMatch(/reference-transit-row[\s\S]*<summary>[\s\S]*Metrobüs · İETT/);
 expect(istanbul).toContain('metrobus-hatlari');
 expect(renderToString(<TransitPlanner lang="tr" initialCity="Antalya"/>)).not.toContain('Metrobüs · İETT');
});
