# SafeInTürkiye — Öncelikli iyileştirme planı

25.10.2026 · Baseline `924674c` · **Öneri; uygulama onayı değildir.**

Amaç: Yeni API eklemeden mevcut turist deneyimini daha doğru, anlaşılır ve sürdürülebilir yapmak. Mevcut tasarım korunmalı. Production deployment/migration, provider hesap/harcama değişikliği ayrı onay gerektirir. Audit bulguları [ayrıntılı kayıt](SAFEINTURKIYE-AUDIT-FINDINGS.md) içinde.

Maliyet sınıfları: **K0** = mevcut teknolojiyle kod/insan emeği, yeni zorunlu abonelik yok; **K1** = mevcut provider'da artabilecek sınırlı çağrı/test maliyeti, hesap kotaları kontrol edilmeli; **K2** = sahip/uzman/operasyon kararı, fiyat teklifine bağlı. Bunlar “çalışma bedava” anlamına gelmez.

## A — Mutlaka düzeltilmesi gerekenler

| Öncelik | İş / neden | Kullanıcı etkisi | Zorluk / emek | Maliyet |
|---|---|---|---|---|
| 1 | F02 Vite güvenlik patch'i | Yerel geliştirme ortamı riskini azaltır | Düşük; yarım gün, regression dahil | K0 |
| 2 | F01 gerçek işletmeci/destek/gizlilik bilgisi | Yardım ve sorumluluk bulunabilir | Düşük kod; sahip kararı bağımlı | K0/K2 |
| 3 | F14 expired fotoğraf referanslarının kontrollü yenilenmesi | Uzun oturumda fotoğraflar kaybolmaz | Orta; 0.5–1.5 gün | K0/K1 |
| 4 | F03 UI çeviri açıklarının kapanması | İzin ve hata durumları anlaşılır | Orta; 0.5–1.5 gün + dil review | K0 |
| 5 | F04 manuel bölge restorasyonu | Reload/back sonrasında tekrar arama azalır | Orta; 0.5–1 gün | K0/K1 test |
| 6 | F05 sezon kısayollarının gerçek işlevle uyumu | Yanlış beklenti kalkar | Düşük sadeleştirme; 0.25 gün | K0 |
| 7 | F06 login modalı semantics/focus/Escape | Klavye ve yardımcı teknoloji kullanılabilir | Düşük-orta; 0.5 gün | K0 |
| 8 | F10 asset kontrolünün yeniden üretilebilir olması | Eksik/bozuk asset regression'ı yakalanır | Düşük; 0.25 gün | K0 |
| 9 | F11 rezervasyon availability ile metinlerin eşleştirilmesi | Açık olmayan hizmet vaat edilmez | Düşük; 0.25–0.5 gün | K0, sahip içerik onayı |
| 10 | F07 tarife bakım/eskime politikası | Eski sayılara sınırsız güven azalır | Kod düşük; kaynak review sürekli | K0/K2 insan emeği |

Süreler planlama aralıklarıdır; bağımsız işler kısmen çakışabilir. Hız uğruna test kesilmemeli; değişmeyen tam suite aynı turda tekrar tekrar çalıştırılmamalı.

## İlk 7 gün — Stabilizasyon paketi

### Paket 1: Toolchain + metin doğruluğu

- Aynı Vite minör serisinde güvenlik patch'i seç; unrelated dependency update yapma.
- Sharp'ı açık dev dependency yap veya dependency-free validator seç. İki yaklaşımı birden ekleme.
- Ortak discovery UI çevirilerini EN/TR/DE/FR/AR/RU/ZH/ES matrisiyle tamamla. Sağlayıcının ürün dili ayrı kalsın.
- Yaz/Kış yanlış kısayollarını gerçek mevsim verisi yoksa kaldır/yeniden adlandır. Yeni mevsim sonucu uydurma.
- Kapalı rezervasyon için ortak availability metni kullan; FAQ ve privacy'de geçmiş/gelecek hizmeti mevcut hizmet gibi anlatma.

**Kabul:** Temiz kurulumda validator çalışır; npm advisory giderildiği teyit edilir; sekiz dilde ortak izin/hata/filter metni İngilizceye düşmez; kalan provider fallback açıkça etiketli; test/build/typecheck/lint geçer.

