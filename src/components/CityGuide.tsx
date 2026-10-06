import App from '../App';

/** Reuse Istanbul's layout for regional city routes. */
export default function CityGuide({city,language}:{city:{slug:string;name:string};language:string;onBack:()=>void}) {
  return <App key={city.slug} initialCity={city.name} initialLanguage={language}/>;
}
