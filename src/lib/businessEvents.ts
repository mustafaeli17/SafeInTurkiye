import {foundationEnabled} from './foundationConfig'
import {trackingOptOut} from './analytics'
export type BusinessEvent='impression'|'detail_open'|'phone_click'|'website_click'|'directions_click'|'reservation_started'|'reservation_submitted'
export function trackBusinessEvent(businessKey:string,eventType:BusinessEvent,context='detail'){
 if(!foundationEnabled||trackingOptOut(navigator))return
 // Best-effort, no retries and no cookies, account ID, location or contact details.
 void fetch('/api/business-events',{method:'POST',credentials:'omit',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({businessKey,eventType,context})}).catch(()=>{})
}
