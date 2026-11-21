import {normalizeSearchText} from './searchCities'
import {tourIntent} from './tourSearch'
export function wantsNearby(query:string){return /yakinim|yakindaki|near me|nearby|in der nahe|a proximite|cerca de mi|рядом|поблизости|بالقرب|قريب مني|附近/.test(normalizeSearchText(query))}
export function guideSearch(query:string){return /istanbulkart|istanbul kart|nas[iı]l|how (?:do|to|can)|comment|como |wie |как |كيف|如何|怎么/.test(normalizeSearchText(query))}

function asksAboutSafety(q:string) {
 // French “sur” also means “on”. Match the accented adjective in the original question.
 const frenchQuestion=/\bs[uû]re?\s+pour\s+(?:les|un|une)\s+(?:touriste|voyageu)|\best[- ](?:elle|il)\s+sûr|\bc['’]est\s+sûr|\ben\s+sécurité/iu.test(q)
 const term=normalizeSearchText(q).replace(/[\u064b-\u065f]/g,'')
 const emergencyTerm=term.replace(/[أإآ]/g,'ا')
 if (term.trim()==='112' || /\b(?:ambulances?|ambulancias?|ambulans\w*|krankenwagen|rettungswagen)\b|скор(?:ая|ую|ой)\s+(?:помощ|медицинск)|вызовите\s+скорую|اسعاف|救护车|救護車/u.test(emergencyTerm)) return true
 return frenchQuestion || /\b(?:safety|emergency|scams?|pickpockets?|sicherheit|notfall|securite|urgence|seguridad|emergencia)\b|guvenli|dolandirici|\bacil\b|безопас|мошенни|экстренн|امن[ةه]?\s+(?:ل|في)|هل.{0,50}امن|الامان|الطوارئ|طوارئ|سلامة|安全|紧急|诈骗/u.test(emergencyTerm) ||
  /\b(?:is|are|how|stay|travel|feel|it['’]s)\b.{0,60}\bsafe\b|\bsafe\s+(?:for|to)\b|\b(?:ist|wie|wie kann)\b.{0,60}\bsicher\b|\bsicher\s+(?:in|fur|reisen)\b|\b(?:es|viajar)\b.{0,50}\bsegur[oa]\b|\bsegur[oa]\s+para\b/u.test(term)
}

export function homeSearchDestination(query:string) {
 const q=normalizeSearchText(query)
 if (asksAboutSafety(query)) return {section:'safety'} as const
 if (/istanbul\s*kart/.test(q) && guideSearch(q)) return {section:'assistant'} as const
 const taxi=/\b(?:taxis?|taksi(?:yle|ye|ler)?|taxifahrt|taxipreis|taxikosten)\b|такси|تاكسي|تاكسى|تكسي|سيارة أجرة|出租车|出租車|打车|打車|的士/u.test(q)
 const airport=/airport|havalimani|havaalani|flughafen|aeroport|aeropuerto|аэропорт|مطار|机场|機場/u.test(q)
 if (taxi && airport) return {section:'taxi'} as const
 if (tourIntent(query)) return {section:'tours'} as const
 const discovery=discoverySearch(query)
 if (discovery) return discovery
 if (taxi || /taksi|taxi/.test(q)) return {section:'taxi'} as const
 if (/metro|otobus|\bbus\b|tren|train|vapur|ferry|marmaray|ulasim|transit|route|rota|bahn|transport|транспорт|метро|автобус|مواصلات|مترو|حافل|地铁|公交|交通|火车/.test(q)) return {section:'transit'} as const
 if (/doviz|\bkur\b|exchange|currency|euro|usd|wechsel|change|валют|обмен|صرف|صراف|汇率|换汇/.test(q)) return {section:'currency'} as const
 if (/yakin|near|polis|police|nahe|proximite|рядом|قريب|附近/.test(q)) return {section:'nearme',category:'all'} as const
 if (guideSearch(q)) return {section:'assistant'} as const
 return {section:'nearme',category:'all'} as const
}
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
  ['nearme','bureau_de_change',/dovizci|doviz (?:buros|ofis)|exchange (?:office|bureau)|wechselstube|bureau de change|casa de cambio|обменн|مكاتب الصراف|换汇点|兑换点/],
  ['nearme','pharmacy',/eczane|pharmac|apotheke|farmacia|аптек|صيدلي|药房/],
  ['nearme','hospital',/hastane|hospital|krankenhaus|hopital|больниц|مستشفى|医院/],
  ['nearme','atm',/\batm\b|bankamatik|geldautomat|cajero|банкомат|صراف آلي|取款机/],
  ['nearme','barber',/berber|barber|barbier|barbero|барбер|حلاق|理发/],
  ['nearme','hair_salon',/kuafor|hair salon|friseur|coiffeur|peluquer|парикмахер|تصفيف|美发/],
  ['food','restaurant',/restoran|restorant|restaurant|restaurante|yemek|\bfood\b|ресторан|مطعم|مطاعم|餐厅|餐饮/],
  ['stay','hotel',/otel|hotel|konaklama|\bstay\b|отел|гостиниц|فندق|فنادق|酒店|住宿/],
  ['nearme','cafe',/\bcafe\b|\bkafe\b|coffee|kahve|cafeteria|кафе|مقهى|咖啡/],
  ['experiences','museum',/muze|museum|musee|museo|музе|متحف|博物馆/],
  ['experiences','cinema',/sinema|cinema|kino|\bcine\b|кино|سينما|影院/],
  ['experiences','activity',/aktivite|activit|etkinlik|eglence|bowling|lunapark|attraction|sehenswurd|развлеч|أنشط|活动|景点/],
 ]
 const match=entries.find(([, ,pattern])=>pattern.test(q))
 if(!match&&wantsNearby(q))return {section:'nearme',category:'all'}
 return match?{section:match[0] as 'food'|'stay'|'experiences'|'nearme',category:match[1]}:undefined
}
export const searchHelp:Record<string,string>={tr:'Ne aramak istersin? Bir bölüm seç; yazdığın aramayı oraya taşıyalım.',en:'What would you like to find? Choose a section to continue with your search.',de:'Was suchen Sie? Wählen Sie einen Bereich für Ihre Suche.',fr:'Que recherchez-vous ? Choisissez une rubrique pour poursuivre votre recherche.',es:'¿Qué buscas? Elige una sección para continuar la búsqueda.',ar:'ما الذي تبحث عنه؟ اختر قسمًا لمتابعة بحثك.',ru:'Что вы ищете? Выберите раздел, чтобы продолжить поиск.',zh:'您想查找什么？请选择一个分类继续搜索。'}
