import retiredSlugs from '../data/retiredRestaurantSlugs.json';
const retired=new Set(retiredSlugs);
export function isRetiredRestaurantSlug(slug:unknown){return typeof slug==='string'&&retired.has(slug);}
export function isRetiredRestaurantPath(path:string){
 const match=path.match(/^(?:\/tr)?\/restaurants\/([^/]+)\/?$/);
 return !!match&&isRetiredRestaurantSlug(match[1]);
}
