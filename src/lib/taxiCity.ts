/** Coordinates alone do not establish the licensed taxi tariff jurisdiction.
 * No authoritative boundary dataset is configured. Require explicit selection,
 * even at a city centre, rather than trusting rectangles or nearest-city guesses.
 */
export function taxiCityFromCoordinates(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return '';
}
const provinces = 'Adana|Adıyaman|Afyonkarahisar|Ağrı|Amasya|Ankara|Antalya|Artvin|Aydın|Balıkesir|Bilecik|Bingöl|Bitlis|Bolu|Burdur|Bursa|Çanakkale|Çankırı|Çorum|Denizli|Diyarbakır|Edirne|Elazığ|Erzincan|Erzurum|Eskişehir|Gaziantep|Giresun|Gümüşhane|Hakkari|Hatay|Isparta|Mersin|İstanbul|İzmir|Kars|Kastamonu|Kayseri|Kırklareli|Kırşehir|Kocaeli|Konya|Kütahya|Malatya|Manisa|Kahramanmaraş|Mardin|Muğla|Muş|Nevşehir|Niğde|Ordu|Rize|Sakarya|Samsun|Siirt|Sinop|Sivas|Tekirdağ|Tokat|Trabzon|Tunceli|Şanlıurfa|Uşak|Van|Yozgat|Zonguldak|Aksaray|Bayburt|Karaman|Kırıkkale|Batman|Şırnak|Bartın|Ardahan|Iğdır|Yalova|Karabük|Kilis|Osmaniye|Düzce'.split('|');
const normalize = (value: string) => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').toLowerCase();
/** Provider-supplied administrative province of the selected origin, never user free text.
 * Resolving a province does NOT imply that its local tariff is available.
 */
export function taxiCityFromAddress(countryCode: unknown, province: unknown): string {
  if (typeof countryCode !== 'string' || countryCode.toLowerCase() !== 'tr' || typeof province !== 'string') return '';
  return provinces.find(city => normalize(city) === normalize(province)) ?? '';
}
/** Query the origin's own tariff only. The repository separately enforces verification,
 * validity and vehicle class. Recognizing a province does not supply a fare. */
export const taxiReferenceCity = (origin: string) => provinces.includes(origin) ? origin : '';
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
  tr: 'Rotanız hazır. Bu başlangıç noktası için güncel yerel ücret henüz doğrulanmadı. Mesafe ve süreyi aşağıda görebilir, ücreti yerel taksiden veya hizmet veriyorsa BiTaksi üzerinden kontrol edebilirsiniz.',
  en: 'Your route is ready. A current local fare for this starting point has not yet been verified. See distance and duration below; check pricing with a local taxi or BiTaksi where available.',
  de: 'Ihre Route ist bereit. Ein aktueller Ortstarif für diesen Startpunkt ist noch nicht bestätigt. Entfernung und Dauer stehen unten; fragen Sie ein örtliches Taxi oder BiTaksi, sofern verfügbar.',
  fr: 'Votre itinéraire est prêt. Le tarif local actuel n’est pas encore vérifié. Consultez la distance et la durée ci-dessous, puis vérifiez le prix auprès d’un taxi local ou de BiTaksi si disponible.',
  ar: 'مسارك جاهز. لم يتم التحقق من الأجرة المحلية الحالية لنقطة الانطلاق. المسافة والمدة أدناه؛ تحقق من السعر لدى سيارة أجرة محلية أو BiTaksi حيث تتوفر الخدمة.',
  ru: 'Маршрут готов. Актуальный местный тариф пока не проверен. Расстояние и время указаны ниже; уточните цену у местного такси или в BiTaksi, если сервис доступен.',
  zh: '路线已准备好，但尚未核实出发地的当前当地费率。距离和时间如下；请向当地出租车或在提供服务的地区通过 BiTaksi 确认价格。',
};
export const taxiUnavailableText = (lang: string) => unavailable[lang] ?? unavailable.en;
