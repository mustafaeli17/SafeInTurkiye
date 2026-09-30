/** Coordinates alone do not establish the licensed taxi tariff jurisdiction.
 * No authoritative boundary dataset is configured. Require explicit selection,
 * even at a city centre, rather than trusting rectangles or nearest-city guesses.
 */
export function taxiCityFromCoordinates(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return '';
}
/** Resolve only an explicitly selected address's administrative province.
 * Never use free text, the destination, nearest-city distance or device coordinates.
 * Istanbul is the only province-wide tariff currently reviewed for publication.
 * District-specific provinces (e.g. Izmir/Cesme) remain unsupported here.
 */
export function taxiCityFromAddress(countryCode: unknown, province: unknown): string {
  if (typeof countryCode !== 'string' || countryCode.toLowerCase() !== 'tr' || typeof province !== 'string') return '';
  return ['İstanbul', 'Istanbul'].includes(province.trim()) ? 'İstanbul' : '';
}
export const taxiCitySelectionCopy:Record<string,[string,string]>={
 tr:['Başlangıç şehri','Şehir seçin — konum tek başına tarife bölgesini doğrulamaz.'],
 en:['Departure city','Choose a city — location alone does not verify the tariff area.'],
 de:['Abfahrtsstadt','Stadt wählen — der Standort allein bestätigt kein Tarifgebiet.'],
 fr:['Ville de départ','Choisissez la ville : la position seule ne confirme pas la zone tarifaire.'],
 ar:['مدينة الانطلاق','اختر المدينة؛ الموقع وحده لا يؤكد منطقة التعرفة.'],
 ru:['Город отправления','Выберите город: координаты сами по себе не подтверждают тарифную зону.'],
 zh:['出发城市','请选择城市；仅凭定位无法确认适用的费率区域。'],
};

const unavailable: Record<string, string> = {
  tr: 'Bu başlangıç noktası ve araç için doğrulanmış tarife bulunamadı. Yanlış şehir tarifesiyle fiyat göstermiyoruz. Güncel ücreti taksi sağlayıcısından kontrol edin.',
  en: 'No verified tariff is available for this starting point and vehicle. We will not use another city’s fare. Check current pricing with the taxi provider.',
  de: 'Für diesen Startpunkt und dieses Fahrzeug ist kein bestätigter Tarif verfügbar. Wir verwenden keinen Tarif einer anderen Stadt. Bitte beim Anbieter prüfen.',
  fr: 'Aucun tarif vérifié pour ce départ et ce véhicule. Nous n’appliquons pas le tarif d’une autre ville. Vérifiez auprès du prestataire.',
  ar: 'لا تتوفر تعرفة موثقة لنقطة الانطلاق ونوع السيارة. لن نستخدم تعرفة مدينة أخرى. تحقق من السعر لدى مقدم الخدمة.',
  ru: 'Для этой точки отправления и автомобиля нет проверенного тарифа. Тариф другого города не применяется. Уточните цену у перевозчика.',
  zh: '此出发地点和车型暂无已核实的费率。我们不会使用其他城市的费率，请向出租车服务商确认价格。',
};
export const taxiUnavailableText = (lang: string) => unavailable[lang] ?? unavailable.en;
