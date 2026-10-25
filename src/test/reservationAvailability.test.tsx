import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import RestaurantRequest from '../components/RestaurantRequest';
import {reservationUnavailable,restaurantRequestsEnabled} from '../lib/reservationAvailability';
it('does not collect reservation data or promise calls without an operation',()=>{
 expect(restaurantRequestsEnabled).toBe(false);
 for(const lang of Object.keys(reservationUnavailable)){
  const html=renderToStaticMarkup(<RestaurantRequest name="Test" source="https://example.com" lang={lang}/>);
  expect(html).not.toContain('<form');expect(html).not.toContain('<input');expect(html).toContain('text-sm');
 }
});
