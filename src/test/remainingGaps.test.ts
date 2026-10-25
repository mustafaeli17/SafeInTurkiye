import {expect,it} from 'vitest';
import fs from 'node:fs';
import {taxiMapKey} from '../lib/mapEnvironment';
import {taxiCalculationMapNotice} from '../lib/taxiRouteNotice';

it('does not send production-only map keys to Preview/local/impersonating hosts',()=>{
 for(const host of ['safeinturkiye.com','www.safeinturkiye.com'])expect(taxiMapKey(host,' live ',' test ')).toBe('live');
 for(const host of ['localhost','127.0.0.1','example.vercel.app','safeinturkiye.com.example.org']){
  expect(taxiMapKey(host,'live')).toBeUndefined();
  expect(taxiMapKey(host,'live',' test ')).toBe('test');
 }
 expect(taxiMapKey('www.safeinturkiye.com',' ','test')).toBeUndefined();
});
it('enforces safe baseline CSP without pretending the stricter provider allowlist is enforced',()=>{
 const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
 const headers=Object.fromEntries(config.headers[0].headers.map((h:{key:string;value:string})=>[h.key,h.value]));
 expect(headers['Content-Security-Policy']).toBe("object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
 expect(headers['Content-Security-Policy-Report-Only']).toContain('script-src');
 expect(headers['Permissions-Policy']).not.toContain('geolocation=()');
});
it('loads the packaged fallback map lazily without a third-party executable CDN',()=>{
 const app=fs.readFileSync('src/App.tsx','utf8'),map=fs.readFileSync('src/components/TaxiRouteMap.tsx','utf8');
 expect(app).toContain("lazy(()=>import('./components/TaxiRouteMap'))");
 expect(app).not.toContain('unpkg.com/leaflet');
 expect(map).toContain("import('leaflet')");
 expect(map).toContain('map?.remove()');
 expect(map).toContain('OpenStreetMap</a> contributors');
 expect(map).not.toContain('SUPABASE_SERVICE');
});
it('describes the actual fallback route without claiming it is an independent Google route',()=>{
 for(const lang of ['en','tr','de','fr','es','ar','ru','zh']){
  expect(taxiCalculationMapNotice[lang]).toContain('OSRM');
  expect(taxiCalculationMapNotice[lang]).not.toContain('Google');
 }
});
