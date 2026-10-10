const labels: Record<string, string> = {
  es:'Detalles',
  en: 'Details', tr: 'Detaylar', de: 'Details', fr: 'Détails',
  ar: 'التفاصيل', ru: 'Подробнее', zh: '详情',
};
export const detailLabel = (language: string) => labels[language] ?? labels.en;
const hotelSummaries: Record<string, string> = {
  es:'Consulta la información y los datos de contacto del hotel. Confirma las habitaciones, los servicios y la disponibilidad en su sitio web oficial.',
  en: 'View hotel information and contact details. Confirm rooms, facilities and availability on the official website.',
  tr: 'Otel bilgilerini ve iletişim seçeneklerini inceleyin. Oda, olanak ve müsaitliği resmî siteden teyit edin.',
  de: 'Hotelinformationen und Kontakt ansehen. Zimmer, Ausstattung und Verfügbarkeit auf der offiziellen Website prüfen.',
  fr: 'Consultez les informations et coordonnées de l’hôtel. Vérifiez chambres, équipements et disponibilités sur son site officiel.',
  ar: 'اطلع على معلومات الفندق وبيانات التواصل. تحقق من الغرف والمرافق والتوفر عبر الموقع الرسمي.',
  ru: 'Информация об отеле и контакты. Уточняйте номера, удобства и наличие мест на официальном сайте.',
  zh: '查看酒店信息和联系方式。请在官网确认房型、设施和空房情况。',
};
export const hotelSummary = (language: string) => hotelSummaries[language] ?? hotelSummaries.en;
