import {requireSupabase,supabaseConfigured} from '../lib/supabase';
import {foundationEnabled} from '../lib/foundationConfig';
import {editorialPlace,editorialTablesFor} from '../lib/editorialDiscovery';
import type {EditorialPlace,EditorialRow,EditorialTable} from '../lib/editorialDiscovery';
import type {NearbyCategory,NearbyCenter} from '../services/nearbyPlaces';
export async function loadEditorialDiscovery(point:NearbyCenter,category:'all'|NearbyCategory,radius:number,signal:AbortSignal,context:string):Promise<{places:EditorialPlace[];failed:boolean}>{
 if(!supabaseConfigured)return {places:[],failed:false};
 const client=requireSupabase(),tables=editorialTablesFor(category);
 const results=await Promise.all(tables.map(async table=>{
  const result=await client.from(table).select('*,city:cities(name,slug,active,status)').eq('active',true).eq('status','PUBLISHED').order('id').limit(500).abortSignal(signal);
  if(result.error)throw Error('EDITORIAL_UNAVAILABLE');
  return {table,rows:(result.data??[]) as EditorialRow[]};
 }).map(p=>p.then(value=>({value,error:false}),()=>({value:null,error:true}))));
 const sponsors=new Set<string>();let failed=results.some(r=>r.error);
 if(foundationEnabled&&['hotels','restaurants','activities'].includes(context)){
  try{const now=new Date().toISOString();const result=await client.from('sponsored_placements').select('business_id,business_kind').eq('context',context).eq('active',true).lte('starts_at',now).gt('ends_at',now).limit(100).abortSignal(signal);if(result.error)throw Error();for(const row of result.data??[])sponsors.add(`${row.business_kind}/${row.business_id}`);}catch{failed=true;}
 }
 const places=results.flatMap(result=>result.value?.rows.map(row=>editorialPlace(row,result.value!.table as EditorialTable,point,radius,sponsors.has(`${result.value!.table}/${row.id}`))).filter((p):p is EditorialPlace=>p!==null)??[]);
 return {places,failed};
}
