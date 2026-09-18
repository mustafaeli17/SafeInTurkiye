import { useState } from 'react';

const questions = [
  ['İstanbul’da ulaşım kartını nasıl alırım?', 'How do I get an Istanbul transport card?', 'İstanbulkart satış ve dolum noktalarını resmî siteden bulun. Kart bedeli ile yolculuk bakiyesi ayrıdır. Aktarma indirimi ve kişiselleştirme koşullarını kart türünüz için kontrol edin.', 'Find İstanbulkart sales and top-up points on the official website. Card cost and travel balance are separate. Check transfer and personalisation conditions for your card type.', 'https://istanbulkart.istanbul/'],
  ['Ankara’da ulaşım kartını nasıl alırım?', 'How do I get an Ankara transport card?', 'Başkent Kart Ulaşım için EGO’nun kart işlem merkezleri veya yetkili bayilerini kullanın. Ziyaretçi olarak tam biniş kartını sorun; indirimli kartlar belge gerektirir. Kartınızı yükledikten sonra araç veya turnikedeki okuyucuya okutun.', 'Use EGO card centres or authorised dealers for Başkent Kart Ulaşım. Ask for a full-fare card as a visitor; concession cards require eligibility documents. Add balance and tap the reader on boarding.', 'https://www.ego.gov.tr/sayfa/2346/kart-basvurusu'],
  ['İzmir’de ulaşım kartını nasıl alırım?', 'How do I get an İzmir transport card?', 'İzmirim Kart satış ve dolum noktalarını resmî siteden kontrol edin. Tam kart ile indirimli kart başvurusu farklıdır. İZBAN gibi hatlarda ücret ve iade uygulamasını yolculuktan önce kontrol edin.', 'Check İzmirim Kart’s official sales and top-up locations. Full-fare cards and concession applications differ. Check fare and refund rules for services such as İZBAN before travelling.', 'https://www.izmirimkart.com.tr/'],
  ['Antalya’da ulaşım kartını nasıl alırım?', 'How do I get an Antalya transport card?', 'Antalyakart’ı kart satış/dolum cihazlarından, kart merkezlerinden veya bayilerden alabilirsiniz. Bakiye cihazlardan, dolum noktalarından ve resmî uygulamadan yüklenebilir. Temassız banka kartı da desteklenir; uygulanacak ücreti kontrol edin.', 'Buy Antalyakart at sales/top-up machines, card centres or dealers. Add balance at machines, top-up points or through the official app. Contactless bank cards are also supported; check the applicable fare.', 'https://www.antalyakart.com.tr/Page/KartCesitleri'],
  ['Aktarma ücreti ve son seferi nasıl öğrenirim?', 'How do I check transfers and the last departure?', 'Ücret, kart türü, hat ve aktarma süresine göre değişir. Yolculuk tarihi için işletmenin tarife ve duyurularını kontrol edin. Bu sitede tüm şehirleri kapsayan canlı sefer hizmeti henüz bağlı değil.', 'Fares depend on card type, line and transfer window. Check the operator’s timetable and notices for your travel date. A live all-city timetable service is not yet connected here.', 'https://www.ego.gov.tr/sss'],
  ['Taksi tahmini neden taksimetreden farklı olabilir?', 'Why can a taxi estimate differ from the meter?', 'Bekleme, trafik, yol değişikliği ve geçiş ücretleri toplamı değiştirebilir. Tahminin tarife tarihini kontrol edin; yolculuk sonunda fiş isteyin.', 'Waiting, traffic, route changes and tolls can change the total. Check the tariff date on the estimate and request a receipt.'],
  ['Referans kur ile döviz bürosu kuru aynı mı?', 'Is the reference rate the same as a bureau quote?', 'Hayır. Referans kur karşılaştırma içindir; büro alış ve satış fiyatını ayrı belirler. İşlem öncesi komisyon dahil elinize geçecek net tutarı sorun.', 'No. Reference rates are for comparison. Bureaux set separate buying and selling prices. Ask for the final amount including any commission before exchanging.'],
  ['Konumum bulunamıyor; ne yapmalıyım?', 'What if my location cannot be found?', 'Tarayıcının konum iznini kontrol edin. Konum izni vermek istemiyorsanız şehir merkezi aramasını kullanın. Yakındaki yerlerin saatleri eksik olabilir; gitmeden telefon edin.', 'Check your browser’s location permission. You can search the city centre without sharing your location. Published hours may be incomplete; call before visiting.'],
  ['Rezervasyon talebi kesin rezervasyon mu?', 'Is a booking request a confirmed reservation?', 'Hayır. Talep kaydı işletmenin müsaitlik veya kabul onayı değildir. İşletme onayı gelmeden rezervasyonunuzun kesinleştiğini varsaymayın.', 'No. A submitted request does not confirm availability or acceptance by the business. Wait for the business’s confirmation.'],
  ['Neden giriş yapmam gerekiyor?', 'Why do I need to sign in?', 'Rezervasyon talebini hesabınızla ilişkilendirmek için giriş gerekir. Yerel tasarım önizlemesi gerçek hesap hizmetine bağlı değilse giriş ve talep kaydı yapılamaz.', 'Sign-in associates booking requests with your account. An offline design preview cannot sign in or save requests until connected to the account service.'],
  ['Yakındaki işletmeler şu anda açık mı?', 'Are nearby businesses open right now?', 'Kartlarda kaynağın yayımladığı çalışma saatleri gösterilir. Tatil veya özel durumlar nedeniyle saatler değişebilir. Anlık açık bilgisi doğrulanmadıysa kesin açık diye gösterilmez.', 'Cards show hours published by the source. Holidays and exceptions may change them. Unverified live opening status is not presented as confirmed.'],
  ['Gezilecek yerleri nasıl seçebilirim?', 'How do I choose places to visit?', 'Şehirler bölümünden başlayın. Aynı bölgedeki yerleri bir güne toplayın; müze ziyaretinden önce resmî açılış, bilet ve erişilebilirlik bilgilerini kontrol edin.', 'Start with the Cities section. Group nearby sights into one day and check official opening times, tickets and accessibility before visiting.'],
  ['Kapadokya balonları her gün kalkar mı?', 'Do Cappadocia balloons fly every day?', 'Uçuşlar hava koşullarına ve işletmenin uçuş onayına bağlıdır. Belirli bir gün için uçuş garantisi verilemez; rezervasyon yaptığınız işletmeye sorun.', 'Flights depend on weather and flight approval. A flight cannot be guaranteed for a particular day; check with your booked operator.'],
  ['Fotoğraflar ve fiyatlar rezervasyon garantisi mi?', 'Do photos and prices guarantee availability?', 'Hayır. Fotoğraf bir tanıtım görseli olabilir. Oda, masa veya aktivite müsaitliğini ve nihai fiyatı işletmeden doğrulayın.', 'No. A photo may be illustrative. Confirm room, table or activity availability and final prices directly with the business.'],
];

