import React from 'react';
import {createRoot} from 'react-dom/client';
import ContentAdmin from '../../components/ContentAdmin';
import RestaurantRequest from '../../components/RestaurantRequest';
import NearbyPlaces from '../../components/NearbyPlaces';
import '../../index.css';
const request=location.pathname==='/qa/restaurant';
createRoot(document.getElementById('root')!).render(<React.StrictMode><aside style={{padding:12,background:'#fff4d9',fontWeight:700}}>TEST ONLY · Yerel ve geçici veritabanı · Gerçek e-posta gönderilmez</aside>{location.pathname==='/qa/discovery'?<main className="max-w-5xl mx-auto p-5"><NearbyPlaces kind="essential" fixedCategory="hotel" lang="tr" center={{lat:41.0082,lng:28.9784}} cityName="İstanbul"/></main>:request?<main className="max-w-xl mx-auto p-5"><h1 className="text-2xl font-bold">TEST ONLY Restaurant</h1><RestaurantRequest name="TEST ONLY Restaurant" source="https://example.test/restaurant" businessKey="restaurants/test-only" lang="tr"/></main>:<ContentAdmin role="admin"/>}</React.StrictMode>);
