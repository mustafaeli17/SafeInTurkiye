export const homeTitle = 'SafeInTürkiye — Your Guide to Türkiye';
export const homeDescription = 'Plan your trip to Türkiye with trusted local information on transport, taxi fares, exchange rates, restaurants, attractions, safety and more.';
const sections: Record<string, [string, string]> = {
 taxi: ['Taxi Fare Estimates', 'Estimate taxi fares in Türkiye with source-labelled tariffs and practical advice before your ride.'],
 transit: ['Public Transport Guide', 'Explore metro, bus, tram and train information, transport cards and official operator links for cities in Türkiye.'],
 currency: ['Exchange Rates & Exchange Bureaux', 'Check daily reference exchange rates and find nearby exchange bureaux. Reference rates are not bureau buy or sell offers.'],
 nearme: ['Nearby Places', 'Find nearby pharmacies, hospitals, ATMs, police and taxi ranks with distances, addresses and available source information.'],
 stay: ['Hotels in Türkiye', 'Explore selected hotels in Türkiye and contact their official websites directly for availability and reservations.'],
 food: ['Restaurants in Türkiye', 'Discover selected restaurants in Türkiye with official links for menus, contact details and reservations.'],
 experiences: ['Attractions & Activities', 'Explore museums, cinemas, cultural events and seasonal activities in Türkiye with official visitor and ticket information.'],
 safety: ['Travel Safety Guide', 'Read practical travel safety advice for Türkiye, emergency information and tips for safer journeys.'],
 assistant: ['Travel Questions & Answers', 'Find practical answers about transport cards, taxis, money and travel in Türkiye.'],
 admin: ['Administration', 'Authorized content management for SafeInTürkiye.'],
};
export function sectionSeo(section: string, city: string) {
 if (section === 'city') return {title: `${city} Travel Guide | SafeInTürkiye`, description: `Explore ${city} with city information, weather availability, attractions and public transport guidance from SafeInTürkiye.`};
 const entry = sections[section];
 return entry ? {title: `${entry[0]} | SafeInTürkiye`, description: entry[1]} : {title: homeTitle, description: homeDescription};
}
// These are UI sections, not independently crawlable routes. Keep the canonical at /.
export function updateSectionSeo(section: string, city: string) {
 const {title, description} = sectionSeo(section, city);
 document.title = title;
 for (const [selector, value] of [
  ['meta[name="description"]', description], ['meta[property="og:title"]', title],
  ['meta[property="og:description"]', description], ['meta[name="twitter:title"]', title], ['meta[name="twitter:description"]', description],
 ]) document.querySelector(selector)?.setAttribute('content', value);
}
