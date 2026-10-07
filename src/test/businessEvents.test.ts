import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import handler from '../../api/business-events'
const fetchMock=vi.fn()
beforeEach(()=>{vi.stubGlobal('fetch',fetchMock);vi.stubEnv('BUSINESS_EVENT_ORIGINS','http://127.0.0.1:5193');vi.stubEnv('SUPABASE_URL','https://test.invalid');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only');fetchMock.mockResolvedValue({ok:true})})
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()})
async function call(body:unknown,origin='http://127.0.0.1:5193'){
 const response={status:vi.fn(),setHeader:vi.fn(),json:vi.fn()};response.status.mockReturnValue(response)
 await handler({method:'POST',headers:{origin},body},response);return response
}
it('rejects cross-origin submissions',async()=>{const res=await call({},'https://other.invalid');expect(res.status).toHaveBeenCalledWith(403);expect(fetchMock).not.toHaveBeenCalled()})
it('stores Google place identity and our event only, never Google content',async()=>{const res=await call({businessKey:'google/ChIJ_test',eventType:'impression',context:'nearby',name:'Discard',rating:5});expect(res.status).toHaveBeenCalledWith(200);expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({business_key:'google/ChIJ_test',event_type:'impression',context:'nearby'})})
it('accepts only the bounded event schema',async()=>{const res=await call({businessKey:'bad key',eventType:'detail_open',context:'detail'});expect(res.status).toHaveBeenCalledWith(400)})
it('does not forward contact details or user supplied timestamps',async()=>{
 const res=await call({businessKey:'restaurants/test-id',eventType:'detail_open',context:'detail',email:'discard@example.test',created_at:'1900-01-01'})
 expect(res.status).toHaveBeenCalledWith(200)
 expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({business_key:'restaurants/test-id',event_type:'detail_open',context:'detail'})
})
it('returns safe errors when storage is unavailable',async()=>{fetchMock.mockRejectedValue(new Error('private upstream detail'));const res=await call({businessKey:'hotels/test',eventType:'website_click',context:'hotels'});expect(res.json).toHaveBeenCalledWith({error:'UNAVAILABLE'})})
it('keeps intake disabled when server credentials are absent',async()=>{vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','');const res=await call({});expect(res.status).toHaveBeenCalledWith(503)})
