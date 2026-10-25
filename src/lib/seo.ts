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
 tours: ['Tours & Experiences', 'Find tours and experiences in Türkiye. View current options and complete your booking on Viator.'],
 safety: ['Travel Safety Guide', 'Read practical travel safety advice for Türkiye, emergency information and tips for safer journeys.'],
 assistant: ['Travel Questions & Answers', 'Find practical answers about transport cards, taxis, money and travel in Türkiye.'],
 admin: ['Administration', 'Authorized content management for SafeInTürkiye.'],
};
export function sectionSeo(section: string, city: string, lang='en') {
 const keys=['taxi','transit','currency','nearme','stay','food','experiences','tours','safety','assistant'];
 const names:Record<string,string[]>={tr:['Taksi ücreti hesaplama','Toplu taşıma','Döviz kurları','Yakınımdaki yerler','Oteller','Restoranlar','Aktiviteler','Turlar ve deneyimler','Güvenlik rehberi','Seyahat soruları'],de:['Taxipreisrechner','Öffentliche Verkehrsmittel','Wechselkurse','Orte in der Nähe','Hotels','Restaurants','Aktivitäten','Touren und Erlebnisse','Sicherheit auf Reisen','Reisefragen'],fr:['Estimation du taxi','Transports en commun','Taux de change','Lieux à proximité','Hôtels','Restaurants','Activités','Excursions et expériences','Conseils de sécurité','Questions de voyage'],es:['Calculadora de taxi','Transporte público','Tipos de cambio','Lugares cercanos','Hoteles','Restaurantes','Actividades','Excursiones y experiencias','Guía de seguridad','Preguntas de viaje'],ar:['تقدير أجرة التاكسي','المواصلات العامة','أسعار الصرف','أماكن قريبة','الفنادق','المطاعم','الأنشطة','الجولات والتجارب','دليل السلامة','أسئلة السفر'],ru:['Расчёт стоимости такси','Общественный транспорт','Курсы валют','Места рядом','Отели','Рестораны','Развлечения','Экскурсии и впечатления','Безопасность','Вопросы о путешествии'],zh:['出租车费用估算','公共交通','汇率','附近地点','酒店','餐厅','活动','旅游与体验','安全指南','旅行问答']};
 const suffix:Record<string,string>={en:'Travel Guide',tr:'Gezi Rehberi',de:'Reiseführer',fr:'Guide de voyage',es:'Guía de viaje',ar:'دليل السفر',ru:'Путеводитель',zh:'旅行指南'};
 if (section === 'city') return {title: `${city==='Cappadocia'&&lang==='tr'?'Kapadokya':city} ${suffix[lang]??suffix.en} | SafeInTürkiye`, description: `Explore ${city} with city information, weather availability, attractions and public transport guidance from SafeInTürkiye.`};
 const entry = sections[section];
 return entry ? {title: `${names[lang]?.[keys.indexOf(section)]??entry[0]} | SafeInTürkiye`, description: entry[1]} : {title: homeTitle, description: homeDescription};
}
// Section and city route canonicals are owned by the navigation layer.
export function updateSectionSeo(section: string, city: string,lang='en') {
 const {title, description} = sectionSeo(section, city,lang);
 document.title = title;
 for (const [selector, value] of [
  ['meta[name="description"]', description], ['meta[property="og:title"]', title],
  ['meta[property="og:description"]', description], ['meta[name="twitter:title"]', title], ['meta[name="twitter:description"]', description],
 ]) document.querySelector(selector)?.setAttribute('content', value);
}
