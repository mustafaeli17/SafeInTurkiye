import {normalizeSearchText} from './searchCities'
export function wantsNearby(query:string){return /yakinim|yakindaki|near me|nearby|in der nahe|a proximite|cerca de mi|рядом|поблизости|بالقرب|قريب مني|附近/.test(normalizeSearchText(query))}
export function guideSearch(query:string){return /istanbulkart|istanbul kart|nas[iı]l|how (?:do|to|can)|comment|como |wie |как |كيف|如何|怎么/.test(normalizeSearchText(query))}
export function matchesGuide(text:string,query:string){
 const normalized=normalizeSearchText(query).trim()
 if(!normalized)return true
 const haystack=normalizeSearchText(text)
 if(/istanbul\s*kart/.test(normalized))return /istanbul\s*kart/.test(haystack)
 const stop=new Set('how do i can to the a is where buy get nasil nereden alabilirim alinir bir ve icin mi como donde puedo el la de comment ou je peux wie kann ich как где купить كيف اين 如何 怎么'.split(' '))
 const terms=normalized.split(/[^\p{L}\p{N}]+/u).filter(term=>term.length>1&&!stop.has(term))
 return haystack.includes(normalized)||(terms.length>0&&terms.every(term=>haystack.includes(term)))
}
export function discoverySearch(query:string):{section:'food'|'stay'|'experiences'|'nearme';category:string}|undefined{
 const q=normalizeSearchText(query)
 if(wantsNearby(q)&&/doviz|exchange|currency|صراف|换汇/.test(q))return {section:'nearme',category:'bureau_de_change'}
 const entries:[string,string,RegExp][]=[
  ['nearme','bureau_de_change',/doviz (?:buros|ofis)|exchange (?:office|bureau)|wechselstube|bureau de change|casa de cambio|обменн|مكاتب الصراف|换汇点|兑换点/],
  ['nearme','pharmacy',/eczane|pharmac|apotheke|farmacia|аптек|صيدلي|药房/],
  ['nearme','hospital',/hastane|hospital|krankenhaus|hopital|больниц|مستشفى|医院/],
  ['nearme','atm',/\batm\b|bankamatik|geldautomat|cajero|банкомат|صراف آلي|取款机/],
  ['nearme','barber',/berber|barber|barbier|barbero|барбер|حلاق|理发/],
  ['nearme','hair_salon',/kuafor|hair salon|friseur|coiffeur|peluquer|парикмахер|تصفيف|美发/],
  ['food','restaurant',/restoran|restorant|restaurant|restaurante|ресторан|مطعم|مطاعم|餐厅/],
  ['stay','hotel',/otel|hotel|konaklama|отел|гостиниц|فندق|فنادق|酒店|住宿/],
  ['nearme','cafe',/\bcafe\b|coffee|kahve|cafeteria|кафе|مقهى|咖啡/],
  ['experiences','museum',/muze|museum|musee|museo|музе|متحف|博物馆/],
  ['experiences','cinema',/sinema|cinema|kino|\bcine\b|кино|سينما|影院/],
  ['experiences','activity',/aktivite|activit|etkinlik|attraction|sehenswurd|развлеч|أنشط|活动|景点/],
 ]
 const match=entries.find(([, ,pattern])=>pattern.test(q))
 return match?{section:match[0] as 'food'|'stay'|'experiences'|'nearme',category:match[1]}:undefined
}
export const searchHelp:Record<string,string>={tr:'Ne aramak istersin? Bir bölüm seç; yazdığın aramayı oraya taşıyalım.',en:'What would you like to find? Choose a section to continue with your search.',de:'Was suchen Sie? Wählen Sie einen Bereich für Ihre Suche.',fr:'Que recherchez-vous ? Choisissez une rubrique pour poursuivre votre recherche.',es:'¿Qué buscas? Elige una sección para continuar la búsqueda.',ar:'ما الذي تبحث عنه؟ اختر قسمًا لمتابعة بحثك.',ru:'Что вы ищете? Выберите раздел, чтобы продолжить поиск.',zh:'您想查找什么？请选择一个分类继续搜索。'}
