import regional from '../data/cityGuides.json';
import original from '../data/originalCityRoutes.json';
export const publicCities = [...original, ...regional];
export const cityPath = (name:string) => {
 const city=publicCities.find(city=>city.name===name);
 return city ? `/cities/${city.slug}` : '/';
};
// Only genuine Turkish detail descriptions are advertised. Other language
// preferences remain available in the application, not fabricated SEO routes.
export function localizedDetailPath(path:string,lang:string){return lang==='tr'?`/tr${path}`:path;}
