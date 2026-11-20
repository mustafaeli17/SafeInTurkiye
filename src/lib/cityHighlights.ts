import {destinationSlug} from './discoveryNavigation'
import {localizePath,type SearchLanguage} from './searchLocales'

// A few editorial cards describe a walk or several landmarks. Search for the
// named starting point instead of sending the whole translated headline to Maps.
const startingPoints:Record<string,string>={
 'Ayasofya ve Sultanahmet':'Ayasofya',
 'Boğaz vapurları':'Eminönü Şehir Hatları İskelesi',
 'Ankara Kalesi ve Hamamönü':'Ankara Kalesi',
 'Kaleiçi ve Hadrian Kapısı':'Hadrian Kapısı',
 'Aşk ve Güllüdere vadileri':'Aşk Vadisi, Göreme',
 'Kordon ve vapurlar':'Kordon, Alsancak',
}

export function cityHighlightHref(city:string,name:string,lang:SearchLanguage){
 const params=new URLSearchParams({city:destinationSlug(city),q:`${startingPoints[name]??name}, ${city}`,category:'all',lookup:'1'})
 return localizePath('/activities?'+params,lang)
}

const bursaHighlights:Record<string,{source:string;description:Record<SearchLanguage,string>}>={
 'Koza Han':{
  source:'https://www.kulturportali.gov.tr/turkiye/bursa/gezilecekyer/koza-han',
  description:{tr:'Tarihi çarşıdaki hanın avlusunda, ortadaki küçük mescidi görün.',en:'Step into the historic market courtyard and look for the small mosque at its centre.',de:'Im Hof des historischen Handelshofs steht eine kleine Moschee.',fr:'Entrez dans la cour du caravansérail pour découvrir sa petite mosquée centrale.',es:'Entra en el patio de este histórico caravasar y descubre la pequeña mezquita central.',ru:'Во дворе исторического караван-сарая стоит небольшая мечеть.',ar:'ادخل فناء الخان التاريخي لرؤية المسجد الصغير في وسطه.',zh:'走进老集市的商旅客栈，看看庭院中央的小清真寺。'},
 },
 'Ulu Cami':{
  source:'https://www.kulturportali.gov.tr/turkiye/bursa/kulturenvanteri/ulu-cami',
  description:{tr:'Çarşı yakınındaki Osmanlı camisinin kubbelerini ve oymalı ahşap minberini keşfedin.',en:'Visit the Ottoman mosque near the bazaar to see its domes and carved wooden pulpit.',de:'Nahe dem Basar liegen die Kuppeln und die geschnitzte Holzkanzel dieser osmanischen Moschee.',fr:'Près du bazar, découvrez les coupoles et la chaire en bois sculpté de cette mosquée ottomane.',es:'Cerca del bazar, descubre las cúpulas y el púlpito de madera tallada de esta mezquita otomana.',ru:'Рядом с базаром находится османская мечеть с куполами и резным деревянным минбаром.',ar:'اكتشف قباب المسجد العثماني ومنبره الخشبي المنحوت قرب السوق.',zh:'这座奥斯曼清真寺毗邻集市，可欣赏穹顶和木雕讲坛。'},
 },
 'Uludağ':{
  source:'https://bursa.ktb.gov.tr/TR-70240/milli-parklar.html',
  description:{tr:'Dağda yürüyüş veya kışın kayak için şehirden ayrı bir gün planlayın.',en:'Plan a day in the mountains for a walk or, in winter, a ski outing.',de:'Planen Sie einen Tag in den Bergen zum Wandern oder im Winter zum Skifahren.',fr:'Prévoyez une journée en montagne pour marcher ou skier en hiver.',es:'Reserva un día para caminar por la montaña o esquiar en invierno.',ru:'Выделите день на прогулку в горах, а зимой — на катание на лыжах.',ar:'خصّص يوماً للمشي في الجبل أو للتزلج في الشتاء.',zh:'留出一天上山徒步，冬季也可安排滑雪。'},
 },
 'Gölyazı':{
  source:'https://www.kulturportali.gov.tr/turkiye/bursa/gezilecekyer/golyazi-koyu',
  description:{tr:'Uluabat Gölü kıyısında yürüyüp köyün tarihi surlarına uğrayın.',en:'Walk along Lake Uluabat and visit the remains of the village walls.',de:'Spazieren Sie am Uluabat-See entlang zu den Resten der historischen Ortsmauer.',fr:'Longez le lac d’Uluabat pour découvrir les vestiges des remparts du village.',es:'Pasea junto al lago Uluabat y descubre los restos de la muralla del pueblo.',ru:'Прогуляйтесь по берегу озера Улуабат и осмотрите остатки старых стен.',ar:'تنزّه على ضفاف بحيرة أولوبات وزُر بقايا أسوار القرية.',zh:'沿乌卢阿巴特湖散步，探访村里的古城墙遗迹。'},
 },
}

export function highlightDescription(city:string,name:string,lang:SearchLanguage){
 return city==='Bursa'?bursaHighlights[name]?.description[lang]:undefined
}
