// Used only by scripts/admin-workflow-dev.mjs; never imported by production.
export const supabaseConfigured=true;
class Query{
 table:string;action='select';fields='*';filters:unknown[]=[];payload:unknown;options:unknown;sort:unknown[]=[];offset=0;take=50;singleRow=false;
 constructor(table:string){this.table=table;}
 select(fields='*',options?:unknown){this.fields=fields;this.options=options;return this;}
 eq(field:string,value:unknown){this.filters.push([field,value]);return this;}
 ilike(field:string,value:string){this.filters.push([field,value,'ilike']);return this;}
 regexIMatch(field:string,value:string){this.filters.push([field,value,'imatch']);return this;}
 in(field:string,value:unknown[]){this.filters.push([field,value,'in']);return this;}
 gte(field:string,value:string){this.filters.push([field,value,'gte']);return this;}
 gt(field:string,value:string){this.filters.push([field,value,'gt']);return this;}
 lte(field:string,value:string){this.filters.push([field,value,'lte']);return this;}
 lt(field:string,value:string){this.filters.push([field,value,'lt']);return this;}
 or(value:string){this.filters.push(['',value,'or']);return this;}
 not(field:string,operator:string,value:unknown){this.filters.push([field,value,'not.'+operator]);return this;}
 order(field:string,options?:unknown){this.sort.push([field,options]);return this;}
 range(from:number,to:number){this.offset=from;this.take=to-from+1;return this;}
 limit(count:number){this.take=count;return this;}
 insert(payload:unknown){this.action='insert';this.payload=payload;return this;}
 update(payload:unknown){this.action='update';this.payload=payload;return this;}
 abortSignal(_signal:AbortSignal){return this;}
 single(){this.singleRow=true;return this;}
 maybeSingle(){this.singleRow=true;return this;}
 then(resolve:(value:any)=>unknown,reject?:(error:unknown)=>unknown){return fetch('/__qa/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(this)}).then(r=>r.json()).then(resolve,reject);}
}
// Match Supabase's limit method without colliding with the stored numeric limit.
export function requireSupabase(){return {from:(table:string)=>new Query(table),rpc:(name:string,args:Record<string,unknown>)=>{const q=new Query(name);q.action='rpc';q.payload=args;return q;},auth:{getSession:async()=>({data:{session:{access_token:'LOCAL_TEST_ONLY_ADMIN'}}})}};}
