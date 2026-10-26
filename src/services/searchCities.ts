// Search aliases only; canonical city slugs and destination coverage stay unchanged.
export const searchCities:Record<string,string[]>={
  istanbul:['Istanbul','İstanbul','Estambul','Стамбул','Стамбула','Стамбуле','伊斯坦布尔','伊斯坦堡','إسطنبول','اسطنبول','استانبول'],
  antalya:['Antalya','Анталья','Анталия','Анталии','安塔利亚','أنطاليا','انطاليا'],
  izmir:['Izmir','İzmir','Esmirna','Smyrna','Измир','Измира','伊兹密尔','إزمير','ازمير'],
  ankara:['Ankara','Анкара','Анкары','安卡拉','أنقرة','انقرة'],
  cappadocia:['Cappadocia','Kapadokya','Kappadokien','Cappadoce','Capadocia','Cappadocië','Каппадокия','Каппадокии','卡帕多奇亚','كابادوكيا'],
  mugla:['Muğla','Mugla','Bodrum','Бодрум','Бодрума','Мугла','博德鲁姆','穆拉','موغلا','بودروم'],
  aydin:['Aydın','Aydin','Kuşadası','Kusadasi','Didim','Айдын','Кушадасы','艾登','库萨达斯','أيدين','ايدين','كوشاداسي'],
  denizli:['Denizli','Pamukkale','Hierapolis','Денизли','Памуккале','代尼兹利','棉花堡','دنيزلي','باموكالي'],
  trabzon:['Trabzon','Trebizond','Trébizonde','Трабзон','Трабзона','特拉布宗','طرابزون','Sümela','Uzungöl'],
  konya:['Konya','Konia','Конья','Коньи','科尼亚','قونية','قونيا'],
  bursa:['Bursa','Brousse','Бурса','Бурсы','布尔萨','بورصة','بورصه','Uludağ'],
  gaziantep:['Gaziantep','Antep','Газиантеп','Газиантепа','加济安泰普','غازي عنتاب','عنتاب'],
}
export function normalizeSearchText(text:string){return text.normalize('NFKC').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i')}
// Whole words for spaced alphabets, substring matching for unspaced Chinese.
export function phrasePattern(phrase:string){
  const escaped=normalizeSearchText(phrase).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
  return new RegExp(/\p{Script=Han}/u.test(phrase)?escaped:`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,'gu')
}
export function searchCityMentions(text:string){
  const normalized=normalizeSearchText(text)
  return Object.entries(searchCities).filter(([,aliases])=>aliases.some(alias=>phrasePattern(alias).test(normalized))).map(([slug])=>slug)
}
export function mentionedSearchCity(text:string){const cities=searchCityMentions(text);return cities.length===1?cities[0]:undefined}
