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

## İlk kez kullanan yolcularla saha testi

Siteyi daha önce kullanmamış 5–8 gönüllüden, tercih ettikleri dilde ve kendi telefonlarında aşağıdaki işleri yapmalarını isteyin. Başlangıç adresi ana sayfadır. Görevi okuyun ve kullanıcının ilk dokunuşunu bekleyin. Deneme için herkes aynı örnek geziyi kullanabilir.

| Görev | Tamamlandığını nasıl görürüz? |
| --- | --- |
| İstanbul’a Sabiha Gökçen’den iki kişi geliyorsunuz. Sultanahmet’teki bir otele nasıl gideceğinize karar verin. | Yolcu iki ulaşım seçeneğini yorumlar, hangi tutarın araç başı olduğunu söyler ve otel adresini şoföre gösterebilir. |
| Konum iznini reddedin. Sultanahmet civarında bir eczane bulun. | Yolcu bir adres veya şehir seçip gerçek bir sonuca ulaşır ve yol tarifini açar. |
| Antalya’daki ilk gününüze bir restoran ekleyin. Sonra sayfayı kapatıp tekrar açın. | Yolcu kayıtlı sırayı bulur, bir durağın yerini değiştirir ve sıradaki durak için yol tarifi açar. |

Her görev için yalnızca telefon/tarayıcı türü, arayüz dili, ilk dokunuş, geçen süre, yardım gerekip gerekmediği ve takıldığı adım kaydedilir. İsim, konum, kişisel otel adresi veya rezervasyon bilgisi istenmez. Fiziksel iPhone’da Safari’nin geri hareketini ve bir kez de zayıf bağlantıyla toparlanmayı deneyin. Yardımsız bitirme sayısını toplam denemeyle, süreyi ortancayla raporlayın. Gerçek kullanıcı oturumları yapılana kadar bu tablo bir test planıdır.
