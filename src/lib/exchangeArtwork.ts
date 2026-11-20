import artwork from '../data/cityArtwork.json';
import {destinationSlug,destinationRegion} from './discoveryNavigation';
// District searches remain distinct. Reuse the existing regional illustration,
// retaining its original city name rather than claiming a new documentary photo.
export function exchangeArtwork(city:string){
 const slug=destinationSlug(city);
 return artwork.find(item=>item.slug===destinationRegion(slug));
}
