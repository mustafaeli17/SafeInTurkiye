import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
import TaxiRouteMap from '../components/TaxiRouteMap';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
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
