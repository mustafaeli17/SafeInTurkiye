# SafeInTürkiye — bulgu ve kanıt kaydı

Tarih: 25.10.2026. Baseline: `924674c`. Ortam: Windows, gerçek in-app Chromium; production read-only; yerel kod/test/build. Kanıtlar: [CHECKS](audit-evidence/CHECKS.md), [HTTP sonuçları](audit-evidence/http-results.json). **Bu belge düzeltme yapıldığı anlamına gelmez.**

Etiketler: **LIVE** = tarayıcı/HTTP ile gözlendi; **CODE** = kodda doğrulandı; **RISK** = etkisi veya dış koruması doğrulanmadı. P1'ler aynı tür değil: biri işletme güveni, diğeri Windows geliştirme ortamı güvenliği. Kanıtlanan production P0/kritik veri sızıntısı yok; bu, kapsam dışı risklerin yokluğu garantisi değildir.

## Özet

| ID | Önem | Tür | Başlık |
|---|---|---|---|
| F01 | P1 | LIVE+CODE / işletme güveni | Gerçek destek kanalı ve işletmeci bilgisi yok |
| F02 | P1 | CODE / geliştirme güvenliği | Vite 8.2.2 için Windows güvenlik duyurusu |
| F03 | P2 | LIVE+CODE | Ortak keşif/giriş metinleri bazı dillerde İngilizce |
| F04 | P2 | LIVE+CODE | Manuel adres/bölge yenilemede kayboluyor |
| F05 | P2 | LIVE+CODE | Yaz/Kış kısayolları genel aktivitelerle aynı |
| F06 | P2 | LIVE+CODE | Giriş modalı erişilebilirlik/klavye eksikleri |
| F07 | P2 | CODE | Gözlemsel taxi budget kayıtlarında eskime kontrolü yok |
| F08 | P2 | BUILD+CODE | Ana JS ve logo gereğinden ağır |
| F09 | P2 | HTTP+CODE / hardening | CSP/frame-ancestors koruması tanımlı değil |
| F10 | P2 | LOCAL | Görsel kontrol script'i temiz ortamda çalışmıyor |
| F11 | P2 | LIVE+CODE / içerik tutarlılığı | FAQ ve gizlilik metni durmuş rezervasyon akışıyla uyumsuz |
| F12 | P3 | LIVE+CODE | Geçersiz döviz tutarında açıklamasız boş sonuç |
| F13 | P3 | LIVE+CODE | Safety sayfasında tekrarlanan özet |
| F14 | P2 | LIVE+CODE | Uzun açık oturumda yeni kartların fotoğrafları kayboluyor |

Dağılım: **P0 0 / P1 2 / P2 10 / P3 2**. Aşağıdaki R kayıtları bu sayılara dahil edilmemiştir.

## F01 — İletişim ve işletmeci bilgileri eksik

- **Route / cihaz:** `/contact`, `/privacy`, `/terms`; Chromium mobil 390px ve kod.
- **Adımlar:** Contact and support bağlantısını aç; destek e-postası/işletmeci/başvuru kanalı ara.
- **Beklenen:** Çalışan, sorumlusu belli bir destek yolu; gizlilik başvurusu için gerçek iletişim.
- **Gerçek:** Bilgilerin site sahibinin onayını beklediği yazıyor. İşletmeci veya destek e-postası yok. Gizlilik metni rezervasyon verisinden bahsediyor ancak süreç/retention ve işletmeci açıklaması tamamlanmamış.
- **Kanıt:** `audit-evidence/contact-incomplete.jpg`; `src/lib/siteInformation.ts`, `SiteInformation.tsx`.
- **Kök neden:** Sahibi tarafından operasyonel bilgiler henüz sağlanmamış; önceki “henüz yok” cevabıyla tutarlı.
- **Etki:** Sorun yaşayan veya veri hakkı kullanmak isteyen ziyaretçi destek alamaz; ticari güven zayıf. Bu bir hukuki uygunluk sertifikası veya kesin mevzuat ihlali kararı değildir.
- **Çözüm:** Sahip gerçek işletmeci adı, kontrol ettiği e-posta ve gerçekçi destek işleyişini belirlemeli; ardından yayımlanan metinler gerçek veri akışına göre tamamlanmalı. Uydurma şirket/yanıt garantisi eklenmemeli.
- **Zorluk / maliyet:** Kod düşük, sahip kararı gerekli; yeni ücretli API gerekmez. Hukuki inceleme bedeli ayrıca değerlendirilir.