### Paket 2: Kullanıcı durumu + fotoğraflar + erişilebilirlik

- Manuel kamusal bölge seçimini uygun session state ile restore et. Hassas GPS/adresi analytics veya herkese açık URL'ye otomatik yazma.
- Photo token eskimesinde tek kontrollü taze referans akışı, anlaşılır retry ve request dedupe. İmza korumasını zayıflatma; Google fotoğrafını Supabase'e kalıcı indirme.
- Modal için dialog semantiği, label, autofocus/focus trap/restore, Escape; auth hata mesajlarını sanitize/localize et.

**Kabul:** Beşiktaş seç -> detail -> back -> reload aynı bölgeyi anlamlı biçimde korur. 15dk+ açık sayfada Show more fotoğrafları yükler veya açık refresh sağlar. Fotoğraf bulunmayan yer sahte fotoğrafla doldurulmaz. Klavye kullanıcısı modalı bağımsız açıp kapatabilir.

### Sahipten bağımlılıklar

- Gerçek destek e-postası, yayımlanacak işletmeci adı, sorumlu kişi/ekip ve gerçek hizmet beklentisi.
- Bu bilgiler yoksa rezervasyon talepleri **kapalı kalır**. Otomatik restoran arama/yanıt sözü yazılmaz.
- Sonraki release için staging/preview test ve production onayı; remote DB migration bu paketin otomatik parçası değil.

## B — İlk 30 gün: UX, SEO ve düşük maliyetli performans

| İş | Gerekçe / kullanıcı etkisi | Zorluk | Maliyet |
|---|---|---|---|
| F08 logo optimizasyonu + ölçülü chunk analizi | Mobil başlangıç yükünü azalt | Düşük/orta | K0 |
| F09 report-only CSP -> preview uyumluluk -> enforce | Haritaları bozmadan savunma derinliği | Orta | K0 |
| F12 tutar validation mesajları | Boş sonucun sebebini açıkla | Düşük | K0 |
| F13 Safety tekrarlarını kaldır | Kaydırmayı azalt, 112 erişimini koru | Düşük | K0 |
| Core Web Vitals/Lighthouse ölçümü | Varsayım yerine gerçek performans baseline | Düşük/orta | K0 araçlar; gerçek cihaz erişimi gerekebilir |
| Physical iOS/Android smoke | Safari back, keyboard, rotation, safe-area doğrula | Orta | Mevcut cihazlarla K0 |
| Staging CMS publish/archive lifecycle | Runtime, detail, sitemap/build uyumunu kanıtla | Orta | K0/K1 test ortamı; remote yazı onayı şart |
| CI regression gate | Build-only deploy'un kaçıracağı hataları engelle | Düşük/orta | Mevcut repo/CI hakları kontrol; yeni paid ürün şart değil |
| Provider quota/WAF read-only kontrolü | Instance-local limitin dış korumasını doğrula | Düşük | Kontrol K0; ücretli kural onaysız açılmaz |

**Kabul:** Ölçülmüş before/after asset ve loading sonucu; tek fresh suite; browser atıf/Maps/Viator/Taxi regression. CSP hiçbir temel provider'ı bozmaz. 12 şehir/8 dil için otomatik render matrisi; gerçek cihazlarda en kritik 5 akış.

SEO: Var olan canonical/404/redirect yapısını koru; yeni locale route veya SEO rewrite başlatma. Google Search Console sahibi indeks ve favicon durumunu ayrıca kontrol edebilir; yeniden tarama anında güncelleme garantisi verilmez. İleride ayrı locale içerik planlanırsa gerçek çevrilmiş içerik ve self-canonical temeliyle ele alınır.

## C — Sonraki 90 gün: Mantıklı eklemeler ve büyüme

Önce A/B'nin kapanması ve gerçek kullanımdan ölçüm. Bu maddeler bug düzeltmesi değil; ayrı karar gerektiren önerilerdir.

