import {expect,it} from 'vitest'
import {rememberSelectedPlace,selectedPlace} from '../lib/selectedDiscovery'
import {readReservationDraft,writeReservationDraft,clearReservationDraft} from '../lib/reservationDraft'
import {parseGooglePlaces} from '../services/googleNearby'
import {transitStages,transitSummary,transitTime,transferCount,transitFare,type TransitRoute} from '../lib/transit'
const raw=(id:string,types?:string[])=>({id,types,displayName:{text:id},location:{latitude:41,longitude:29},googleMapsUri:'https://maps.google.com/?cid=1'})
it('keeps the selected restaurant and its private draft when a locale returns different results',()=>{
 const a=parseGooglePlaces({places:[raw('a',['restaurant'])]},{lat:41,lng:29},'restaurant').places[0]
 const b={...a,id:'google:b'}
 rememberSelectedPlace(a,1000)
 const draft={...readReservationDraft(a.id),name:'TEST ONLY',date:'2030-01-02',time:'19:30',guests:'4'}
 writeReservationDraft(a.id,draft,1000)
 for(const results of [[a],[],[b],[a]])expect(selectedPlace(a.id,results,1100)?.id).toBe(a.id)
 expect(readReservationDraft(a.id,1100)).toEqual(draft)
 expect(selectedPlace(b.id,[],1100)).toBeNull()
 expect(readReservationDraft(b.id,1100).name).toBe('')
 expect(selectedPlace(a.id,[],901001)).toBeNull()
 clearReservationDraft(a.id)
})
it.each([undefined,[],['performing_arts_theater'],['event_venue','park']])('rejects unproven cinema type %j',types=>{
 expect(parseGooglePlaces({places:[raw('not-cinema',types)]},{lat:41,lng:29},'cinema').places).toEqual([])
})
it('accepts primary and genuine secondary movie theater types, not names',()=>{
 const places=[{...raw('primary',[]),primaryType:'movie_theater'},raw('mixed',['performing_arts_theater','movie_theater'])]
 expect(parseGooglePlaces({places},{lat:41,lng:29},'cinema').places).toHaveLength(2)
})
it('groups adjacent walks without adding child steps twice or changing route duration',()=>{
 const route:TransitRoute={duration:'1920s',legs:[{steps:[
  {travelMode:'WALK',staticDuration:'40s',distanceMeters:30,navigationInstruction:{instructions:'Turn left'}},
  {travelMode:'WALK',staticDuration:'50s',distanceMeters:40,navigationInstruction:{instructions:'Continue'}},
  {travelMode:'TRANSIT',transitDetails:{stopDetails:{departureTime:'2030-01-01T20:55:00Z',arrivalTime:'2030-01-01T21:10:00Z'}}},
  {travelMode:'WALK',staticDuration:'60s',distanceMeters:45},
 ]}]}
 const stages=transitStages(route)
 expect(stages).toHaveLength(3)
 expect(stages[0]).toMatchObject({staticDuration:'90s',distanceMeters:70,instructions:['Turn left','Continue']})
 expect(transitSummary(route)).toMatchObject({walkingMinutes:3,transfers:0})
 expect(route.duration).toBe('1920s')
 expect(transitTime('2030-01-01T20:55:00Z','en')).toContain('1')
 expect(transitTime('2030-01-01T21:10:00Z','en')).toContain('2')
 expect(transitTime('2030-01-01T21:10:00Z','en')).toContain('00:10')
 expect(transitFare(route,'en')).toBeNull()
})
it('does not fabricate missing walk duration and handles zero/one transfers',()=>{
 const route:TransitRoute={duration:'120s',legs:[{steps:[{travelMode:'WALK',staticDuration:'30s'},{travelMode:'WALK'}]}]}
 expect(transitStages(route)[0].staticDuration).toBeUndefined()
 expect(transitSummary(route).walkingMinutes).toBeUndefined()
 expect(transferCount(0,'en')).toBe('0 transfers')
 expect(transferCount(1,'en')).toBe('1 transfer')
 expect(transferCount(2,'en')).toBe('2 transfers')
 expect(transitTime(undefined,'tr')).toBe('')
})
