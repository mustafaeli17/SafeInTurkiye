// Public RLS only: this build step never needs a service-role credential.
export async function publishedEditorialSnapshot(url,key,fetcher=fetch){
 if(!url||!key)throw Error('CMS build requires public Supabase configuration')
 const read=async(table,select)=>{
  const rows=[]
  for(let offset=0;;offset+=500){
   const response=await fetcher(`${url}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=id.asc&offset=${offset}&limit=500`,{headers:{apikey:key},signal:AbortSignal.timeout(12000)})
   if(!response.ok)throw Error(`CMS snapshot failed (${response.status}); legacy fallback refused`)
   const page=await response.json();if(!Array.isArray(page))throw Error('Invalid CMS snapshot')
   rows.push(...page);if(page.length<500)return rows
   if(offset>=100000)throw Error('Unexpected CMS snapshot size')
  }
 }
 const [businesses,cities]=await Promise.all([read('published_editorial_businesses','*'),read('cities','id,name')])
 const paths=new Set()
 return businesses.map(row=>{
  if(!['hotels','restaurants','activities'].includes(row.kind)||!row.slug||!row.name)throw Error('Invalid published route')
  const path=`/${row.kind}/${row.slug}`;if(paths.has(path))throw Error('Duplicate CMS route');paths.add(path)
  const meta=row.editorial_metadata??{}
  return {...meta,id:row.id,kind:row.kind,slug:row.slug,name:row.name,address:row.address,website:row.website,city:cities.find(city=>city.id===row.city_id)?.name??'',description:{...meta.description,en:row.description??''}}
 })
}
