import {normalizeSearchText,phrasePattern,searchCities} from './searchCities.js'
// Bounded travel vocabulary, not a general translator. Preserve unknown landmarks.
const phrases:Record<string,string[]>={
  'airport transfer':['havalimanı transferi','havaalanı transferi','havalimani transfer','havaalani transfer','Flughafentransfer','transfert aéroport','transfert de l’aéroport','traslado al aeropuerto','traslado desde el aeropuerto','transferencia al aeropuerto','luchthaventransfer','трансфер из аэропорта','трансфер в аэропорт','نقل المطار','النقل من المطار','توصيل المطار','机场接送','機場接送','接机','送机'],
  'private city tour':['özel şehir turu','ozel sehir turu','private Stadtführung','private Stadtrundfahrt','visite privée de la ville','visita privada por la ciudad','tour privado por la ciudad','privé stadstour','частная экскурсия по городу','индивидуальная экскурсия по городу','جولة خاصة في المدينة','私人城市游'],
  'museum tour':['müze turu','muze turu','Museumsführung','visite du musée','visita al museo','museumtour','экскурсия по музею','جولة في المتحف','博物馆游','博物馆之旅'],
  'city tour':['şehir turu','sehir turu','Stadtführung','Stadtrundfahrt','visite de la ville','tour por la ciudad','visita por la ciudad','stadstour','stadsrondleiding','экскурсия по городу','جولة في المدينة','城市游','城市观光'],
  'boat tour':['tekne turu','Bootstour','tour en bateau','paseo en barco','boottocht','прогулка на лодке','جولة بالقارب','游船'],
  'private':['özel','ozel','privée','privé','privado','privada','частная','индивидуальная','خاصة','私人'],
  'airport':['havalimanı','havaalanı','Flughafen','aéroport','aeropuerto','luchthaven','аэропорт','المطار','机场'],
  'transfer':['transferi','transfert','traslado','трансфер'],
  'tour':['turu','tur','turlar','turları','touren','excursion','excursión','экскурсия','جولة','旅游','行程'],
}
const replacements=Object.entries(phrases).flatMap(([target,values])=>values.map(value=>({target,value}))).sort((a,b)=>b.value.length-a.value.length)
export function tourSearchTerm(value: string) {
  let term=value.trim().replace(/\s+/g,' ')
  if(term.length>160 || [...term].some(char=>char.charCodeAt(0)<32||char.charCodeAt(0)===127)) throw Error('INVALID_INPUT')
  term=normalizeSearchText(term)
  for(const {target,value:phrase} of replacements)term=term.replace(phrasePattern(phrase),` ${target} `)
  for(const aliases of Object.values(searchCities))for(const alias of [...aliases].sort((a,b)=>b.length-a.length)){
    // Keep sub-destinations specific instead of turning Bodrum into Muğla, etc.
    const localNames:Record<string,string>={'Бодрум':'Bodrum','Бодрума':'Bodrum','博德鲁姆':'Bodrum','بودروم':'Bodrum','Кушадасы':'Kusadasi','库萨达斯':'Kusadasi','كوشاداسي':'Kusadasi','Памуккале':'Pamukkale','棉花堡':'Pamukkale','باموكالي':'Pamukkale'}
    const target=localNames[alias]??(/^(Bodrum|Kuşadası|Kusadasi|Didim|Pamukkale|Hierapolis|Sümela|Uzungöl|Uludağ)$/.test(alias)?alias:aliases[0])
    term=term.replace(phrasePattern(alias),` ${normalizeSearchText(target)} `)
  }
  return term.trim().replace(/\s+/g,' ')
}
export function tourIntent(query:string) {
  if(query.length>160)return false
  try{return /\b(?:transfer|tour|tours)\b/i.test(tourSearchTerm(query))}catch{return false}
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
