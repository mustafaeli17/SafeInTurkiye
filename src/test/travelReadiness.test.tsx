import {afterEach, expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {EmergencyCardLink} from '../components/SafetyTips';
import {practicalFaq} from '../data/practicalFaq';
import {loadAdminReservations} from '../repositories/adminBookingRepository';
import {requireSupabase} from '../lib/supabase';
import {productConsent,productPageUrl} from '../lib/productMetrics';
import {setTransitHandoff,peekTransitHandoff,clearTransitHandoff} from '../lib/transitHandoff';

vi.mock('../lib/supabase',()=>({requireSupabase:vi.fn()}));
afterEach(()=>{vi.clearAllMocks();clearTransitHandoff()});

it.each([true,false])('looks up a reservation by exact reference before pagination with callback schema %s',async(hasQueue)=>{
 const records=Array.from({length:61},(_,i)=>({reference_code:'SIT-2026-'+String(i+1).padStart(7,'0')}));
 let matches=records,table='';
 const query={select:vi.fn(()=>query), eq:vi.fn((key:string,value:string)=>{if(key==='reference_code') matches=matches.filter(r=>r.reference_code===value); return query}),order:vi.fn(()=>query),range:vi.fn((from:number,to:number)=>{matches=matches.slice(from,to+1);return query}),abortSignal:vi.fn(async()=>{
  if(table==='admin_restaurant_call_queue'&&!hasQueue)return {data:null,count:null,error:{code:'PGRST205'}};
  return {data:matches,count:matches.length,error:null};
 })};
 vi.mocked(requireSupabase).mockReturnValue({from:(source:string)=>{table=source;matches=records;return query}} as unknown as ReturnType<typeof requireSupabase>);
 const {rows,total}=await loadAdminReservations('',0,undefined,50,records[60].reference_code);
 expect(total).toBe(1);expect(rows[0].reference_code).toBe(records[60].reference_code);
 if(!hasQueue)expect(query.eq).toHaveBeenCalledWith('listing_type','restaurant');
});

it('exposes only clean taxi and tours paths for optional analytics',()=>{
 expect(productConsent()).toBe(false);
 expect(productPageUrl('https://www.safeinturkiye.com/es/tours?q=private')).toBe('https://www.safeinturkiye.com/es/tours');
 for(const url of ['https://preview.example/taxi','https://safeinturkiye.com/taxi#admin','https://safeinturkiye.com:9999/taxi','https://safeinturkiye.com/contact','https://name@safeinturkiye.com/taxi'])expect(productPageUrl(url)).toBeNull();
});

it('can consume and clear the transit handoff without writing to browser storage',()=>{
 const trip={origin:{lat:41,lng:29,label:'Origin'},destination:{lat:41.1,lng:29.1,label:'Destination'}};
 setTransitHandoff(trip);expect(peekTransitHandoff()).toEqual(trip);clearTransitHandoff();expect(peekTransitHandoff()).toBeNull();
});

it.each(Object.keys(practicalFaq))('provides a self-contained local emergency card in %s',lang=>{
 const html=renderToStaticMarkup(<EmergencyCardLink lang={lang}/>);
 const href=html.match(/href="data:text\/plain;charset=utf-8,([^"]+)"/)?.[1];
 expect(href).toBeTruthy();
 const text=decodeURIComponent(href!);
 expect(text).toContain('112');expect(text).toContain(practicalFaq[lang][0][1]);expect(text).toContain('afad.gov.tr');
 expect(html).toContain('download="SafeInTurkiye-112-'+lang+'.txt"');
});
