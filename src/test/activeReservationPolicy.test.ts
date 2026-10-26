import {expect,it} from 'vitest';
import {activeReservationPrivacy,activeReservationContact} from '../lib/activeReservationPolicy';
it('covers the approved retention policy and emergency caveat in every supported language',()=>{
 for(const lang of ['en','tr','de','fr','es','ar','ru','zh']){
  expect(activeReservationPrivacy[lang]).toContain('90');
  expect(activeReservationPrivacy[lang]).toContain('Supabase');
  expect(activeReservationPrivacy[lang]).toContain('Resend');
  expect(activeReservationContact[lang]).toContain('112');
 }
});