| Öneri | Gerçek turist ihtiyacı / etki | Zorluk | Maliyet ve sınır |
|---|---|---|---|
| Son kullanılan kamusal şehir/araç bağlamı | Her kullanımda aynı seçimleri tekrarlamamak | Düşük-orta | K0; sensitive konum saklama yok |
| Kısa yerel “ilk gün” kontrol listesi | Havalimanından otele, kart/para/acil bilgiye hızlı dönüş | Düşük | K0 içerik emeği; kaynak/tarih gerekli |
| Mevcut araçlardan sade paylaşılabilir yolculuk özeti | Aile/arkadaşla rota ve hazırlık bilgisini paylaşmak | Orta | K0; kişisel adres/konum ifşası için açık seçim |
| Ölçümlü küçük tanıtım denemesi | Hangi araç tekrar kullanılıyor öğrenmek | Düşük-orta | Önce mevcut privacy-safe ölçüm; reklam bütçesi sahibi belirler |
| İşletme partnerleri için açık sponsor etiketi ve click raporu | Gelir modelini somutlaştırmak | Orta | Foundation staging/RLS doğrulanmalı; “tıklandı” fiziksel ziyaret veya satış değildir |

Analytics'in bugün yalnız home pageview kabul etmesi ve business events'in flag/server konfigürasyonuna bağlı olması nedeniyle bütün ziyaretçi funnel'ı ölçülüyor varsayılmamalı. Önce doğru ölçüm tanımı; sonra 2–3 işletmeyle küçük, manuel pilot. Google Place fotoğraf/verisi partnerden alınmış kendi kalıcı katalog verisi sayılmaz.

Reklam önerisi: “Türkiye'de herkes için her şey” vaadi yerine İstanbul/Aydın/Antalya gibi mevcut çalışan araçların belirli ihtiyacını anlatan küçük içerikler; ulaşım kartı/airport/taxi bütçe örnekleri; gerçek destek ve kaynak bilgisi. Büyük kampanya veya paid servis onayı verilmiş sayılmaz. Conversion/satış garantisi yok.

Safe AI, hotel fiyat/müsaitlik API'si, yeni rezervasyon operasyonu ve mağaza uygulaması bu stabilizasyon planının zorunlu kapanış maddeleri değil. İleride gerçek ihtiyaç, partner kabulü, lisans ve bütçeyle ayrı karar verilir.

## D — Kaldırma ve sadeleştirme

1. Genel sonuç açan sezon kısayolları: ayrı filtre varmış izlenimini kaldır (F05).
2. Safety duplicate özetleri: tek anlatım + önemli CTA (F13).
3. Kullanılmayan rezervasyon sürecinin güncel olmayan kopyası: availability ile eşleştir (F11).
4. Public ziyaretçiye CMS teknik açıklamaları: staff kapısını koruyarak daha amaca uygun sun (F03/F06).
5. Tekrarlanan uzun yardımcı yazılar: disclosure ile sadeleştir; konum paylaşımı/affiliate/provider kaynakları ve önemli uyarıları yok etme.

Her biri düşük kod maliyeti; tasarım dilini değiştirmeden kullanıcıyı yormayan bir ekran hedefler. Asıl işe yarayan source bilgilerini “kalabalık” diye tamamen kaldırma.

## Release kabul standardı

- İlgili değişiklikte targeted test; paket sonunda bir full suite + build/typecheck/lint.
- Onaylı preview'da gerçek Google/Viator sonuçları, manual/back/reload, farklı dil, mobil/desktop.
- Provider failure/zero/timeout fixtures; gerçek cihazda en az Safari/Android ana akış.
- Secrets/Google caching/atıf kuralları regression; remote DB yazısı gerekiyorsa ayrı açık onay.
- Açık P1 varsa gerekçeli karar olmadan “her şey tamam” raporu yok. P2 backlog'ları sahibi görür.
- Production deployment yalnız sahibin düzeltme/release onayı sonrası. Bu audit turn'ünde deployment yapılmadı.

**Sonraki önerilen adım:** İlk 7 gün stabilizasyon paketini onaylat; yeni API sprintine başlamadan F03/F04/F06/F14 kullanıcı deneyimini toparla. Onay gelene kadar uygulama değişikliğine başlanmaz.
