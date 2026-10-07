import {createClient} from '@supabase/supabase-js'
import {readFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
process.loadEnvFile('.env.foundation.local')
const url=process.env.SUPABASE_URL
if(url!=='https://qctltygvdxpzdaliczig.supabase.co')throw Error('Wrong project; stopped')
const fixtures=JSON.parse(await readFile('tmp/foundation-test-users.json','utf8'))
const key=`restaurants/${fixtures.restaurant.id}`
const result=await fetch('http://127.0.0.1:5193/api/business-events',{method:'POST',headers:{Origin:'http://127.0.0.1:5193','Content-Type':'application/json'},body:JSON.stringify({businessKey:key,eventType:'detail_open',context:'detail'})})
assert.equal(result.status,200,'Local event intake must persist successfully')
for(const role of ['admin','one']){
 const user=fixtures.users.find(user=>user.role===role)
 const client=createClient(url,process.env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false}})
 const auth=await client.auth.signInWithPassword({email:user.email,password:user.password});if(auth.error)throw auth.error
 const metrics=await client.from('business_metrics').select('total').eq('business_key',key).eq('event_type','detail_open')
 if(metrics.error)throw metrics.error
 assert.equal(metrics.data.length,role==='admin'?1:0)
 if(role==='admin')assert.ok(Number(metrics.data[0].total)>=1)
}
console.log('Real event intake → isolated database → admin metrics PASS; ordinary user cannot read metrics.')
