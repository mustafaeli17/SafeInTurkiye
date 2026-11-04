import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {privacyDetails} from '../lib/privacyDetails';

it('documents browser storage and privacy controls in all supported languages',()=>{
 for(const language of ['en','tr','de','fr','es','ar','ru','zh']){
  expect(privacyDetails[language]).toContain('Global Privacy Control');
  expect(privacyDetails[language]).toContain('Do Not Track');
 }
});
it('serves the font locally with its redistribution license, without Google font connections',()=>{
 const html=readFileSync('index.html','utf8');
 expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
 expect(readFileSync('public/fonts/InterVariable.woff2').subarray(0,4).toString()).toBe('wOF2');
 expect(readFileSync('public/fonts/Inter-LICENSE.txt','utf8')).toContain('SIL OPEN FONT LICENSE');
});
