/** Search across Türkiye, without silently preferring İstanbul streets.
 * Both inputs use the same country scope; the selected result supplies its province.
 */
export function taxiSearchUrl(query:string):string {
 const params=new URLSearchParams({q:query.trim(),limit:'5',countrycode:'TR'});
 return `https://photon.komoot.io/api/?${params}`;
}