## F02 — Windows geliştirme ortamında Vite güvenlik güncellemesi gerekli

- **Alan:** `package.json`/lockfile; yerel Vite 8.2.2, Windows. Production statik çıktı ile aynı saldırı yüzeyi değildir.
- **Adımlar:** `npm audit --omit=dev --json`; kurulu Vite sürümünü kontrol et.
- **Beklenen:** Güncel güvenlik patch'i; güvenilmeyen isteklerle erişilebilir geliştirme sunucusu olmaması.
- **Gerçek:** npm Vite için high advisory grubu raporladı. Duyuru Windows launch-editor argüman işleme riskini anlatıyor. Exploit denenmedi.
- **Kanıt:** CHECKS komut sonucu; [birincil GitHub advisory](https://github.com/advisories/GHSA-587h-7wmj-h5pm). Advisory 8.2 serisinde 8.2.4 patch'ini listeliyor.
- **Kök neden:** Mevcut kilitli paket güvenlik patch'inin gerisinde.
- **Etki:** Uygun önkoşullar altında yerel geliştirme makinesi riski. “Canlı site hacklendi” sonucu çıkarılamaz.
- **Çözüm:** Onay sonrası aynı minör hatta güvenlik patch'i + tek regression run; dev server yalnız yerel arayüzde tutulmalı. Audit turunda `npm audit fix` veya paket yükseltmesi yapılmadı.
- **Zorluk / maliyet:** Düşük; lisans/servis ücreti gerektirmez.

## F03 — Eksik ortak arayüz çevirileri

- **Route / cihaz:** `/near-me?city=aydin`; DE/FR/AR/RU/ZH; 768px ve mobil örnekler. Giriş modalı da bazı metinleri hardcode ediyor.
- **Adımlar:** Near Me'de dil değiştir; konum açıklaması, kategori düğmeleri, arama etiketi, hata açıklamasını oku.
- **Beklenen:** Ürünün kendi UI metinleri seçilen dilde. İşletme adı veya açıklanmış provider dil fallback'i ayrı tutulmalı.
- **Gerçek:** “If you use your location…” ve Hotel/Shopping gibi İngilizce ortak metinler kalıyor. İngilizce oturumda admin kapısı Türkçe. Login açıklaması/Cancel/Password çok dilli değil.
- **Kanıt:** `nearby-de.jpg`, `nearby-ar.jpg`, `nearby-zh.jpg`, `auth-modal.jpg`; `NearbyPlaces.tsx` translated sözlükleri, `App.tsx` auth alanı.
- **Kök neden:** EN fallback'li sözlüklerde eksik anahtarlar; hardcoded auth/admin metinleri.
- **Etki:** İzin ve hata durumları anlaşılamıyor; site yarım çevrilmiş hissi veriyor.
- **Çözüm:** Ortak UI sözlüğünü tamamla; provider içerik diliyle UI dilini ayrı test et. Viator'ın Çince/Türkçe/Arapça/Rusça için açıklanan İngilizce ürün içeriği bu bulgunun kendisi değildir.
- **Zorluk / maliyet:** Orta; yeni API gerekmez, doğal dil gözden geçirmesi önerilir.

## F04 — Manuel bölgenin URL/durum restorasyonu eksik

- **Route / cihaz:** `/near-me?city=aydin`; Chromium 390/768px. Aynı shared component hotel/restaurant/activity/exchange'de kullanılıyor; hepsinde tek tek yeniden üretildiği iddia edilmiyor.
- **Adımlar:** Aydın sayfasında adres alanına Beşiktaş, İstanbul yaz; ilk öneriyi seç; Beşiktaş sonuçlarını gör; sayfayı yenile.
- **Beklenen:** Seçim geri yüklenmeli veya aramanın geçici olduğu açık olmalı; sessizce başka bölgeye dönülmemeli.
- **Gerçek:** Sonuçlar önce Beşiktaş'tan geliyor ancak URL hâlâ `city=aydin`. Yenilemede adres boş, şehir Aydın, sonuç idle. Şehir düzeyindeki seçim/back/reload ise çalışıyor.
- **Kanıt:** `manual-area-before-reload.jpg`, `manual-area-after-reload.jpg`; `NearbyPlaces.tsx` address/addressPlace useState; query yalnız city/category/place tutuyor.
- **Etki:** Kullanıcı aramayı yeniden yapar; paylaşım ve detay URL'si manuel bölgeyi tam temsil etmez.
- **Çözüm:** Kişisel konum sızdırmadan session tabanlı arama restorasyonu tasarla; yalnız açıkça seçilen kamusal bölgeyi URL'ye taşıma seçeneğini değerlendir. Hassas koordinatı otomatik analytics'e aktarma.
- **Zorluk / maliyet:** Orta; yeni API gerekmez, güvenli durum restorasyonu testi gerekir.

## F05 — Yaz/Kış aktivite kısayolu işlevsel olarak genel liste

- **Route / cihaz:** Ana sayfa -> `/activities?city=istanbul`; Chromium desktop.
- **Adımlar:** Ana sayfada Winter tıkla; seçili kategori ve sonuçları kontrol et.
- **Beklenen:** Kış bağlamı ya korunur ya da kısayol böyle bir filtre vaat etmez.
- **Gerçek:** “Things to do” seçili; Galata, Kapalıçarşı, Ayasofya gibi genel liste. Summer da kodda aynı varsayılan kola düşüyor.
- **Kanıt:** `winter-unfiltered.jpg`; `App.tsx` initialCategory eşlemesi yalnız Cinema/Museum/Entertainment için ayrı.
- **Etki:** Özellikle Uludağ/kış veya sahil/yaz arayan ziyaretçi beklediği daraltmayı alamaz.
- **Çözüm:** En düşük maliyetli ilk adım yanlış vaat eden mevsim düğmelerini kaldırmak/yeniden adlandırmak; gerçek bir sezonsal taxonomy olmadan “kış sonuçları” uydurmamak. Yeni ücretli API şart değil.
- **Zorluk / maliyet:** Düşük sadeleştirme; gerçek sezon filtresi daha büyük ayrı içerik işi.

## F06 — Login modalı klavye/ekran okuyucu için eksik

- **Route / cihaz:** `/safety` footer Sign in; Chromium 390px, klavye.
- **Adımlar:** Sign in aç; aktif odağı ve dialog semantiğini kontrol et; Escape bas.
- **Beklenen:** Dialog role/label, görünür alan etiketleri, modal içine başlangıç odağı, odak yönetimi, Escape ile kapanma ve odağın geri dönmesi.
- **Gerçek:** `role=dialog`/dialog yok; input'lar açık label taşımıyor; AX isimleri boş; odak arka plandaki giriş düğmesinde kalıyor; Escape kapatmıyor. Cancel çalışıyor.
- **Kanıt:** `auth-modal.jpg`; `App.tsx` modal markup ve onClick.
- **Etki:** Klavye/screen-reader kullanıcısı zorlanır. Kimlik bilgisi gönderilmedi; auth bypass test edilmedi.
- **Çözüm:** Küçük odak/semantik patch; input label + autocomplete; backdrop ve Escape davranışı; kimlik doğrulama mantığını değiştirmeden test.
- **Zorluk / maliyet:** Düşük-orta; yeni servis yok.

## F07 — Taxi budget örneklerinde yaş/son geçerlilik kontrolü yok

- **Alan:** `src/lib/taxiBudget.ts`, `App.tsx` fallback kolu, `tariffRepository.ts`.
- **Adımlar (kod):** Verified CMS tarife bulunmayan destekli şehir için `taxiBudgetRange` akışını izle; reviewedAt'in filtrede kullanılıp kullanılmadığını kontrol et.
- **Beklenen:** Gözlemsel örnekler de düzenli yeniden kontrol edilir; belirsizlik kaybolmaz, tarihi geçmiş veri otomatik güncel sayılmaz.
- **Gerçek:** CMS için 30 günlük yeniden doğrulama filtresi var. Budget için reviewedAt yalnız çıktı yazısı, herhangi bir yaş kontrolü/effective_to yok. Bazı kaynaklar resmî tarife değil yerel haber/hesaplayıcı. Mevcut sayıların yanlış olduğu bu audit'te kanıtlanmadı.
- **Kanıt:** `taxiBudgetRange` reviewedAt kullanımı, `eligibleTariffs`; tarih varsayılanı 2026-10-06, Gaziantep 2026-10-13. İstanbul canlı örneğinde CMS kaynağı gerçekten gösterildi.
- **Etki:** Zaman içinde eski örnek sürekli sonuç üretmeye devam edebilir; “fiyat gösteriyor” doğruluk garantisi değildir.
- **Çözüm:** Budget için de sahip olunan review takvimi ve yaş politikası; kaynak değiştiğinde yeniden doğrulama. Güvenilir yerel veri yoksa dürüst mesafe/sağlayıcı kontrolü state'i korunmalı. Trafik veya başka şehir çarpanı eklenmemeli.
- **Zorluk / maliyet:** Kod düşük, veri bakımı sürekli insan emeği; bu turda yeni tarife araştırması/yazılması yapılmadı.

## F08 — İlk yükleme paketi ve marka görseli ağır

- **Alan:** Production build; bütün App başlangıçları.
- **Adımlar:** `npm run build`; logo import ve ana chunk'ı kontrol et.
- **Beklenen:** Düşük mobil veri/ağda hızlı temel navigasyon; küçük logo için uygun asset.
- **Gerçek:** Main JS 633.80 kB (gzip 205.86); logo PNG 541.74 kB. Bazı büyük bölümler lazy olsa da ana App/içerik paketi geniş. Önceki temizliğe göre iyileşmiş olması bu alanın bittiği anlamına gelmiyor.
- **Kanıt:** CHECKS build tablosu; `src/assets/safeinturkiye-logo.png`, `TravelApp.tsx` eager App import.
- **Etki:** Özellikle mobil CPU/ağ maliyeti. Bu ölçümler LCP/INP'nin kötü olduğunun sayısal kanıtı değildir; Core Web Vitals ölçülmedi.
- **Çözüm:** Önce logo optimizasyonu ve route/i18n import analizi; sonra küçük bağımsız lazy split'ler. Görsel kaliteyi bozma veya büyük routing rewrite yapma.
- **Zorluk / maliyet:** Düşük logo, orta chunk çalışması; yeni ücretli servis gerekmez.

## F09 — CSP ve framing politikası yok (hardening boşluğu)

- **Route / cihaz:** Ana sayfa ve sitemap sayfalarının HTTP header'ları; Node read-only.
- **Adımlar:** `http-results.json` headers alanını incele.
- **Beklenen:** Üçüncü taraf harita/analitik kaynaklarıyla uyumlu, test edilmiş CSP; platformun başkalarınca iframe içine alınmasını sınırlayan politika.
- **Gerçek:** HSTS, nosniff ve referrer policy var; Content-Security-Policy ve X-Frame-Options yok; dolayısıyla CSP frame-ancestors da yok.
- **Kanıt:** `http-results.json`; `vercel.json` headers.
- **Etki:** Savunma derinliği eksik. XSS veya clickjacking exploit'i gösterilmedi; “site güvensiz” şeklinde geniş sonuç çıkarılmamalı.
- **Çözüm:** Önce preview'da report-only CSP; Maps/Viator/Supabase kaynaklarını envanterle, sonra kontrollü enforce ve frame-ancestors. Kör `default-src 'self'` haritayı bozabilir.
- **Zorluk / maliyet:** Orta; mevcut altyapıyla uygulanabilir. Yeni ücretli güvenlik servisi zorunlu değil.

## F10 — Görsel doğrulama script'i bağımlılık açısından yeniden üretilebilir değil

- **Alan:** Yerel `scripts/check-photo-assets.mjs`.
- **Adımlar:** Mevcut repo bağımlılıklarıyla `node scripts/check-photo-assets.mjs` çalıştır.
- **Beklenen:** Görsel dosyalarını doğrular veya belgelenmiş bağımlılık kurulumunu ister.
- **Gerçek:** `Cannot find module 'sharp'` ile bitiyor. package.json sharp ilan etmiyor. Browser örneklerinde fotoğrafların görünmesi bu script'in geçtiği anlamına gelmez.
- **Kanıt:** CHECKS; script satır 3; package.json.
- **Etki:** Yeni makine/CI'da asset denetimi atlanabilir; canlı fotoğraf arızası olduğu anlamına gelmez.
- **Çözüm:** Sharp'ı dev dependency olarak açıkça ilan etmek ya da kontrolü bağımlılıksız metadata okuyucuya çevirmek; birini seçip temiz ortam testi yapmak.
- **Zorluk / maliyet:** Düşük; servis ücreti yok. Audit sırasında bağımlılık eklenmedi.

## F11 — Kapalı rezervasyon hizmetiyle FAQ/gizlilik anlatımı uyumsuz

- **Route / cihaz:** `/guides`, `/privacy`, restoran detayı; Chromium ve kod.
- **Adımlar:** FAQ “booking request” sorusunu oku; restoran detayını aç ve rezervasyon hizmetinin kapalı olduğunu karşılaştır.
- **Beklenen:** Güncel sürümde hangi hizmetin açık olduğu tek bir dille anlatılır.
- **Gerçek:** Restaurant detail doğru şekilde hizmetin henüz açık olmadığını söylüyor; FAQ talep/işletme onayı sürecini mevcutmuş gibi anlatabiliyor; gizlilik metni rezervasyon verisinin saklandığını koşulsuz açıklıyor. Login hesabı açma/kurtarma ve genel ziyaretçi değeri de net değil.
- **Kanıt:** `restaurant-detail.jpg`; `TravelFaq.tsx` questions[8]; `siteInformation.ts`; `reservationAvailability.ts` false.
- **Etki:** Kullanıcı gerçekleşmeyecek bir talep işleyişi bekleyebilir. Gerçek rezervasyon oluşturulmadı.
- **Çözüm:** Ortak feature availability'ye göre FAQ/legal metni koşullandır; gerçekte mevcut hesap ve geçmiş veri kullanımını doğru ifade et. Talep hizmeti açılacaksa önce işletmeci/operasyon kararı.
- **Zorluk / maliyet:** Düşük-orta; yeni API yok.

## F12 — Geçersiz döviz tutarı açıklanmıyor

- **Route / cihaz:** `/exchange`, Chromium 390px.
- **Adımlar:** Amount alanına -1 yaz.
- **Beklenen:** Negatif tutarın desteklenmediğini kısa ve erişilebilir biçimde belirtir.
- **Gerçek:** Hesaplama güvenli biçimde null dönüyor ve sonuç kayboluyor; doğrulama metni yok. Yanlış pozitif tutar gösterilmiyor.
- **Kanıt:** `currency-invalid.jpg`; `CurrencyRates.tsx`, `convertReferenceAmount`.
- **Etki:** Hafif kafa karışıklığı; finansal hesap hatası kanıtı değil.
- **Çözüm:** Alan altı inline validation; boş/negatif/çok büyük giriş testleri; native min kuralı tek başına yeterli değil çünkü form submit yok.
- **Zorluk / maliyet:** Düşük, ücretsiz kod değişikliği.

## F13 — Güvenlik sayfasında tekrar

- **Route / cihaz:** `/safety`; Chromium mobil.
- **Adımlar:** Ana Emergency/Taxi/Useful places bölümünden sayfanın sonuna ilerle.
- **Beklenen:** Her ek blok yeni değer sağlar.
- **Gerçek:** Safety guide başlığı, taksimetre/fiş ve faydalı yerler tavsiyeleri altta tekrarlanıyor; ayrıca Antalya görseli var.
- **Kanıt:** CHECKS safety AX özeti; `App.tsx` safety render ve `SafetyTips.tsx`.
- **Etki:** Gereksiz kaydırma; siteyi daha uzun ve dağınık gösteriyor.
- **Çözüm:** Tekrarı tek küçük rehber/CTA içinde birleştir; 112 erişimini koru.
- **Zorluk / maliyet:** Düşük, yeni servis yok.

## F14 — Süresi dolan fotoğraf token'ı sonrası sessiz görsel kaybı

- **Route / cihaz:** Uzun açık kalan canlı `/restaurants?city=antalya`, TR; Chromium. Shared fotoğraf sistemi diğer discovery sayfalarında da kullanılıyor.
- **Adımlar:** Sonuçları yükle; sayfayı 15 dakikadan uzun açık bırak; ilk 6 karttan sonra “Daha fazla göster” tıkla ve aşağı kaydır. Audit'te 18:06'da alınmış mevcut sekme kullanıldı; yapay saat değişikliği yapılmadı.
- **Beklenen:** Kartlar güncel, izinli fotoğraf referansı alabilmeli veya kullanıcıya açık bir yenileme seçeneği sunmalı.
- **Gerçek:** İlk altı önceden yüklenen fotoğraf var; daha sonra eklenen 9 kartın img alanı hata sonrası tamamen kaldırıldı. Taze oturumda aynı McDonald's Işıklar, Köfteci Yusuf ve Varsak Pide kartlarının 640px fotoğrafları yüklendi.
- **Kanıt:** `photos-expired-session.jpg`; CHECKS eski/taze oturum DOM karşılaştırması; `api/places.ts` 15dk imza; `api/place-photo.ts` token doğrulaması; `GooglePlacePhoto.tsx` onError -> null.
- **Kök neden:** Liste fetch anında verilen kısa ömürlü URL lazy görüntü yüklenene kadar eskimiş; istemci yeniden referans istemiyor, hata görünür yenileme olmadan gizleniyor.
- **Etki:** Sayfa zamanla fotoğrafsız görünür; özellikle uzun gezi planlamasında profesyonellik ve güven azalır. Başka işletme fotoğrafıyla doldurmak veya Google verisini kalıcı kopyalamak çözüm değildir.
- **Çözüm:** İzinli taze referans alma/sonuç yenileme akışı, kontrollü tek retry, expired/generic failure ayrımı, yeni on-demand çağrıların maliyet sınırı. Token güvenliğini gevşetme ve TTL'yi körlemesine uzatma.
- **Zorluk / maliyet:** Orta. Yeni API zorunlu değil; yenilemeler mevcut Google çağrı maliyetini etkileyebilir, yalnız gerektiğinde çalışmalı.

## Ayrı riskler / erişim sınırları — kesin canlı hata sayılmadı

| ID | Kanıtlanan sınır | Kanıtlanmayan taraf / önerilen doğrulama |
|---|---|---|
| R01 | Places/photo/Transit/Viator bütçeleri process-local Map; Google field mask Enterprise alanları istiyor | Güncel Vercel WAF ve Cloud quota kuralları bu tur okunmadı. Dağıtık koruma yok diye kesin hüküm yok; hesapta kontrol et. |
| R02 | CMS detayları runtime, prerender/sitemap build-time snapshot | Gelecekte publish/unpublish ile rebuild eşleşmesi riskli; gerçek admin yazısı yapılmadı, prod schema sorgulanmadı. Staging lifecycle testi gerekli. |
| R03 | Fotoğraf eskime şüphesi gerçek eski/taze sekme karşılaştırmasıyla doğrulandı | Artık belirsiz risk değil: **F14'e yükseltildi**, bu tablo sayımına dahil değil. |
| R04 | Analytics URL filtresi yalnız homepage; business events best effort ve Foundation flag'e bağlı | Tüm araç kullanıcıları/tekil fiziksel işletme ziyaretleri ölçülüyor denemez. Canlı event storage/rapor ekranı hesabıyla doğrulanmadı. |
| R05 | Gerçek iOS/Android, WebKit/Firefox, başarılı GPS, offline/network throttle yok | Desteklenen cihaz matrisi ve saha testi tamamlanmadan “her cihaz sorunsuz” denemez. |
| R06 | Browser DOM ölçümleri var; Lighthouse/performance API yok | LCP/INP/CLS puanı, PageSpeed skoru ve gerçek kullanıcı performansı bilinmiyor. |
| R07 | Metro İstanbul schedule bağlantısı Node TypeError verdi | Bu ağ/TLS/robot kısıtı olabilir; link bozuk ilan edilmedi. Tarayıcıyla operatör sayfası ayrıca doğrulanmalı. |
| R08 | Geocoding Photon, taxi OSRM, reverse Nominatim public servislerine bağımlı | Bu tur SLA/production kota uygunluğu sertifikalandırılmadı; izinli sürdürülebilir kullanım/erişim seçenekleri sağlayıcılarla kontrol edilmeli. |

## Kanıtların kapsamı

Ekran görüntüleri JPEG byte içeriğiyle `.jpg` olarak saklandı. Kamuya açık işletme adları ve adresleri içerir; API key, auth token, kart bilgisi veya gerçek kullanıcı GPS'i rapora alınmadı. Harita ekranlarında tarayıcıya açık kısıtlı anahtarın değerini raporlamadık. RLS/ownership testleri izole PGlite üzerinde; remote Supabase'e INSERT/UPDATE/DELETE/migration yok.
