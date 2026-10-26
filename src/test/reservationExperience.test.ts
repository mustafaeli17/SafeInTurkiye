import {afterEach,expect,it,vi} from 'vitest';
import {restaurantToday,validBookingTime} from '../lib/bookingTime';
import {clearReservationDraft,readReservationDraft,reservationAttempt,writeReservationDraft} from '../lib/reservationDraft';
import {reservationExperienceCopy} from '../lib/reservationExperienceCopy';
import {reservationEmail} from '../../server/restaurantRequests';
import {pendingReceipt,saveReceipt} from '../lib/reservationClient';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it('keeps only deduplication tokens across a reload, without unsubmitted personal details',()=>{
 const data=new Map<string,string>();vi.stubGlobal('sessionStorage',{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value),removeItem:(key:string)=>data.delete(key)});
 const first=pendingReceipt('qa-identity');expect(pendingReceipt('qa-identity')).toEqual(first);expect([...data.values()].join('')).not.toMatch(/guest|email|phone|notes/);
 saveReceipt('qa-identity',{...first,reference:'SIT-2026-1',expires:Date.now()+86400000});expect(data.has('sit:pending:qa-identity')).toBe(false);
});
it('uses the restaurant day and time at UTC midnight boundaries',()=>{
 const now=Date.parse('2030-05-01T22:30:00Z');expect(restaurantToday(now)).toBe('2030-05-02');expect(validBookingTime('2030-05-02','01:00',now)).toBe(false);expect(validBookingTime('2030-05-02','02:00',now)).toBe(true);
});
it('preserves drafts across locale remounts without sharing fields between restaurants',()=>{
 const data={...readReservationDraft('a'),name:'Private guest',date:'2030-05-02',time:'19:00',guests:'4'};writeReservationDraft('a',data,1000);
 expect(readReservationDraft('a',1001)).toEqual(data);expect(readReservationDraft('b',1001).name).toBe('');expect(readReservationDraft('a',1000+30*60000).name).toBe('');clearReservationDraft('a');
});
it('keeps an ambiguous submission identity across remounts and retries',()=>{
 const create=vi.fn(()=>({requestId:'test-id',receiptToken:'test-secret'}));expect(reservationAttempt('retry',create)).toEqual(reservationAttempt('retry',create));expect(create).toHaveBeenCalledTimes(1);clearReservationDraft('retry');reservationAttempt('retry',create);expect(create).toHaveBeenCalledTimes(2);clearReservationDraft('retry');
});
it('provides complete localized helper copy for all eight locales',()=>{
 expect(Object.keys(reservationExperienceCopy).sort()).toEqual(['ar','de','en','es','fr','ru','tr','zh']);for(const [lang,copy]of Object.entries(reservationExperienceCopy)){expect(copy).toHaveLength(14);expect(copy.every(Boolean)).toBe(true);if(lang!=='en')expect(copy[0]).not.toBe(reservationExperienceCopy.en[0]);}
});
it('sends an escaped mobile email with authenticated deep link and no guest data',()=>{
 vi.stubEnv('VERCEL_ENV','production');const mail=reservationEmail('<script>Bad</script>','SIT-2026-123');expect(mail.html).not.toContain('<script>');expect(mail.html).toContain('&lt;script&gt;');expect(mail.html).toContain('Talebi yönet');expect(mail.text).toContain('#admin?section=reservations&request=SIT-2026-123');expect(mail.html).not.toContain('receiptToken');
});
