import {combineDiscovery,editorialPlace} from '../lib/editorialDiscovery'
import {expect,it} from 'vitest'
import {createClient} from '@supabase/supabase-js'
import {loadCitySponsors, readPlacementCounts, saveSponsorPlacement} from '../repositories/sponsorRepository'
import {placementStatus, placementDateInput, placementTimestamp, sponsorContexts, placementContextPath} from '../lib/sponsorship'
import type {Placement, SponsorBusiness} from '../lib/sponsorship'

const example: SponsorBusiness = {id:'business',kind:'restaurants',slug:'our-restaurant',name:'Example',city_id:'local-city',description:'Published details',address:'Street',website:null,editorial_metadata:{coordinates:{lat:41,lng:29}}}
const city={id:'local-city',name:'İstanbul'}
const row: Placement={id:'order',business_id:example.id,business_kind:'restaurants',context:'restaurants',starts_at:'2026-12-31T21:15:00Z',ends_at:'2027-01-02T00:00:00Z',priority:10,active:true}
it('round-trips midnight and seconds in fixed Turkish civil time independent of the device',()=>{
 expect(placementDateInput(row.starts_at)).toBe('2027-01-01T00:15')
 expect(placementTimestamp('2027-01-01T00:15')).toBe('2026-12-31T21:15:00.000Z')
 expect(placementTimestamp(placementDateInput('2026-06-01T08:14:31.456Z'))).toBe('2026-06-01T08:14:31.456Z')
 expect(placementTimestamp('2027-02-30T12:00')).toBeNull()
})
it('uses the half-open publication window and checks whether a live order can be displayed',()=>{
 expect(placementStatus(row,true,Date.parse(row.starts_at)-1)).toBe('scheduled')
 expect(placementStatus(row,true,Date.parse(row.starts_at))).toBe('live')
 expect(placementStatus(row,true,Date.parse(row.ends_at))).toBe('expired')
 expect(placementStatus({...row,active:false},true,Date.parse(row.starts_at))).toBe('paused')
 expect(placementStatus({...row,active:false},true,Date.parse(row.ends_at))).toBe('expired')
 expect(placementStatus(row,false,Date.parse(row.starts_at))).toBe('unavailable')
})
it('offers only public surfaces that can display the business and links to the right city',()=>{
 expect(sponsorContexts(example,city)).toEqual(['city','restaurants'])
 expect(sponsorContexts({...example,address:''},city)).toEqual(['city'])
 expect(sponsorContexts({...example,slug:'beyti-florya'},city)).toEqual([])
 expect(sponsorContexts(example,undefined)).toEqual([])
 expect(placementContextPath('city',city)).toBe('/cities/istanbul')
 expect(placementContextPath('restaurants',city)).toBe('/restaurants?city=istanbul')
})
it('ranks distinct active businesses after scoping the server query to the selected city',async()=>{
 const requests: URL[]=[]
 const others=Array.from({length:15},(_,i)=>({...row,id:'other-'+i,business_id:'other-'+i,priority:100}))
 const inventory=[...others,{...row,id:'a',business_id:'a',priority:2},{...row,id:'b',business_id:'b',priority:10},{...row,id:'b-2',business_id:'b',priority:1},{...row,id:'wrong',business_id:'b',business_kind:'hotels',priority:999}]
 const client=createClient('https://fixture.test','public-fixture',{global:{fetch:async(input)=>{
  const url=new URL(String(input));requests.push(url)
  const table=url.pathname.split('/').pop(), query=url.searchParams
  let result:unknown
  if(table==='cities')result=city
  else if(table==='published_editorial_businesses')result=['a','b'].map(id=>({...example,id}))
  else {
   const ids=query.get('business_id')?.replace(/^in\.\(|\)$/g,'').split(',')
   result=inventory.filter(p=>!ids||ids.includes(p.business_id)).slice(0,Number(query.get('limit')??1000))
  }
  return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}})
 }}})
 const result=await loadCitySponsors(client,city.name,new AbortController().signal)
 expect(result.map(r=>r.id)).toEqual(['b','a'])
 expect(requests.find(r=>r.pathname.endsWith('/published_editorial_businesses'))?.searchParams.get('city_id')).toBe('eq.local-city')
 const query=requests.find(r=>r.pathname.endsWith('/sponsored_placements'))!.searchParams
 expect(query.get('business_id')).toContain('in.(a,b)')
 expect(query.get('context')).toBe('eq.city')
 expect(query.get('active')).toBe('eq.true')
 expect(query.get('starts_at')).toContain('lte.')
 expect(query.get('ends_at')).toContain('gt.')
})
it('counts only recorded business events in the placement window and context without retrieving raw events',async()=>{
 const requests:Request[]=[]
 const client=createClient('https://fixture.test','public-fixture',{global:{fetch:async(input,init)=>{
  requests.push(new Request(input,init))
  return new Response(null,{status:200,headers:{'content-range':'*/3'}})
 }}})
 expect(await readPlacementCounts(client,{...row,context:'city'},new AbortController().signal)).toEqual([{type:'impression',total:3}])
 const request=requests[0],q=new URL(request.url).searchParams
 expect(request.method).toBe('HEAD')
 expect(q.get('business_key')).toBe('eq.restaurants/business')
 expect(q.get('context')).toBe('eq.city')
 expect(q.getAll('created_at')).toEqual(['gte.'+row.starts_at,'lt.'+row.ends_at])
})
it('orders two eligible directory sponsors by priority before using distance as the tiebreaker',()=>{
 const point={lat:41,lng:29}
 const base={...example,active:true,status:'PUBLISHED',city:{name:'İstanbul',active:true,status:'PUBLISHED'}}
 const near=editorialPlace(base,'restaurants',point,5000,true)!
 const far=editorialPlace({...base,id:'far',editorial_metadata:{coordinates:{lat:41.01,lng:29}}},'restaurants',point,5000,true)!
 far.editorial.sponsorPriority=60
 expect(combineDiscovery([],[near,far],'restaurant').map(place=>place.id)).toEqual([far.id,near.id])
 near.editorial.sponsorPriority=60
 expect(combineDiscovery([],[far,near],'restaurant').map(place=>place.id)).toEqual([near.id,far.id])
})
it('reconciles a retried insert using its original ID and verifies all intended values before reporting success',async()=>{
 const {id,...values}=row
 const methods:string[]=[],queries:URL[]=[]
 const client=createClient('https://fixture.test','public-fixture',{global:{fetch:async(input,init)=>{
  const method=init?.method??'GET'
  methods.push(method);queries.push(new URL(String(input)))
  if(method==='POST'){
   expect(JSON.parse(String(init?.body))).toEqual(row)
   return Response.json({code:'23505',message:'duplicate key'},{status:409})
  }
  return Response.json([row])
 }}})
 expect(await saveSponsorPlacement(client,id,null,values)).toEqual(row)
 expect(methods).toEqual(['POST','GET'])
 for(const [key,value] of Object.entries(row))expect(queries[1].searchParams.get(key)).toBe('eq.'+value)
})
it('rejects a concurrent edit when the stored row matches neither the original nor the intended update',async()=>{
 const methods:string[]=[],queries:URL[]=[]
 const client=createClient('https://fixture.test','public-fixture',{global:{fetch:async(input,init)=>{
  methods.push(init?.method??'GET');queries.push(new URL(String(input)))
  if(init?.method==='PATCH')return Response.json({code:'PGRST116',message:'zero rows'},{status:406})
  return Response.json([])
 }}})
 await expect(saveSponsorPlacement(client,row.id,row,{priority:77})).rejects.toThrow('SPONSOR_WRITE_NOT_CONFIRMED')
 expect(methods).toEqual(['PATCH','GET'])
 expect(queries[0].searchParams.get('priority')).toBe('eq.10')
 expect(queries[1].searchParams.get('priority')).toBe('eq.77')
})
