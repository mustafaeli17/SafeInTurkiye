import {createHash} from 'node:crypto'
// The pre-API catalog was retired. Its import must remain empty.
export async function foundationCatalog(){return []}
const quote=value=>value==null?'null':`'${String(value).replaceAll("'","''")}'`
const id=key=>{const h=createHash('sha256').update('safeinturkiye:editorial:v1:'+key).digest('hex').slice(0,32);return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`}
export function catalogSeed(rows){
 const sql=['-- Prepared only. Requires 0001–0005. Review production conflicts before approval.','-- Existing CMS edits/publication are NEVER overwritten. New rows remain DRAFT.','begin;']
 for(const name of new Set(rows.map(e=>e.city))){
  const slug=name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
  sql.push(`insert into cities(id,name,slug,status,active) select ${quote(id('cities/'+slug))},${quote(name)},${quote(slug)},'DRAFT',true where not exists(select 1 from cities where name=${quote(name)}) on conflict do nothing;`)
 }
 for(const e of rows){
  const key=`${e.kind}/${e.slug}`
  sql.push(`do $$ begin
 if (select count(*) from cities where name=${quote(e.city)})<>1 then raise exception 'Ambiguous city for ${key}'; end if;
 if exists(select 1 from ${e.kind} where public_slug=${quote(e.slug)} and editorial_key is distinct from ${quote(key)}) then raise exception 'Slug conflict for ${key}'; end if;
 if exists(select 1 from ${e.kind} e join cities c on c.id=e.city_id where c.name=${quote(e.city)} and lower(trim(e.name))=lower(trim(${quote(e.name)})) and e.editorial_key is distinct from ${quote(key)}) then raise exception 'Identity conflict for ${key}'; end if;
 end $$;`)
  sql.push(`insert into ${e.kind}(id,city_id,name,description,address,website,status,active,verification_status,public_slug,editorial_key,editorial_metadata) select ${quote(id(key))},c.id,${quote(e.name)},${quote(e.description?.en??'')},${quote(e.address)},${quote(e.website)},'DRAFT',true,'UNVERIFIED',${quote(e.slug)},${quote(key)},${quote(JSON.stringify(e))}::jsonb from cities c where c.name=${quote(e.city)} and not exists(select 1 from ${e.kind} where editorial_key=${quote(key)});`)
 }
 return sql.concat('commit;').join('\n')+'\n'
}
