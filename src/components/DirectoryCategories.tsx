import { Beef, Clapperboard, Coffee, CookingPot, Fish, FerrisWheel, Landmark, LayoutGrid, Leaf, Pizza, Trees, Castle } from 'lucide-react'
import { activityTypes, directoryCopy } from '../lib/directoryCopy'
import { cuisineTypes, type Cuisine } from '../lib/directoryCuisines'
import type { NearbyCategory } from '../services/nearbyPlaces'

const activityIcons = [LayoutGrid, Landmark, Castle, Clapperboard, FerrisWheel, Trees]
const cuisineIcons = [LayoutGrid, CookingPot, Fish, Beef, Coffee, Pizza, Leaf]
export function CuisineCategories({lang, selected, choose}: {lang: string; selected?: Cuisine; choose: (value?: Cuisine)=>void}) {
  const copy = directoryCopy[lang] ?? directoryCopy.en
  return <div className="directory-categories" role="group" aria-label={copy.cuisine}>
    {([undefined, ...cuisineTypes]).map((type, i) => {
      const Icon = cuisineIcons[i]
      return <button type="button" key={type ?? 'all'} aria-pressed={selected === type} onClick={()=>choose(type)}>
        <Icon size={23} aria-hidden="true"/>{copy.cuisines[i]}
      </button>
    })}
  </div>
}
export function ActivityCategories({label, selected, categoryLabel, choose}: {label: string; selected: string; categoryLabel: (category: NearbyCategory)=>string; choose: (category: NearbyCategory)=>void}) {
  return <div className="directory-categories" role="group" aria-label={label}>
    {activityTypes.map((category, i) => {
      const Icon = activityIcons[i]
      return <button type="button" key={category} aria-pressed={selected === category} onClick={()=>choose(category)}>
        <Icon size={23} aria-hidden="true"/>{categoryLabel(category)}
      </button>
    })}
  </div>
}
