import {expect,it} from 'vitest';
import {filterDiscovery} from '../lib/discoveryFilters';
import {transitSummary} from '../lib/transit';
import {isTestReservation,reservationWaiting} from '../lib/adminReservations';
import {readFileSync} from 'node:fs';
it('does not assume unknown opening status or rating and does not mutate provider order',()=>{
 const base={category:'hotel' as const,coordinates:{lat:41,lng:29},name:'QA',address:null,phone:null,telephoneUrl:null,website:null,sourceUrl:'https://maps.google.com/',openingHours:null};
 const places=[{...base,id:'unknown',distanceMeters:100},{...base,id:'closed',distanceMeters:200,rating:4.9,openNow:false},{...base,id:'open',distanceMeters:300,rating:4.5,openNow:true}];
 expect(filterDiscovery(places,new URLSearchParams('open=true&minRating=4')).map(p=>p.id)).toEqual(['open']);
 expect(filterDiscovery(places,new URLSearchParams('order=rating')).map(p=>p.id)).toEqual(['closed','open','unknown']);expect(places[0].id).toBe('unknown');
});
it('summarises boarding, walking and transfers without inventing waiting or fares',()=>{
 const route={duration:'3600s',legs:[{steps:[{travelMode:'WALK',staticDuration:'300s'},{travelMode:'TRANSIT',transitDetails:{transitLine:{nameShort:'M2'},stopDetails:{departureTime:'2030-01-01T10:10:00Z',arrivalTime:'2030-01-01T10:30:00Z'}}},{travelMode:'WALK',staticDuration:'180s'}]}]};
 expect(transitSummary(route)).toEqual({boarding:'2030-01-01T10:10:00Z',alighting:'2030-01-01T10:30:00Z',walkingMinutes:8,transfers:0,lines:['M2']});
});
it('separates explicitly labelled test records and calculates pending age only when known',()=>{
 expect(isTestReservation({guest_name:'TEST ONLY — QA'})).toBe(true);expect(isTestReservation({guest_name:'Guest'})).toBe(false);
 expect(reservationWaiting({status:'PENDING',created_at:'2030-01-01T10:00:00Z'} as any,Date.parse('2030-01-01T11:05:00Z'))).toBe('1 sa 5 dk');
});
it('draws taxi calculation geometry even when an independent embed key exists',()=>{
 const source=readFileSync('src/components/TaxiRouteMap.tsx','utf8');expect(source).toContain('if(key&&!geometry?.length)return');expect(source).toContain('L.polyline(geometry.map');
});
it('routes transfer searches to explicit options, preserving city and query in history',()=>{
 const source=readFileSync('src/App.tsx','utf8');expect(source).toContain("if (transferIntent(query)) navigateSearch('transit')");expect(source).toContain('new URLSearchParams({q:query})');expect(source).toContain("params.set('intent','transfer')");
});
it('preloads the responsive hero only on the home document, without downloading it for other routes',()=>{
 expect(readFileSync('dist/index.html','utf8')).toContain('rel="preload" as="image"');
 for(const route of ['transport','restaurants','hotels','cities/istanbul'])expect(readFileSync(`dist/${route}/index.html`,'utf8')).not.toContain('rel="preload" as="image"');
});
