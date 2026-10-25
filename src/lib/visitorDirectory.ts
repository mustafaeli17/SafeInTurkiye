const copy: Record<string, string[]> = {
 es:['Sitio oficial / contacto','Consulta el programa, las entradas, el idioma y las condiciones de visita en el sitio oficial.','Aquí no se realizan reservas ni pagos. Contacta directamente con el establecimiento en su sitio web. Las fotos pueden ser ilustrativas.','Pedir taxi con BiTaksi','Servicio externo; la disponibilidad y la tarifa final dependen del proveedor.','Fuentes consultadas: 20 sep. 2026'],
 tr: ['Resmî site / iletişim', 'Güncel program, bilet, dil ve ziyaret koşullarını doğrudan resmî siteden kontrol edin.', 'Rezervasyon ve ödeme bu sitede alınmaz. İşlemler doğrudan işletmenin sitesinde yapılır. Fotoğraflar temsilî olabilir.', 'BiTaksi üzerinden çağır', 'Harici hizmet; taksi bulunabilirliği ve nihai ücret sağlayıcıya bağlıdır.', 'Kaynak kontrolü: 20.09.2026'],
 en: ['Official site / contact', 'Check the current programme, tickets, language and visiting conditions on the official website.', 'No bookings or payments are taken here. Deal directly with the business on its website. Photos may be illustrative.', 'Call through BiTaksi', 'External service; taxi availability and final fare depend on the provider.', 'Sources checked: 20 Sep 2026'],
 de: ['Offizielle Website / Kontakt', 'Aktuelles Programm, Tickets, Sprache und Besuchsbedingungen auf der offiziellen Website prüfen.', 'Hier keine Buchungen oder Zahlungen. Direkt beim Anbieter buchen. Fotos können illustrativ sein.', 'Über BiTaksi bestellen', 'Externer Dienst; Verfügbarkeit und Endpreis hängen vom Anbieter ab.', 'Quellen geprüft: 20.09.2026'],
 fr: ['Site officiel / contact', 'Vérifiez programme, billets, langue et conditions sur le site officiel.', 'Aucune réservation ni paiement ici. Contactez directement le prestataire. Photos parfois illustratives.', 'Commander via BiTaksi', 'Service externe ; disponibilité et prix final selon le prestataire.', 'Sources vérifiées : 20/09/2026'],
 ar: ['الموقع الرسمي / التواصل', 'تحقق من البرنامج والتذاكر واللغة وشروط الزيارة في الموقع الرسمي.', 'لا نقبل حجوزات أو مدفوعات هنا. تعامل مباشرة مع المنشأة عبر موقعها. قد تكون الصور توضيحية.', 'اطلب عبر BiTaksi', 'خدمة خارجية؛ التوفر والسعر النهائي يعتمدان على مقدم الخدمة.', 'التحقق من المصادر: 20/09/2026'],
 ru: ['Официальный сайт / контакты', 'Уточняйте программу, билеты, язык и условия посещения на официальном сайте.', 'Здесь нет бронирования и оплаты. Обращайтесь напрямую к поставщику. Фото могут быть иллюстративными.', 'Вызвать через BiTaksi', 'Внешний сервис; наличие машин и итоговая цена зависят от поставщика.', 'Источники проверены: 20.09.2026'],
 zh: ['官方网站 / 联系方式', '请在官网确认最新安排、门票、语言及参观条件。', '本站不接受预订或付款。请直接在商家网站办理。图片可能仅供参考。', '通过 BiTaksi 叫车', '外部服务；车辆供应及最终费用由服务商决定。', '来源核验：2026年9月20日'],
};
const bookingDisclaimer:Record<string,string>={
 es:'Aquí no se realizan reservas ni pagos. Contacta directamente con el establecimiento en su sitio web.',
 tr:'Rezervasyon ve ödeme bu sitede alınmaz. İşlemler doğrudan işletmenin sitesinde yapılır.',
 en:'No bookings or payments are taken here. Deal directly with the business on its website.',
 de:'Hier keine Buchungen oder Zahlungen. Direkt beim Anbieter buchen.',
 fr:'Aucune réservation ni paiement ici. Contactez directement le prestataire.',
 ar:'لا نقبل حجوزات أو مدفوعات هنا. تعامل مباشرة مع المنشأة عبر موقعها.',
 ru:'Здесь нет бронирования и оплаты. Обращайтесь напрямую к поставщику.',
 zh:'本站不接受预订或付款。请直接在商家网站办理。',
};
export const directoryText = (lang: string, index: number) => index===2 ? bookingDisclaimer[lang]??bookingDisclaimer.en : (copy[lang] ?? copy.en)[index];
