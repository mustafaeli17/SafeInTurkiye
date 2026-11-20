import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {track} from '@vercel/analytics';

vi.mock('@vercel/analytics',()=>({track:vi.fn()}));
beforeEach(()=>{
 vi.resetModules();vi.stubEnv('PROD',true);vi.stubEnv('VITE_PRODUCT_METRICS_ENABLED','true');
 vi.stubGlobal('window',{location:{href:'https://www.safeinturkiye.com/es/tours?city=istanbul&q=private'}});
 vi.stubGlobal('navigator',{doNotTrack:'0'});
});
afterEach(()=>{vi.clearAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs()});

it('sends only the event name and language after the visitor opts in',async()=>{
 const getItem=vi.fn().mockReturnValue(null);vi.stubGlobal('localStorage',{getItem});
 const {trackProduct}=await import('../lib/productMetrics');
 trackProduct('tours_results','es');expect(track).not.toHaveBeenCalled();
 getItem.mockReturnValue('yes');trackProduct('tours_results','es');
 expect(track).toHaveBeenCalledExactlyOnceWith('tours_results',{language:'es'});
 getItem.mockReturnValue(null);trackProduct('tours_results','es');expect(track).toHaveBeenCalledTimes(1);
});
it('rejects privacy overrides, cross-feature events and unexpected language values',async()=>{
 vi.stubGlobal('localStorage',{getItem:()=> 'yes'});
 const {trackProduct}=await import('../lib/productMetrics');
 trackProduct('taxi_estimate','es');trackProduct('viator_open','some address');
 for(const flags of [{globalPrivacyControl:true},{doNotTrack:'1'}]){
  vi.stubGlobal('navigator',flags);trackProduct('viator_open','es');
 }
 expect(track).not.toHaveBeenCalled();
});
