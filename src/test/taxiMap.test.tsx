import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
import TaxiRouteMap from '../components/TaxiRouteMap';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it.each(['Pera Palace Hotel, Beyoğlu, İstanbul, Türkiye','Bursa Şehir Hastanesi, Nilüfer, Bursa, Türkiye','Anıtkabir, Ankara, Türkiye','Atatürk Caddesi, Kuşadası, Aydın, Türkiye'])('preserves the selected destination %s before and after calculation',mapQuery=>{
 vi.stubGlobal('window',{location:{hostname:'www.safeinturkiye.com'}});
 vi.stubGlobal('document',{documentElement:{lang:'tr'}});
 vi.stubEnv('VITE_GOOGLE_MAPS_BROWSER_KEY','test-public-browser-key');
 for(const geometry of [null,[{lat:40,lng:29},{lat:41,lng:30}]]){
  const html=renderToStaticMarkup(<TaxiRouteMap originCoords={{lat:40,lng:29}} destCoords={{lat:41,lng:30,mapQuery}} geometry={geometry}/>);
  expect(html).toContain(new URLSearchParams({destination:mapQuery}).toString());
 }
});
it('passes the selected named destination to Google instead of reverse-geocoding an airport centroid',()=>{
 vi.stubGlobal('window',{location:{hostname:'www.safeinturkiye.com'}});
 vi.stubGlobal('document',{documentElement:{lang:'tr'}});
 vi.stubEnv('VITE_GOOGLE_MAPS_BROWSER_KEY','test-public-browser-key');
 const destination='Sabiha Gökçen Havalimanı (SAW), İstanbul, Türkiye';
 const html=renderToStaticMarkup(<TaxiRouteMap originCoords={{lat:41.01,lng:28.94}} destCoords={{lat:40.894,lng:29.311,mapQuery:destination}} geometry={null}/>);
 expect(html).toContain(new URLSearchParams({destination}).toString());
 expect(html).toContain('origin=41.01%2C28.94');
});
it.each([null,[{lat:41.2,lng:28.8},{lat:41.01,lng:28.97}]])('keeps Google directions with or without calculated geometry',geometry=>{
 vi.stubGlobal('window',{location:{hostname:'www.safeinturkiye.com'}});
 vi.stubGlobal('document',{documentElement:{lang:'en'}});
 vi.stubEnv('VITE_GOOGLE_MAPS_BROWSER_KEY','test-public-browser-key');
 const html=renderToStaticMarkup(<TaxiRouteMap originCoords={{lat:41.2,lng:28.8}} destCoords={{lat:41.01,lng:28.97}} geometry={geometry}/>);
 expect(html).toContain('google.com/maps/embed/v1/directions');
 expect(html).toContain('origin=41.2%2C28.8');
 expect(html).toContain('destination=41.01%2C28.97');
});
it('keeps the calculation-map fallback when no permitted browser key exists',()=>{
 vi.stubGlobal('window',{location:{hostname:'localhost'}});
 vi.stubGlobal('document',{documentElement:{lang:'en'}});
 vi.stubEnv('VITE_GOOGLE_MAPS_PREVIEW_BROWSER_KEY','');
 const html=renderToStaticMarkup(<TaxiRouteMap originCoords={null} destCoords={null} geometry={null}/>);
 expect(html).not.toContain('<iframe');expect(html).toContain('role="region"');
});
it('does not place Google address results on a non-Google fallback map',()=>{
 vi.stubGlobal('window',{location:{hostname:'localhost'}});
 vi.stubGlobal('document',{documentElement:{lang:'en'}});
 vi.stubEnv('VITE_GOOGLE_MAPS_PREVIEW_BROWSER_KEY','');
 const html=renderToStaticMarkup(<TaxiRouteMap originCoords={null} destCoords={{lat:40.9,lng:29.3,provider:'google',mapQuery:'place_id:airport'}} geometry={null}/>);
 expect(html).not.toContain('role="region"');expect(html).toContain('destination_place_id=airport');expect(html).toContain('Google Maps');
});
