export type ReservationRow={id:string;reference_code:string;listing_name:string;guest_name:string;guest_email:string;guest_phone?:string|null;visit_time?:string|null;visit_date:string;guest_count:number;notes:string|null;status:string;contact_stage?:string;created_at?:string;updated_at?:string};
export const adminStatus:Record<string,string>={PENDING:'Yeni talep',CONFIRMED:'Onaylandı',REJECTED:'Reddedildi',CANCELLED:'İptal edildi'};
export function reservationDetails(row:ReservationRow){
 let old:Record<string,unknown>={};try{const parsed=JSON.parse(row.notes??'');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))old=parsed;}catch{/* Old notes can be plain text. */}
 const text=(value:unknown)=>typeof value==='string'?value:'';
 return {phone:row.guest_phone||text(old.phone),time:row.visit_time?.slice(0,5)||text(old.time),note:typeof old.notes==='string'?old.notes:row.notes??'',source:text(old.source)};
}
export function reservationMatches(row:ReservationRow,search:string,status:string){
 return (!status||row.status===status)&&[row.reference_code,row.listing_name,row.guest_name,row.guest_email,reservationDetails(row).phone].join(' ').toLocaleLowerCase('tr').includes(search.trim().toLocaleLowerCase('tr'));
}
export function safeAdminUrl(value:string){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function reservationDate(value:string){const day=value.slice(0,10),date=new Date(day+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===day?new Intl.DateTimeFormat('tr-TR',{dateStyle:'medium',timeZone:'Europe/Istanbul'}).format(date):'Tarih alınamadı';}
