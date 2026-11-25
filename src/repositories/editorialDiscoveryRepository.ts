import {requireSupabase,supabaseConfigured} from '../lib/supabase'
import {foundationEnabled} from '../lib/foundationConfig'
import {editorialPlace,editorialTablesFor,validEditorialDetailId} from '../lib/editorialDiscovery'
import type {EditorialPlace,EditorialRow} from '../lib/editorialDiscovery'
import type {NearbyCategory,NearbyCenter} from '../services/nearbyPlaces'
import {rankedSponsorBusinesses} from './sponsorRepository'

export async function loadEditorialDiscovery(point:NearbyCenter,category:'all'|NearbyCategory,radius:number,signal:AbortSignal,context:string,detailId?:string):Promise<{places:EditorialPlace[];failed:boolean}>{
 if(!supabaseConfigured||detailId&&!validEditorialDetailId(detailId))return {places:[],failed:false}
 const [,detailTable,rowId]=detailId?.split(':')??[]
 const client=requireSupabase(),tables=editorialTablesFor(category).filter(table=>!detailTable||detailTable===table)
 const results=await Promise.allSettled(tables.map(async table=>{
  const query=client.from(table).select('*,city:cities(name,slug,active,status)').eq('active',true).eq('status','PUBLISHED')
  const result=await (rowId?query.eq('id',rowId).limit(1):query.order('id').limit(500)).abortSignal(signal)
  if(result.error)throw Error('EDITORIAL_UNAVAILABLE')
  return ((result.data??[]) as EditorialRow[]).flatMap(row=>{
   const place=editorialPlace(row,table,point,radius)
   return place?[{place,id:row.id,kind:table}]:[]
  })
 }))
 let failed=results.some(r=>r.status==='rejected')
 const entries=results.flatMap(result=>result.status==='fulfilled'?result.value:[])
 if(foundationEnabled&&['hotels','restaurants','activities'].includes(context)){
  try{
   const sponsors=await rankedSponsorBusinesses(client,context,entries.filter(e=>e.kind===context),signal)
   for(const entry of entries){
    const sponsor=sponsors.get(entry.kind+'/'+entry.id)
    if(sponsor){entry.place.editorial.sponsored=true;entry.place.editorial.sponsorPriority=sponsor.priority}
   }
  }catch{failed=true}
 }
 return {places:entries.map(entry=>entry.place),failed}
}
