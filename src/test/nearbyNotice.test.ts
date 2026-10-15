import {expect,it} from 'vitest';
import {nearbyNotice} from '../lib/nearbyNotice';
it.each(['en','tr','es','de','fr','ru','ar','zh'])('provides separate general and pharmacy notices in %s',language=>{
  const general=nearbyNotice(language,false);
  expect(general.length).toBeGreaterThan(15);
  expect(nearbyNotice(language,true)).toContain(general);
  expect(nearbyNotice(language,true).length).toBeGreaterThan(general.length);
  if(language!=='en')expect(general).not.toBe(nearbyNotice('en',false));
});
