// Official destinations checked on 2026-09-20. No availability or live prices implied.
export const officialLinks: Record<string, string> = {
 h1: 'https://www.akrahotels.com/en/hotels/akra-antalya/',
 h2: 'https://www.swissotel.com/hotels/izmir/',
 h3: 'https://www.kempinski.com/en/ciragan-palace',
 r2: 'https://www.ciya.com.tr/', r3: 'https://7mehmet.com/en/contact',
 a1: 'https://muze.gov.tr/muze-detay?DistId=grm&SectionId=grm01',
 a2: 'https://www.muze.gov.tr/muze-detay?DistId=AMM&SectionId=AMM01',
 a3: 'https://millisaraylar.gov.tr/',
 cinemaIstanbul: 'https://www.paribucineverse.com/sinemalar/cevahir',
 cinemaAnkara: 'https://www.paribucineverse.com/sinemalar/ankamall',
 cinemaIzmir: 'https://www.paribucineverse.com/sinemalar/forum-bornova',
 cinemaAntalya: 'https://www.paribucineverse.com/sinemalar/antalya-migros',
 iksv: 'https://www.iksv.org/',
 modern: 'https://www.istanbulmodern.org/en/visit/museum',
 erciyes: 'https://erciyeskayak.com/tr',
};
const copy: Record<string, string[]> = {
 tr: ['Resmî site / iletişim', 'Güncel program, bilet, dil ve ziyaret koşullarını doğrudan resmî siteden kontrol edin.', 'Rezervasyon ve ödeme bu sitede alınmaz. İşlemler doğrudan işletmenin sitesinde yapılır. Fotoğraflar temsilî olabilir.', 'BiTaksi üzerinden çağır', 'Harici hizmet; taksi bulunabilirliği ve nihai ücret sağlayıcıya bağlıdır.', 'Kaynak kontrolü: 20.09.2026'],
 en: ['Official site / contact', 'Check the current programme, tickets, language and visiting conditions on the official website.', 'No bookings or payments are taken here. Deal directly with the business on its website. Photos may be illustrative.', 'Call through BiTaksi', 'External service; taxi availability and final fare depend on the provider.', 'Sources checked: 20 Sep 2026'],
 de: ['Offizielle Website / Kontakt', 'Aktuelles Programm, Tickets, Sprache und Besuchsbedingungen auf der offiziellen Website prüfen.', 'Hier keine Buchungen oder Zahlungen. Direkt beim Anbieter buchen. Fotos können illustrativ sein.', 'Über BiTaksi bestellen', 'Externer Dienst; Verfügbarkeit und Endpreis hängen vom Anbieter ab.', 'Quellen geprüft: 20.09.2026'],
 fr: ['Site officiel / contact', 'Vérifiez programme, billets, langue et conditions sur le site officiel.', 'Aucune réservation ni paiement ici. Contactez directement le prestataire. Photos parfois illustratives.', 'Commander via BiTaksi', 'Service externe ; disponibilité et prix final selon le prestataire.', 'Sources vérifiées : 20/09/2026'],
 ar: ['الموقع الرسمي / التواصل', 'تحقق من البرنامج والتذاكر واللغة وشروط الزيارة في الموقع الرسمي.', 'لا نقبل حجوزات أو مدفوعات هنا. تعامل مباشرة مع المنشأة عبر موقعها. قد تكون الصور توضيحية.', 'اطلب عبر BiTaksi', 'خدمة خارجية؛ التوفر والسعر النهائي يعتمدان على مقدم الخدمة.', 'التحقق من المصادر: 20/09/2026'],
 ru: ['Официальный сайт / контакты', 'Уточняйте программу, билеты, язык и условия посещения на официальном сайте.', 'Здесь нет бронирования и оплаты. Обращайтесь напрямую к поставщику. Фото могут быть иллюстративными.', 'Вызвать через BiTaksi', 'Внешний сервис; наличие машин и итоговая цена зависят от поставщика.', 'Источники проверены: 20.09.2026'],
 zh: ['官方网站 / 联系方式', '请在官网确认最新安排、门票、语言及参观条件。', '本站不接受预订或付款。请直接在商家网站办理。图片可能仅供参考。', '通过 BiTaksi 叫车', '外部服务；车辆供应及最终费用由服务商决定。', '来源核验：2026年9月20日'],
};
export const directoryText = (lang: string, index: number) => (copy[lang] ?? copy.en)[index];
export const cityPhotos = {
 izmir: '/photos/izmir.jpg',
 antalya: '/photos/antalya.jpg',
};
export const sourcedActivities = [
 ['cinemaIstanbul','Paribu Cineverse Cevahir','İstanbul','Cinema'],
 ['cinemaAnkara','Paribu Cineverse ANKAmall','Ankara','Cinema'],
 ['cinemaIzmir','Paribu Cineverse Forum Bornova','İzmir','Cinema'],
 ['cinemaAntalya','Paribu Cineverse Antalya Migros','Antalya','Cinema'],
 ['iksv','İKSV','İstanbul','Entertainment'],
 ['modern','İstanbul Modern','İstanbul','Museum & Culture'],
 ['erciyes','Erciyes Kayak Merkezi','Kayseri','Winter'],
].map(([id,title,city,category]) => ({id,title,city,category,duration:'',price:'Check programme',guideLang:'',rating:'—',description:'',img: category==='Cinema' ? 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80' : category==='Winter' ? 'https://images.unsplash.com/photo-1486911278844-a81c5267e227?auto=format&fit=crop&w=900&q=80' : 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80'}));
