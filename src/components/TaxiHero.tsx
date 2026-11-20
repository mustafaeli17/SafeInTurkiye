import './TaxiHero.css';

export default function TaxiHero({title,description}:{title:string;description:string}){
 return <section className="taxi-hero">
  <img className="taxi-hero-scenery" src="/photos/istanbul-hero-1280.webp" alt="" width="1280" height="853"/>
  <div className="taxi-hero-copy"><h1>{title}</h1><p>{description}</p></div>
  <div className="taxi-hero-stage" aria-hidden="true"><div className="taxi-hero-road"/><img className="taxi-hero-car" src="/photos/taxi-hero-cutout.webp" alt="" width="900" height="600"/></div>
 </section>;
}
