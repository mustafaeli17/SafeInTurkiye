import {MapPin} from 'lucide-react'
import {nearMeDesignCopy} from '../lib/nearMeDesignCopy'
export default function NearMeHero({lang}:{lang:string}){
 const copy=nearMeDesignCopy[lang]??nearMeDesignCopy.en
 return <header className="nearby-hero"><picture><source media="(max-width: 600px)" srcSet="/photos/nearby-hagia-sophia-768.webp"/><img src="/photos/nearby-hagia-sophia-1600.webp" width="1600" height="533" alt="" fetchPriority="high"/></picture><div className="nearby-hero-copy"><span className="nearby-eyebrow"><MapPin size={17} aria-hidden="true"/>{copy.badge}</span><h1>{copy.title} <span>{copy.accent}</span></h1><p>{copy.intro}</p></div></header>
}
