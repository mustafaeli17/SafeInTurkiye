/** Restaurant visits are in Türkiye, regardless of the traveller's device zone. */
export function restaurantToday(now=Date.now()) {
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function validBookingTime(date:string,time?:string,now=Date.now()) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const calendar=new Date(`${date}T00:00:00Z`);
 if(!Number.isFinite(calendar.getTime())||calendar.toISOString().slice(0,10)!==date)return false;
 if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return false;
 return Date.parse(`${date}T${time||'23:59'}:00+03:00`)>=now;
}
