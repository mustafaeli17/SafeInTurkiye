# Taxi estimate coverage · 21 November 2026

The calculator uses the selected departure address. Eligible, current CMS tariffs are preferred. The table below records independently reviewed standard metered taxi examples for the distance-based planning fallback. Its source links are also available in each estimate. Prices are in TRY. Waiting time, road tolls and extra charges are excluded. These samples do not establish a province-wide official tariff or cover negotiated/fixed-price transfers.

| Province / destination | Opening | Per km | Minimum | Evidence checked |
|---|---:|---:|---:|---|
| İstanbul | 71.94 | 47.92 | 230 | [Taxi chamber, yellow taxi](https://iteo.org.tr/haber/yeni-taksimetre-tarifesi-yururluge-girdi) |
| Ankara | 65 | 40 | 200 | [Meter table](https://www.ankarataksimetre.com.tr/tarife/) and [November local report](https://www.yeniankara.com.tr/ankara/ankara-taksi-ucretleri-2026-ise-her-gun-taksiyle-gitmek-ayda-kac-tl-tutuyor-189828) |
| Antalya, five central districts including Aksu | 40 | 50 | 200 | [Chamber president's publication of the council's table](https://www.antalyakorfez.com/antalyada-taksimetre-tartismasi-mehmet-ali-alkandan-aciklama). Fourteen outer districts use 60 / 70 / 250. |
| İzmir metropolitan area and Bayındır | 40 | 54 | 210 | [Municipal tariff directory](https://tuhim.izmir.bel.tr/tr/Tasitlar/1), council decision 524, pages 1–8. Çeşme and Selçuk use 64 / 68 / 310, Karaburun 64 / 68 / 280, Tire, Ödemiş, Kiraz and Beydağ 64 / 68 / 210, Bergama, Kınık and Dikili 55.20 / 62 / 280. Alaçatı is in Çeşme. |
| Muğla including Bodrum | 180 | 60 | 300 | [November council decision as reported after 16 November entry into force](https://www.muglapostasi.com.tr/muglada-ulasima-yuzde-20-zam) |
| Aydın, central | 49 | 56 | 210 | [Local sample table](https://www.hemenhesap.com/hesap/taksi/aydin) and [September council minimums](https://www.aydinpost.com/aydinda-taksi-ve-servis-ucretlerine-zam-geldi). Kuşadası / Didim use 56 / 63 / 240, also [confirmed by a Kuşadası operator](https://sahilsiteleritaksi.com/). |
| Denizli including Pamukkale | 70 | 56 | 210 | [November implementation report](https://www.denizligunes.com/toplu-ulasimda-zamli-yolculuk) |
| Trabzon | 90 | 73 for km 1–5, then 62 | 260 | [Published 19 October council tariff](https://www.haber61.net/trabzon/trabzon-da-taksi-ucretleri-zamlandi-iste-yeni-tarife/646317) |
| Konya | 55 | 50 | 200 | [Local taxi operator's real table](https://fatihtaksiduragi.com/konya-taksi-ucretleri/) |
| Bursa urban meter | 65 | 55 | 190 | [Decision 1023 and 11 October implementation, including a separate seasonal Uludağ fixed fare](https://www.bursabasin.com/bursada-taksi-ucretleri-pazar-gunu-zamlaniyor) |
| Nevşehir / Cappadocia | 52 | 65 | 200 | [Ürgüp's local tariff report](https://www.urguphaber.com.tr/2026/04/10/taksi-ucretlerine-zam-yapildi/). Kayseri airport has a separate jurisdiction. |
| Kayseri airport gateway to Cappadocia | 75 | 65 | 225 | [Municipal council report 215 and its approved meter table, pages 26–27](https://kayseri.bel.tr/uploads/karar-ozet/report-22-05-2026-14-52.PDF). Used only for departures whose province is Kayseri. |
| Gaziantep | 50 | 50 | 200 | [Chamber tariff publication reported locally](https://www.gazianteppusula.com/haber/27489973/gaziantepte-taksiye-zam), [October chamber response](https://www.gazianteppostasi.com/news/gaziantep-te-taksi-ucretlerine-zam-gelecek-mi-soforler-odasi-ndan-aciklama-yapildi) |

Review each local source before the start of **21 December 2026 (Türkiye time)**, or earlier when a tariff changes. The existing push/PR quality workflow now runs `node scripts/check-taxi-coverage.mjs`. This read-only check warns within seven days of the deadline and when an example expires. Use `node scripts/check-taxi-coverage.mjs --strict` for a dedicated check that fails on stale examples. Dates only advance after a human verifies the figures and jurisdiction. When the origin district is unavailable the planner can give a range across that province's published samples. A selected district plus a single route yields one approximate budget, rounded to the nearest ten lira and never below the minimum.
