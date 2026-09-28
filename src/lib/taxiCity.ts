/** Conservative supported-city bounds; unknown locations must not inherit Istanbul fares. */
export function taxiCityFromCoordinates(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  if (lat >= 40.8 && lat <= 41.4 && lng >= 28.0 && lng <= 30.0) return 'İstanbul';
  if (lat >= 39.5 && lat <= 40.3 && lng >= 32.2 && lng <= 33.5) return 'Ankara';
  if (lat >= 38.0 && lat <= 38.8 && lng >= 26.5 && lng <= 27.6) return 'İzmir';
  if (lat >= 36.4 && lat <= 37.4 && lng >= 30.0 && lng <= 32.2) return 'Antalya';
  return '';
}

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
