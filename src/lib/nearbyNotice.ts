const notices: Record<string, [string, string]> = {
  en: ['Information may change; contact the business before visiting.', 'This is not an on-duty pharmacy service.'],
  tr: ['Bilgiler değişebilir; gitmeden önce işletmeyle iletişime geçin.', 'Nöbetçi eczane bilgisi değildir.'],
  es: ['La información puede cambiar; contacta con el establecimiento antes de ir.', 'Este servicio no indica las farmacias de guardia.'],
  de: ['Angaben können sich ändern; kontaktieren Sie den Betrieb vor Ihrem Besuch.', 'Dies ist kein Apotheken-Notdienstverzeichnis.'],
  fr: ['Les informations peuvent changer ; contactez l’établissement avant votre visite.', 'Ce service ne recense pas les pharmacies de garde.'],
  ru: ['Информация может меняться; свяжитесь с заведением перед посещением.', 'Это не справочник дежурных аптек.'],
  ar: ['قد تتغير المعلومات؛ تواصل مع المنشأة قبل الزيارة.', 'هذه ليست خدمة لتحديد الصيدليات المناوبة.'],
  zh: ['信息可能变更；到访前请联系商家确认。', '此服务不提供值班药房信息。'],
};
export function nearbyNotice(language: string, includesPharmacy: boolean): string {
  const [general, pharmacy] = notices[language] ?? notices.en;
  return includesPharmacy ? `${general} ${pharmacy}` : general;
}
