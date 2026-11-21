import {lazy,Suspense,useMemo,useState} from 'react';
import {CalendarDays,Clock3,ExternalLink,Globe,MapPin,Navigation,Phone,Star,Utensils} from 'lucide-react';
import type {NearbyPlaceRecord} from '../services/nearbyPlaces';
import {isEditorialPlace} from '../lib/editorialDiscovery';
import {editorialDiscoveryCopy} from '../lib/editorialDiscoveryCopy';
import {restaurantRequestCopy} from '../lib/restaurantRequestCopy';
import GooglePlacePhoto from './GooglePlacePhoto';
import EditorialPlacePhoto from './EditorialPlacePhoto';
import RestaurantRequest from './RestaurantRequest';
import './RestaurantDetail.css';
const PlaceMap=lazy(()=>import('./NearbyResultsMap'));
const labels:Record<string,[string,string,string,string]>={en:['Overview','Reservation','Map','The map is unavailable. Use directions to open Google Maps.'],tr:['Genel bakış','Rezervasyon','Harita','Harita açılamadı. Yol tarifi ile Google Maps’i açabilirsiniz.'],es:['Información','Reserva','Mapa','Mapa no disponible. Usa las indicaciones para abrir Google Maps.'],de:['Übersicht','Reservierung','Karte','Karte nicht verfügbar. Öffnen Sie Google Maps über die Wegbeschreibung.'],fr:['Présentation','Réservation','Carte','Carte indisponible. Ouvrez Google Maps avec le bouton itinéraire.'],ar:['نظرة عامة','الحجز','الخريطة','الخريطة غير متاحة. افتح خرائط Google من الاتجاهات.'],ru:['Обзор','Бронирование','Карта','Карта недоступна. Откройте Google Maps через маршрут.'],zh:['概览','预约','地图','地图暂不可用，请通过路线按钮打开 Google Maps。']};
type Props={place:NearbyPlaceRecord;lang:string;city:string;businessKey?:string;distance?:string;text:(tr:string,en:string)=>string;directions:string;onExpired:()=>void};
export default function RestaurantDetail({place,lang,city,businessKey,distance,text,directions,onExpired}:Props){
 const [requestAvailable,setRequestAvailable]=useState(false);
 const [tab,setTab]=useState('overview');const t=labels[lang]??labels.en;const request=(restaurantRequestCopy[lang]??restaurantRequestCopy.en)[0];const mapPlaces=useMemo(()=>[place],[place]);
 const editorial=isEditorialPlace(place)?place.editorial:null;
 const editorialText=editorialDiscoveryCopy[lang]??editorialDiscoveryCopy.en;
 const description=editorial?.description[lang]??editorial?.fallbackDescription;
 // The official website already has its own action. Only show the source link
 // when it points to an independent map record.
 const showMapSource=!editorial || place.sourceUrl!==place.website;
 const mapLabel=editorial||place.id.startsWith('google:')?'Google Maps':'OpenStreetMap';
 const route=`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}${place.id.startsWith('google:')?'&destination_place_id='+encodeURIComponent(place.id.slice(7)):''}`;
 const showRequest=()=>{setTab('reservation');requestAnimationFrame(()=>document.getElementById('restaurant-request-panel')?.scrollIntoView({behavior:'smooth',block:'start'}));};
 return <article className={`restaurant-detail ${requestAvailable?'can-request':''}`} data-business-key={businessKey} dir={lang==='ar'?'rtl':'ltr'}>
  <div className="restaurant-detail-main">
   <div className="restaurant-detail-photo">{isEditorialPlace(place)?<EditorialPlacePhoto place={place} expanded lang={lang}/>:<GooglePlacePhoto key={place.photo?.url??place.id} place={place} onExpired={onExpired}/>}</div>
   <div className="restaurant-detail-badges"><span><Utensils size={16}/>{text('Restoran','Restaurant')}</span>{editorial&&<span>{editorial.sponsored?editorialText[1]:editorialText[0]}</span>}{distance&&<span><MapPin size={15}/>{distance}</span>}</div>
   <h1 data-detail-heading tabIndex={-1}>{place.name}</h1>
   <div className="restaurant-detail-rating">{place.rating!==undefined&&<span><Star size={20} fill="#ffbd16" stroke="#ffbd16"/><strong>{place.rating}</strong>{place.reviewCount!==undefined&&` (${new Intl.NumberFormat(lang).format(place.reviewCount)})`}</span>}{showMapSource&&<a href={place.sourceUrl} target="_blank" rel="noopener noreferrer">{mapLabel} <ExternalLink size={14}/></a>}{typeof place.openNow==='boolean'&&<span className={place.openNow?'is-open':'is-closed'}>{place.openNow?text('Şu an açık','Open now'):text('Şu an kapalı','Closed now')}</span>}</div>
   <div className="restaurant-detail-actions"><a className="primary" href={route} target="_blank" rel="noopener noreferrer"><Navigation size={18}/>{directions}</a>{place.website&&<a data-event="website" href={place.website} target="_blank" rel="noopener noreferrer"><Globe size={18}/>{text('Web sitesi','Website')}<ExternalLink size={14}/></a>}{place.telephoneUrl&&<a href={place.telephoneUrl}><Phone size={18}/>{text('Telefon','Phone')}</a>}</div>
   <nav className="restaurant-detail-tabs" aria-label={place.name??text('Restoran','Restaurant')}>{['overview','map'].map((value,i)=><button key={value} type="button" aria-pressed={tab===value} onClick={()=>setTab(value)}>{t[i===0?0:2]}</button>)}</nav>
   <section className={`restaurant-detail-overview ${tab==='overview'?'is-active':''}`}>
    {description&&<p className="restaurant-detail-description">{description}</p>}
    <dl>{place.address&&<div><MapPin size={20}/><div><dt>{text('Adres','Address')}</dt><dd>{place.address}</dd></div></div>}{place.telephoneUrl&&<div><Phone size={20}/><div><dt>{text('Telefon','Phone')}</dt><dd><a href={place.telephoneUrl}>{place.phone}</a></dd></div></div>}{place.openingHours&&<div><Clock3 size={20}/><div><dt>{text('Çalışma saatleri','Opening hours')}</dt><dd><details><summary>{text('Çalışma saatleri','Opening hours')}</summary><p>{place.openingHours}</p></details></dd></div></div>}</dl>
   </section>
   {tab==='map'&&<section className="restaurant-detail-map"><Suspense fallback={<p role="status">…</p>}><PlaceMap places={mapPlaces} lang={lang} onExpired={onExpired} onOpen={()=>{}} title={t[2]} errorText={t[3]}/></Suspense></section>}
   {place.attributions?.map((a,i)=><p className="restaurant-detail-credit" key={i}>{a.url?<a href={a.url} target="_blank" rel="noopener noreferrer">{a.name}</a>:a.name}</p>)}
  </div>
  <aside id="restaurant-request-panel" className={`restaurant-detail-request ${tab==='reservation'?'is-active':''}`}><RestaurantRequest onAvailability={setRequestAvailable} businessKey={businessKey} name={place.name??''} city={city} source={place.sourceUrl} lang={lang}/></aside>
  {requestAvailable&&<button type="button" className="restaurant-detail-mobile-cta" aria-controls="restaurant-request-panel" aria-expanded={tab==='reservation'} onClick={showRequest}><CalendarDays size={20}/>{request}</button>}
 </article>;
}
