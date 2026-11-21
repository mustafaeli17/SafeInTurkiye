export const cuisineTypes = ['turkish_restaurant', 'seafood_restaurant', 'steak_house', 'breakfast_restaurant', 'italian_restaurant', 'vegan_restaurant'] as const
export type Cuisine = (typeof cuisineTypes)[number]
export function directoryCuisine(value: string | null): Cuisine | undefined {
  return cuisineTypes.find(type => type === value)
}
