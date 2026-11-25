import {createClient} from '@supabase/supabase-js'
import {expect,it} from 'vitest'
import {metricNames} from '../lib/sponsorship'
import {loadBusinessMetrics} from '../repositories/adminBusinessMetrics'

const events=Object.keys(metricNames)
const signal=new AbortController().signal
const rows=['2026-11','2026-10'].flatMap(month=>Array.from({length:14},(_,i)=>
 events.slice(0,i%2===0?6:7).map(event_type=>({
  business_key:'google/b'+String(i).padStart(2,'0'),month_start:month+'-01T00:00:00Z',event_type,total:i+1,
 }))
).flat())
function clientFor(source=rows){
 return createClient('https://test.invalid','fixture',{
  global:{fetch:async input=>{
   const url=new URL(String(input)), params=url.searchParams
   expect(url.pathname).toBe('/rest/v1/business_metrics')
   const selected=source.filter(r=>params.getAll('month_start').every(condition=>{
    const [operator,stamp]=[condition.slice(0,condition.indexOf('.')),condition.slice(condition.indexOf('.')+1)]
    const date=Date.parse(r.month_start), limit=Date.parse(stamp)
    return operator==='eq'?date===limit:operator==='lt'?date<limit:date>=limit
   })&&(!params.has('business_key')||r.business_key>params.get('business_key')!.slice(3)))
   return Response.json(selected.slice(0,Number(params.get('limit'))))
  }},
 })
}
it('keeps every business/month together across page and month boundaries',async()=>{
 const client=clientFor()
 const found:string[]=[]
 let cursor=null
 for(let i=0;i<5;i++){
  const result=await loadBusinessMetrics(client,'',cursor,signal)
  for(const group of result.groups){
   const key=group[0].month_start+'@'+group[0].business_key
   expect(found).not.toContain(key)
   found.push(key)
   expect(group).toHaveLength(rows.filter(r=>r.business_key===group[0].business_key&&r.month_start===group[0].month_start).length)
  }
  cursor=result.next
  if(!cursor)break
 }
 expect(found).toHaveLength(28)
})
it('stays in the selected month on the last page and on an empty month',async()=>{
 const client=clientFor()
 const first=await loadBusinessMetrics(client,'2026-11',null,signal)
 expect(first.next).not.toBeNull()
 const second=await loadBusinessMetrics(client,'2026-11',first.next,signal)
 expect(second.next).toBeNull()
 expect([...first.groups,...second.groups].map(g=>g[0].business_key)).toEqual(Array.from({length:14},(_,i)=>'google/b'+String(i).padStart(2,'0')))
 expect((await loadBusinessMetrics(client,'2027-01',null,signal)).groups).toEqual([])
})
it('distinguishes a malformed or failed response from a genuine empty reporting period',async()=>{
 for(const response of [Response.json(null),Response.json({code:'42501',message:'Denied'},{status:403})]){
  const client=createClient('https://test.invalid','fixture',{global:{fetch:async()=>response}})
  await expect(loadBusinessMetrics(client,'2026-11',null,signal)).rejects.toThrow()
 }
})
