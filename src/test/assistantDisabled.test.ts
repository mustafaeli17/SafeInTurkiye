import {afterEach,expect,it,vi} from 'vitest';
import handler from '../../api/assistant';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it.each(['POST','GET'])('retired assistant never calls a provider for %s even with a configured key',async method=>{
  vi.stubEnv('GEMINI_API_KEY','test-not-a-real-key');
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
  const res={status:vi.fn().mockReturnThis(),json:vi.fn()};
  await handler({method,body:{prompt:'hello'}},res);
  expect(res.status).toHaveBeenCalledWith(method==='POST'?503:405);
  expect(fetcher).not.toHaveBeenCalled();
});
