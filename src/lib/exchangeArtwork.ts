import artwork from '../data/cityArtwork.json';
import {destinationSlug} from './discoveryNavigation';
// District searches remain distinct. Reuse the existing regional illustration,
// retaining its original city name rather than claiming a new documentary photo.
const regions: Record<string,string>={kusadasi:'aydin',didim:'aydin',bodrum:'mugla',pamukkale:'denizli',cesme:'izmir',alacati:'izmir'};
export function exchangeArtwork(city:string){
 const slug=destinationSlug(city);
 return artwork.find(item=>item.slug===(regions[slug]??slug));
}