const localized: Record<string, [string, string][]> = {
  zh: [
    ['如何购买伊斯坦布尔交通卡？', '在 İstanbulkart 官方网站查询售卡和充值点。卡费与乘车余额分开计算；请核实所选卡种的换乘优惠和实名要求。'],
    ['如何购买安卡拉交通卡？', '到 EGO 服务中心或授权售卡点购买 Başkent Kart Ulaşım。游客可咨询全价卡。充值后，上车或进站时刷卡。优惠卡需要资格证明。'],
    ['如何购买伊兹密尔交通卡？', '在 İzmirim Kart 官方网站查询售卡和充值点。全价卡与优惠卡申请不同；乘坐 İZBAN 前请核实扣费和退款规则。'],
    ['如何购买安塔利亚交通卡？', '可在售卡充值机、服务中心或代理点购买 Antalyakart。可通过机器、充值点或官方应用充值。也支持非接触式银行卡，请先确认票价。'],
    ['如何查询换乘费用和末班车？', '费用取决于卡种、线路和换乘时间。请查看运营方当天的时刻表与公告。本站尚未接入覆盖所有城市的实时班次服务。'],
    ['为什么出租车估价与计价器不同？', '等待、交通、路线变化和通行费都可能影响总价。查看估价使用的资费日期，并索取收据。'],
    ['参考汇率等于兑换点报价吗？', '不等于。参考汇率仅用于比较；兑换点自行制定买入和卖出价。兑换前请确认包含手续费的实际到账金额。'],
    ['无法定位怎么办？', '检查浏览器定位权限，或选择市中心搜索。营业时间可能不完整，出发前请电话确认。'],
    ['提交预订申请后就确认了吗？', '没有。申请不代表商家已接受或仍有空位。请等待商家确认。'],
    ['为什么需要登录？', '登录用于将预订申请关联到您的账户。未连接账户服务的本地预览无法登录或保存申请。'],
    ['附近商家现在营业吗？', '页面显示来源公布的营业时间。节假日可能有变化；未经核实的实时营业状态不会显示为已确认。'],
    ['如何安排游览？', '从城市页面开始，把相近景点安排在同一天。参观前确认官方开放时间、门票和无障碍信息。'],
    ['卡帕多奇亚热气球每天起飞吗？', '取决于天气和飞行许可，不能保证某天起飞。请向预订的运营商确认。'],
    ['照片和价格保证可预订吗？', '不能。照片可能仅供参考。请向商家确认房间、餐位或活动余位及最终价格。'],
  ],
  ar: [
    ['كيف أشتري بطاقة مواصلات إسطنبول؟', 'تحقق من نقاط بيع وشحن İstanbulkart على الموقع الرسمي. ثمن البطاقة منفصل عن رصيد الرحلات. راجع شروط التحويل وتخصيص البطاقة لنوع بطاقتك.'],
    ['كيف أشتري بطاقة مواصلات أنقرة؟', 'استخدم مراكز EGO أو الوكلاء المعتمدين لشراء Başkent Kart Ulaşım. اسأل عن بطاقة الأجرة الكاملة للزائر؛ البطاقات المخفضة تتطلب إثبات الأهلية. اشحن البطاقة ومررها عند الصعود.'],
    ['كيف أشتري بطاقة مواصلات إزمير؟', 'راجع نقاط بيع وشحن İzmirim Kart الرسمية. تختلف البطاقة الكاملة عن طلب البطاقة المخفضة. تحقق من قواعد الأجرة والاسترداد لخطوط مثل İZBAN قبل السفر.'],
    ['كيف أشتري بطاقة مواصلات أنطاليا؟', 'يمكن شراء Antalyakart من أجهزة البيع والشحن والمراكز والوكلاء. الشحن متاح من الأجهزة والنقاط والتطبيق الرسمي. البطاقات البنكية اللاتلامسية مدعومة أيضًا؛ تحقق من الأجرة.'],
    ['كيف أعرف رسوم التحويل وآخر رحلة؟', 'تختلف الأجرة بحسب البطاقة والخط ومدة التحويل. راجع جدول المشغل وإعلانات يوم السفر. لم يتم ربط خدمة مواعيد مباشرة لجميع المدن هنا بعد.'],
    ['لماذا يختلف تقدير التاكسي عن العداد؟', 'قد يتغير الإجمالي بسبب الانتظار والزحام وتغيير الطريق ورسوم المرور. تحقق من تاريخ التعرفة واطلب إيصالًا.'],
    ['هل السعر المرجعي هو سعر مكتب الصرافة؟', 'لا. السعر المرجعي للمقارنة فقط. يحدد المكتب سعري الشراء والبيع. اسأل عن المبلغ الصافي بعد العمولة قبل المعاملة.'],
    ['ماذا أفعل إذا تعذر تحديد موقعي؟', 'تحقق من إذن الموقع في المتصفح أو ابحث حول مركز المدينة. قد تكون ساعات العمل ناقصة؛ اتصل قبل الذهاب.'],
    ['هل طلب الحجز حجز مؤكد؟', 'لا. إرسال الطلب لا يؤكد التوفر أو قبول المنشأة. انتظر تأكيد المنشأة.'],
    ['لماذا يجب تسجيل الدخول؟', 'لربط طلب الحجز بحسابك. لا يمكن للمعاينة المحلية غير المتصلة بخدمة الحسابات تسجيل الدخول أو حفظ الطلبات.'],
    ['هل الأماكن القريبة مفتوحة الآن؟', 'نعرض ساعات العمل المنشورة في المصدر وقد تتغير في العطلات. لا نعرض حالة الفتح المباشرة على أنها مؤكدة دون تحقق.'],
    ['كيف أختار أماكن الزيارة؟', 'ابدأ بقسم المدن واجمع الأماكن المتقاربة في يوم واحد. تحقق من أوقات الفتح والتذاكر وإمكانية الوصول الرسمية قبل الزيارة.'],
    ['هل تطير مناطيد كابادوكيا يوميًا؟', 'تعتمد الرحلات على الطقس وتصريح الطيران. لا يمكن ضمان الطيران في يوم محدد؛ راجع المشغل الذي حجزت معه.'],
    ['هل الصور والأسعار تضمن التوفر؟', 'لا. قد تكون الصور توضيحية. أكد توفر الغرفة أو الطاولة أو النشاط والسعر النهائي مع المنشأة.'],
  ],
};
const ui: Record<string, string[]> = {
  tr: ['Ulaşım, para, konum ve rezervasyon hakkında pratik rehber.', 'Sorularda ara…', 'Resmî bilgi', 'Bu arama için soru bulunamadı.'],
  en: ['Practical guidance on transport, money, location and bookings.', 'Search questions…', 'Official information', 'No questions match your search.'],
  zh: ['交通、换汇、定位和预订实用指南。', '搜索问题…', '官方信息', '未找到匹配的问题。'],
  ar: ['دليل عملي للمواصلات والصرف والموقع والحجز.', 'ابحث في الأسئلة…', 'المعلومات الرسمية', 'لا توجد أسئلة تطابق البحث.'],
};
export function TransportCardGuide({ city, lang }: { city: string; lang: string }) {
  const index = ({ 'İstanbul': 0, Ankara: 1, 'İzmir': 2, Antalya: 3 } as Record<string, number>)[city];
  if (index === undefined) return null;
  const original = questions[index];
  const translation = localized[lang]?.[index];
  const row = translation ? [translation[0], translation[0], translation[1], translation[1], original[4]] : original;
  return <section className="bg-white p-5 rounded-2xl border border-sky-100 space-y-3"><h2 className="font-bold">{row[lang === 'tr' ? 0 : 1]}</h2><p className="text-sm text-slate-600">{row[lang === 'tr' ? 2 : 3]}</p><a className="text-sky-700 underline text-sm" href={row[4]} target="_blank" rel="noreferrer">{(ui[lang] ?? ui.en)[2]}</a></section>;
}

