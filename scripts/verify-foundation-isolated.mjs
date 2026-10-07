// Explicitly locked to the disposable test project. No production writes.
import {createClient} from '@supabase/supabase-js'
import {randomBytes} from 'node:crypto'
import {writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
process.loadEnvFile('.env.foundation.local')
const url=process.env.SUPABASE_URL
if(url!=='https://qctltygvdxpzdaliczig.supabase.co')throw Error('Wrong project; stopped')
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}})
const suffix=Date.now(),users=[]
for(const role of ['admin','one','two']){
 const email=`foundation-${role}-${suffix}@example.test`,password=randomBytes(24).toString('base64url')
 const result=await admin.auth.admin.createUser({email,password,email_confirm:true})
 if(result.error)throw result.error
 users.push({role,email,password,id:result.data.user.id})
}
const first=users[0]
const profile=await admin.from('profiles').update({role:'admin'}).eq('id',first.id)
if(profile.error)throw profile.error
const city=await admin.from('cities').insert({name:`Isolated foundation ${suffix}`,slug:`foundation-${suffix}`,status:'PUBLISHED',active:true}).select('id').single()
if(city.error)throw city.error
const restaurant=await admin.from('restaurants').insert({name:'Isolated test restaurant',city_id:city.data.id,description:'Test fixture, not a real business',address:'Test only',public_slug:`foundation-test-${suffix}`,status:'PUBLISHED',active:true}).select('id,public_slug').single()
if(restaurant.error)throw restaurant.error
const clients=[]
for(const user of users){const client=createClient(url,process.env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false}});const result=await client.auth.signInWithPassword({email:user.email,password:user.password});if(result.error)throw result.error;clients.push(client)}
const [staff,one,two]=clients
const booking=await one.from('bookings').insert({user_id:users[1].id,listing_type:'restaurant',listing_name:'Isolated test restaurant',guest_name:'Test User',guest_email:users[1].email,guest_phone:'+900000000000',visit_date:'2030-01-01',visit_time:'19:00',guest_count:2}).select('id,status').single()
if(booking.error)throw booking.error
assert.equal(booking.data.status,'PENDING')
assert.deepEqual((await two.from('bookings').select('id').eq('id',booking.data.id)).data,[])
const update=await staff.from('bookings').update({status:'CONFIRMED',contact_stage:'CONTACTED'}).eq('id',booking.data.id).select('id').single();if(update.error)throw update.error
assert.equal((await one.from('bookings').select('status').eq('id',booking.data.id).single()).data.status,'CONFIRMED')
for(const status of ['DRAFT','ARCHIVED','PUBLISHED']){
 const update=await staff.from('restaurants').update({status}).eq('id',restaurant.data.id);if(update.error)throw update.error
 const result=await one.from('published_editorial_businesses').select('id').eq('id',restaurant.data.id);if(result.error)throw result.error
 assert.equal(result.data.length,status==='PUBLISHED'?1:0)
}
await writeFile('tmp/foundation-test-users.json',JSON.stringify({users,restaurant:restaurant.data},null,2))
console.log('Isolated Supabase Auth + REST: ownership, staff confirmation, published/draft/archived checks PASS. Test credentials kept only in ignored tmp file.')
