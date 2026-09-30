import App from '../App';
import guides from '../data/cityGuides.json';

/** Reuse Istanbul's layout for regional city routes. */
export default function CityGuide({city,language}:{city:typeof guides[number];language:string;onBack:()=>void}) {
  return <App key={city.slug} initialCity={city.name} initialLanguage={language}/>;
}
