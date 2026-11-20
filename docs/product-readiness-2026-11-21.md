# Ürün kabulü ve işletme takibi — 21 Kasım 2026

## Kısa kabul senaryoları

- Ana sayfada “Is Istanbul safe for tourists?” yazınca İstanbul bağlamıyla güvenlik rehberi açılır. Şehir kartı üzerinden Bursa → Koza Han aramasında hedef yerin adı ve şehir sağlayıcıya birlikte gider.
- Telefonda tur aramasının ilk ekranında şehir, metin ve arama düğmesi bulunur. Fiyat veya tarih düzenlemek yeni istek göndermez. Kullanıcı uyguladığında sonuç değişir.
- Antalya Havalimanı veya Kuşadası’ndan başlayan taksi yolculuğunda başlangıcın idari bölgesi kullanılır. Kanıt ve bölgesel farklar [taksi kapsam tablosunda](taxi-coverage-2026-11-21.md). İstanbul’da aynı yolculuğu toplu taşımada karşılaştırmak iki adresi bellekte aktarır.
- Ulaşım önerisine dokunduktan hemen sonra arayın. Çözülen adresler kullanılmalı. Boş sonuçta Hat ve Duraklar açılabilmeli.
- Mobil Yakınımda ekranında liste ve harita aynı yeri seçer. Restorandaki formun klavye sırası ekrandaki alan sırasını izler.
- Yetkili panelde eski bir talep için tam referans ile arama bütün kayıtlarda çalışır. Bu senaryo sentetik kayıtlarla sınanır. Güvenlik kartı telefona indirildikten sonra çevrimdışı okunabilir.

## İşletmeci için

- Haftalık olarak Yönetim → Sistem ve yayın → Taksi tahminleri bölümünde yaklaşan ve geçen tarihlere bakın. Belediye/oda kararı, yerel kapsam, araç sınıfı ve yayımlanan tutarlar kontrol edildikten sonra kaynak kaydını güncelleyin. 30 günlük süre tek başına yeni bir tarife tespit etmez.
- Taksi ve tur ölçümü için yapı bayrağı `VITE_PRODUCT_METRICS_ENABLED=true` yalnız maliyet, gizlilik metni ve kullanım amacı onaylanırsa kullanılmalıdır. Varsayılanı kapalıdır. Açıldığında ziyaretçi gizlilik sayfasından izin verir ve oradan geri çekebilir. GPC/DNT tercihi önceliklidir.
- Taksi için `taxi_search`, `taxi_estimate`, `taxi_no_fare`, `taxi_error`; turlar için `tours_search`, `tours_results`, `tours_empty`, `tours_error`, `viator_open` sayılır. Yalnız izinli dil kodu eklenir. Sonuca erişme oranlarının paydası izinli aramalardır. Viator’a geçiş bir satış değildir; gerçekleşmiş komisyon Viator partner panelinden kontrol edilir.
- Gerçek saha kabulünde en az bir fiziksel iPhone’da geri hareketini, gerçek konum iznini ve zayıf bağlantıyı deneyin. Gerçek turistlerle görev tamamlama süresi ve ilk dokunuş gözlemleri teknik testlerden ayrı tutulur.
