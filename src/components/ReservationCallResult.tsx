import {useState} from 'react';
import AccessibleDialog from './AccessibleDialog';
import {callbackInstant,callbackLocalInput,reservationDate,reservationDetails,type ReservationRow} from '../lib/adminReservations';

export type CallOutcome='CONFIRMED'|'REJECTED'|'CALLBACK'|'CANCELLED';
const outcomes=[
 ['CONFIRMED','Restoran onayladı','Müşteri talep ekranında “Onaylandı” görecek.'],
 ['REJECTED','Restoran kabul etmedi','Müşteri talep ekranında “Reddedildi” görecek.'],
 ['CALLBACK','Tekrar ara','Talep beklemede kalır. Arama saatini yalnızca ekip görür.']
] as const;

export default function ReservationCallResult({row,callbacksAvailable,saving,error,onClose,onSave}:{
 row:ReservationRow;callbacksAvailable:boolean;saving:boolean;error:string;onClose:()=>void;onSave:(next:CallOutcome,callbackAt?:string)=>void;
}){
 const cancelling=row.status==='CONFIRMED';
 const [next,setNext]=useState<CallOutcome|''>(cancelling?'CANCELLED':'');
 const [time,setTime]=useState(()=>callbackLocalInput(Date.now()+30*60000));
 const [timeError,setTimeError]=useState('');
 function submit(event:React.FormEvent){
  event.preventDefault();
  if(saving||!next)return;
  if(next==='CALLBACK'){
   const instant=callbackInstant(time);
   if(!instant){setTimeError('İleri bir tarih ve saat seçin.');return;}
   onSave(next,instant);
  }else onSave(next);
 }
 const requestedTime=reservationDetails(row).time;
 return <AccessibleDialog label={cancelling?'Rezervasyonu iptal et':'Sonucu kaydet'} onClose={()=>{if(!saving)onClose();}}>
  <form className="booking-result" onSubmit={submit}>
   <h3>{cancelling?'Rezervasyonu iptal et':'Sonucu kaydet'}</h3>
   <p><strong>{row.listing_name}</strong><br/>{reservationDate(row.visit_date)}{requestedTime?' · '+requestedTime:''} · {row.guest_count} kişi<br/><bdi>{row.reference_code}</bdi></p>
   {cancelling?<p>Onaylanmış rezervasyon iptal edilecek. Müşteri talep ekranında “İptal edildi” görecek.</p>:
    <fieldset disabled={saving}><legend>Restoranla görüşmenin sonucu</legend>
     {outcomes.map(([value,title,description])=><label className="booking-choice" key={value}>
      <input type="radio" name="call-outcome" value={value} checked={next===value} disabled={value==='CALLBACK'&&!callbacksAvailable} onChange={()=>setNext(value)}/>
      <span><strong>{title}</strong><small>{value==='CALLBACK'&&!callbacksAvailable?'Bu ortamda geri arama planlaması etkin değil.':description}</small></span>
     </label>)}
    </fieldset>}
   {next==='CALLBACK'&&<label className="booking-schedule">Arama zamanı (Türkiye saati)
    <input required type="datetime-local" value={time} disabled={saving} onChange={e=>{setTime(e.target.value);setTimeError('');}}/>
   </label>}
   {(error||timeError)&&<p role="alert" className="admin-error">{error||timeError}</p>}
   <div className="booking-result-actions"><button type="button" className="admin-button" disabled={saving} onClick={onClose}>Vazgeç</button>
    <button className="admin-button admin-primary" disabled={saving||!next}>{saving?'Kaydediliyor…':cancelling?'İptali kaydet':next==='CALLBACK'?'Aramayı planla':'Sonucu kaydet'}</button>
   </div>
  </form>
 </AccessibleDialog>;
}
