// Common Turkish search phrases map to the English catalog used by our affiliate account.
// Other text is preserved; this is not a general translation service.
export function tourSearchTerm(value: string) {
  const term=value.trim().replace(/\s+/g,' ')
  if(term.length>160 || [...term].some(char=>char.charCodeAt(0)<32||char.charCodeAt(0)===127)) throw Error('INVALID_INPUT')
  return term.replace(/havaliman[ıi]|havaalan[ıi]/gi,'airport')
    .replace(/\btransferi\b/gi,'transfer')
    .replace(/özel/gi,'private').replace(/şehir turu/gi,'city tour')
    .replace(/müze turu/gi,'museum tour').replace(/İstanbul/g,'Istanbul')
}
export function tourIntent(query:string) {
  return /transfer|traslado|трансфер|接机|送机|机场接送|tour|\btur(?:u|lar|ları)?\b|excursion|excursión|экскурс|جول|旅游|行程/i.test(query)
}
export const tourSearchCopy:Record<string,[string,string]>={
  en:['Search tours','Airport transfer, private city tour, museum…'],
  tr:['Tur ara','Havalimanı transferi, özel şehir turu, müze…'],
  de:['Touren durchsuchen','Flughafentransfer, private Stadtführung, Museum…'],
  fr:['Rechercher une excursion','Transfert aéroport, visite privée, musée…'],
  es:['Buscar experiencias','Traslado al aeropuerto, visita privada, museo…'],
  ar:['البحث عن الجولات','نقل المطار، جولة خاصة في المدينة، متحف…'],
  ru:['Поиск экскурсий','Трансфер из аэропорта, частная экскурсия, музей…'],
  zh:['搜索行程','机场接送、私人城市游、博物馆…'],
}