export default function TravelFaq({ lang, initialQuery = '' }: { lang: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const tr = lang === 'tr';
  const labels = ui[lang] ?? ui.en;
  const title = ({ tr: 'Sık sorulan sorular', en: 'Frequently asked questions', de: 'Häufige Fragen', fr: 'Questions fréquentes', ar: 'الأسئلة الشائعة', zh: '常见问题', ru: 'Частые вопросы' } as Record<string,string>)[lang] ?? 'Frequently asked questions';
  const rows = questions.map((row, index) => localized[lang]?.[index] ? [localized[lang][index][0], localized[lang][index][0], localized[lang][index][1], localized[lang][index][1], row[4]] : row);
  const items = rows.filter(row => row.slice(0,4).join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <main dir={lang === 'ar' ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4 pb-24">
    <h1 className="text-3xl font-extrabold">{title}</h1>
    <p className="text-sm text-slate-600">{labels[0]}</p>
    <input value={query} onChange={e => setQuery(e.target.value)} placeholder={labels[1]} aria-label={title} className="w-full p-3 bg-white border border-sky-100 rounded-xl" />
    {items.map(row => <details key={row[0]} className="rounded-2xl bg-white border border-sky-100 p-4"><summary className="font-bold cursor-pointer">{row[tr ? 0 : 1]}</summary><p className="text-sm text-slate-600 mt-3 leading-relaxed">{row[tr ? 2 : 3]}</p>{row[4] && <a href={row[4]} target="_blank" rel="noreferrer" className="inline-block mt-3 text-sky-700 underline text-sm">{labels[2]}</a>}</details>)}
    {!items.length && <p>{labels[3]}</p>}
  </main>;
}
