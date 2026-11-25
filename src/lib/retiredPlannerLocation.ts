import {publicCities} from './publicRoutes';
import {parseLocalePath} from './searchLocales';

const directories = new Set(['/activities', '/hotels', '/restaurants', '/tours']);

/** Keep old bookmarks usable without dropping the locale, selected place or search. */
export function retiredPlannerLocation(href: string): string | null {
  const url = new URL(href, 'https://www.safeinturkiye.com');
  const path = parseLocalePath(url.pathname).path.replace(/\/$/, '');
  const isCity = publicCities.some(city => path === '/cities/' + city.slug);
  if (isCity && (url.searchParams.get('view') === 'plan' || url.hash === '#day-plan')) {
    if (url.searchParams.get('view') === 'plan') {
      url.searchParams.delete('view');
      url.searchParams.delete('day');
    }
    if (url.hash === '#day-plan') url.hash = '';
  } else if (directories.has(path) && url.searchParams.has('planDate')) {
    url.searchParams.delete('planDate');
  } else {
    return null;
  }
  return url.pathname + url.search + url.hash;
}
