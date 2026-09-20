const categories = ['All', 'Museum & Culture', 'Cinema', 'Entertainment', 'Summer', 'Winter']
const labels: Record<string, string[]> = {
  en: categories,
  tr: ['Tümü', 'Müze ve kültür', 'Sinema', 'Eğlence', 'Yaz', 'Kış'],
  de: ['Alle', 'Museen und Kultur', 'Kino', 'Unterhaltung', 'Sommer', 'Winter'],
  fr: ['Tout', 'Musées et culture', 'Cinéma', 'Loisirs', 'Été', 'Hiver'],
  ar: ['الكل', 'متاحف وثقافة', 'سينما', 'ترفيه', 'الصيف', 'الشتاء'],
  ru: ['Все', 'Музеи и культура', 'Кино', 'Развлечения', 'Лето', 'Зима'],
  zh: ['全部', '博物馆与文化', '影院', '娱乐', '夏季', '冬季'],
}
export function activityLabel(category: string, language: string) {
  const index = categories.indexOf(category)
  return index < 0 ? category : (labels[language] ?? labels.en)[index]
}

const titles: Record<string, string[]> = {
  tr: ['Göreme Açık Hava Müzesi', 'Anadolu Medeniyetleri Müzesi', 'Topkapı Sarayı ve Tarihî Yarımada', 'Beyoğlu’nda sinema gecesi', 'Ankara’da bağımsız sinema', 'Boğaz’da gün batımı vapuru', 'Kaleiçi akşam yürüyüşü', 'Kaş’ta deniz kanosu', 'Kapadokya gün doğumu manzaraları', 'Erciyes’te kayak günü', 'Uludağ kış gezisi'],
  de: ['Freilichtmuseum Göreme', 'Museum der anatolischen Zivilisationen', 'Topkapı-Palast und historische Halbinsel', 'Kinoabend in Beyoğlu', 'Unabhängiges Kino in Ankara', 'Bosphorus-Fähre bei Sonnenuntergang', 'Abendspaziergang durch Kaleiçi', 'Seekajak in Kaş', 'Sonnenaufgang in Kappadokien', 'Skitag am Erciyes', 'Winterausflug zum Uludağ'],
  fr: ['Musée en plein air de Göreme', 'Musée des civilisations anatoliennes', 'Palais de Topkapı et péninsule historique', 'Soirée cinéma à Beyoğlu', 'Cinéma indépendant à Ankara', 'Ferry sur le Bosphore au coucher du soleil', 'Promenade du soir à Kaleiçi', 'Kayak de mer à Kaş', 'Lever du soleil en Cappadoce', 'Journée de ski à Erciyes', 'Excursion hivernale à Uludağ'],
  ar: ['متحف غوريمه المفتوح', 'متحف حضارات الأناضول', 'قصر طوب قابي وشبه الجزيرة التاريخية', 'أمسية سينما في بيوغلو', 'سينما مستقلة في أنقرة', 'عبّارة البوسفور عند الغروب', 'جولة مسائية في كاليتشي', 'التجديف البحري في كاش', 'شروق الشمس في كابادوكيا', 'يوم تزلج في إرجييس', 'رحلة شتوية إلى أولوداغ'],
  ru: ['Музей под открытым небом Гёреме', 'Музей анатолийских цивилизаций', 'Дворец Топкапы и исторический полуостров', 'Киновечер в Бейоглу', 'Независимое кино в Анкаре', 'Паром по Босфору на закате', 'Вечерняя прогулка по Калеичи', 'Морской каякинг в Каше', 'Рассвет в Каппадокии', 'Лыжный день на Эрджиесе', 'Зимняя поездка в Улудаг'],
  zh: ['格雷梅露天博物馆', '安纳托利亚文明博物馆', '托普卡帕宫与历史半岛', '贝伊奥卢电影之夜', '安卡拉独立电影之夜', '博斯普鲁斯日落公共轮渡', '卡莱伊奇晚间漫步', '卡什海上皮划艇', '卡帕多奇亚日出观景点', '埃尔吉耶斯滑雪一日游', '乌鲁达冬季一日游'],
}
const descriptions: Record<string, string[]> = {
  tr: ['Kayaya oyulmuş kiliseler ve freskler; sabah ziyaretleri genellikle daha sakindir.', 'Ankara Kalesi’ni gezmeden önce Anadolu tarihine bir giriş.', 'Güvenlik sıraları ve ayrı biletli bölümler için ek süre ayırın.', 'Bilet almadan önce sinema programını, film dilini ve altyazıları kontrol edin.', 'Yola çıkmadan güncel programı ve altyazı dilini karşılaştırın.', 'Boğaz’ı halk vapurundan izleyin; sefer ve bilet bilgilerini işletmeden kontrol edin.', 'Liman manzarası, eski sokaklar ve restoranlar; kapanış saatlerini kontrol edin.', 'Mevsime ve havaya bağlıdır. Ekipman, sigorta ve iptal koşullarını işletmeden öğrenin.', 'Balon uçuşları hava koşullarına bağlıdır; kalkış garantisi yoktur.', 'Kar, lift durumu, ekipman kiralama ve dönüş ulaşımını kontrol edin.', 'Teleferik ve karayolu erişimi havaya göre değişir; aynı gün kontrol edin.'],
  de: ['Felsenkirchen und Fresken; morgens ist es meist ruhiger.', 'Ein Einstieg in die Geschichte Anatoliens vor dem Besuch der Burg Ankara.', 'Planen Sie Zeit für Sicherheitskontrollen und separat bezahlte Bereiche ein.', 'Prüfen Sie Programm, Filmsprache und Untertitel vor dem Ticketkauf.', 'Vergleichen Sie aktuelles Programm und Untertitelsprache vor der Anfahrt.', 'Erleben Sie den Bosphorus mit der öffentlichen Fähre; Fahrplan und Tickets beim Betreiber prüfen.', 'Hafenblick, alte Gassen und Restaurants; Öffnungszeiten vorher prüfen.', 'Saison- und wetterabhängig. Ausrüstung, Versicherung und Stornierung beim Anbieter prüfen.', 'Ballonstarts hängen vom Wetter ab und sind nicht garantiert.', 'Schnee, Liftbetrieb, Ausrüstungsverleih und Rückfahrt vorher prüfen.', 'Seilbahn und Straßen können wetterbedingt schließen; am Reisetag prüfen.'],
  fr: ['Églises rupestres et fresques ; les matinées sont souvent plus calmes.', 'Une introduction à l’Anatolie avant la visite du château d’Ankara.', 'Prévoyez du temps pour les contrôles et les sections à billet séparé.', 'Vérifiez programme, langue et sous-titres avant d’acheter.', 'Comparez le programme actuel et la langue des sous-titres avant le départ.', 'Admirez le Bosphore en ferry public ; vérifiez horaires et billets auprès de l’opérateur.', 'Vues du port, ruelles et restaurants ; vérifiez les heures de fermeture.', 'Selon saison et météo. Confirmez équipement, assurance et annulation.', 'Les vols en ballon dépendent de la météo et ne sont pas garantis.', 'Vérifiez neige, remontées, location de matériel et retour.', 'Téléphérique et routes dépendent de la météo ; vérifiez le jour même.'],
  ar: ['كنائس منحوتة في الصخر ولوحات جدارية؛ الزيارة صباحًا عادة أهدأ.', 'مقدمة لتاريخ الأناضول قبل استكشاف قلعة أنقرة.', 'خصص وقتًا لطوابير التفتيش والأقسام ذات التذاكر المنفصلة.', 'تحقق من البرنامج ولغة الفيلم والترجمة قبل شراء التذكرة.', 'قارن البرنامج الحالي ولغة الترجمة قبل الذهاب.', 'شاهد البوسفور بالعبّارة العامة؛ تحقق من الجدول والتذاكر لدى المشغل.', 'إطلالات الميناء والأزقة والمطاعم؛ تحقق من ساعات الإغلاق.', 'يعتمد على الموسم والطقس. أكد المعدات والتأمين وشروط الإلغاء.', 'رحلات المناطيد تعتمد على الطقس ولا يمكن ضمان الإقلاع.', 'تحقق من الثلوج والمصاعد واستئجار المعدات ووسيلة العودة.', 'قد تتغير إمكانية الوصول بالتلفريك والطرق بسبب الطقس؛ تحقق في يوم السفر.'],
  ru: ['Скальные церкви и фрески; утром обычно спокойнее.', 'Знакомство с историей Анатолии перед прогулкой к крепости Анкары.', 'Заложите время на досмотр и секции с отдельными билетами.', 'Проверьте программу, язык фильма и субтитры перед покупкой.', 'Сравните текущую программу и язык субтитров до поездки.', 'Посмотрите Босфор с общественного парома; уточните расписание и билеты у оператора.', 'Виды гавани, старые улицы и рестораны; проверьте время закрытия.', 'Зависит от сезона и погоды. Уточните оборудование, страховку и отмену.', 'Полёты шаров зависят от погоды; взлёт не гарантирован.', 'Проверьте снег, подъёмники, аренду оборудования и обратный транспорт.', 'Канатная дорога и дороги зависят от погоды; уточняйте в день поездки.'],
  zh: ['岩石教堂与壁画；早晨参观通常更安静。', '游览安卡拉城堡前，先了解安纳托利亚历史。', '请为安检排队和单独售票区域预留时间。', '购票前请核对影院排片、影片语言与字幕。', '出发前请核对最新排片和字幕语言。', '乘公共轮渡欣赏博斯普鲁斯；请向运营方核实班次和票价。', '港口风景、古老街道与餐厅；请核实关门时间。', '受季节与天气影响；请确认装备、保险及取消条款。', '热气球受天气影响，不能保证起飞。', '出发前确认雪况、缆车、装备租赁和返程交通。', '缆车与道路可能因天气调整，请于出行当天核实。'],
}
const metadata: Record<string, string[]> = {
  en: ['Duration', 'Guide', 'Check official ticket', 'Check programme', 'Transit fare applies', 'Free', 'Request current quote', 'Viewpoints vary', 'Seasonal', 'Audio guide options', 'Museum information', 'Original/subtitled varies', 'Varies by screening', 'Self-guided', 'Operator dependent', 'Self-guided/operator', 'Half day', 'Full day', 'Film schedule', 'Hours'],
  tr: ['Süre', 'Rehber', 'Resmî bilet bilgisini kontrol edin', 'Programı kontrol edin', 'Ulaşım ücreti geçerli', 'Ücretsiz', 'Güncel fiyat isteyin', 'Noktaya göre değişir', 'Mevsimlik', 'Sesli rehber seçenekleri', 'Müze bilgisi', 'Dil/altyazı değişir', 'Gösterime göre değişir', 'Rehbersiz', 'İşletmeye göre değişir', 'Rehbersiz/işletme', 'Yarım gün', 'Tam gün', 'Film programı', 'saat'],
  de: ['Dauer', 'Führung', 'Offizielles Ticket prüfen', 'Programm prüfen', 'Verkehrstarif gilt', 'Kostenlos', 'Aktuellen Preis anfragen', 'Je nach Aussichtspunkt', 'Saisonal', 'Audioguide verfügbar', 'Museumsinformationen', 'Sprache/Untertitel variieren', 'Je nach Vorführung', 'Ohne Führung', 'Je nach Anbieter', 'Selbstgeführt/Anbieter', 'Halber Tag', 'Ganzer Tag', 'Kinoprogramm', 'Stunden'],
  fr: ['Durée', 'Guide', 'Vérifier le billet officiel', 'Vérifier le programme', 'Tarif transport applicable', 'Gratuit', 'Demander le prix actuel', 'Selon le point de vue', 'Saisonnier', 'Options audioguide', 'Informations du musée', 'Langue/sous-titres variables', 'Selon la séance', 'Visite libre', 'Selon l’opérateur', 'Libre/opérateur', 'Demi-journée', 'Journée entière', 'Programme cinéma', 'heures'],
  ar: ['المدة', 'الدليل', 'تحقق من التذكرة الرسمية', 'تحقق من البرنامج', 'تطبق أجرة النقل', 'مجاني', 'اطلب السعر الحالي', 'حسب موقع المشاهدة', 'موسمي', 'خيارات دليل صوتي', 'معلومات المتحف', 'تختلف اللغة والترجمة', 'حسب العرض', 'جولة ذاتية', 'حسب المشغل', 'ذاتي/مشغل', 'نصف يوم', 'يوم كامل', 'برنامج الأفلام', 'ساعات'],
  ru: ['Длительность', 'Гид', 'Проверьте официальный билет', 'Проверьте программу', 'Действует транспортный тариф', 'Бесплатно', 'Уточните текущую цену', 'Зависит от площадки', 'Сезонное', 'Аудиогид', 'Информация музея', 'Язык и субтитры различаются', 'Зависит от сеанса', 'Самостоятельно', 'Зависит от оператора', 'Самостоятельно/оператор', 'Полдня', 'Целый день', 'Кинопрограмма', 'ч.'],
  zh: ['时长', '导览', '查看官方门票', '查看排片', '适用交通票价', '免费', '询问当前报价', '因观景点而异', '季节性', '语音导览选项', '博物馆信息', '原声及字幕因场次而异', '因场次而异', '自行游览', '因运营方而异', '自行游览/运营方', '半天', '全天', '影片排片', '小时'],
}
export function activityText(value: string, lang: string) {
  const translated = metadata[lang] ?? metadata.en
  const index = metadata.en.indexOf(value)
  if (index >= 0) return translated[index]
  return value.replace(/Hours?$/, translated[19])
}
export function activityContent<T extends { id: string; title: string; description: string }>(item: T, lang: string): T {
  const index = Number(item.id.slice(1)) - 1
  return { ...item, title: titles[lang]?.[index] ?? item.title, description: descriptions[lang]?.[index] ?? item.description }
}
