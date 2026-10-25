# Execution evidence — 2026-10-25

Baseline: `924674cd0ea6e476af5e752009aa9410843e1001`. Application code unchanged during audit.

## Commands actually run

| Command | Result |
|---|---|
| `npm test -- --maxWorkers=2` | 61 files, 384 tests passed; 19.18s |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed; 12 city/detail documents, sitemap generated |
| `node scripts/check-favicon-build.mjs` | Passed: head references, PNG sizes, ICO frames, manifest |
| `node scripts/check-seo-build.mjs` | Passed: final HTML, JSON-LD and SEO assets |
| `node scripts/check-photo-assets.mjs` | FAILED before image validation: undeclared `sharp` module unavailable |
| `npm audit --omit=dev --json` | Exit 1: Vite 8.2.2 high-severity advisory group; npm includes it via dependency graph despite omit flag. Not proof of a production browser vulnerability. |
| `node audit-evidence/http-audit.mjs` | Complete; raw sanitized results in `http-results.json` |

Build: main JS 633.80 kB / gzip 205.86 kB; CSS 50.11 / gzip 10.42 kB; logo 541.74 kB; TransitPlanner 66.35 / gzip 26.51 kB. Existing >500 kB warning remains. These are local build sizes, not measured network transfers or Core Web Vitals.

## Passive production HTTP

- 27/27 sitemap URLs: HTTP 200, matching self-canonical, one prerender H1 each.
- `/does-not-exist-audit` and `/hotels/not-a-real-hotel`: HTTP 404, noindex.
- `/hotels/efe-kusadasi` and its former `/tr` path: HTTP 308 to `/hotels?city=aydin`.
- Apex host: HTTP 308 to www.
- robots, favicon.ico, favicon-96x96.png, site.webmanifest: HTTP 200. Icon MIME types recorded in JSON.
- `/api/places` malformed latitude and `/api/viator` unknown city: HTTP 400 with allowlisted error codes, no stack traces.
- `/api/reference-rates`: HTTP 200, publication 2026-10-23, 7 quote currencies.
- HSTS/nosniff/referrer-policy present; CSP and X-Frame-Options absent in sampled responses.
- No load tests, exploit attempts, authentication submissions or mutable database requests.

## Real in-app Chromium flows

- Home: empty search is a harmless no-op; menu opens/closes; city/tool/guide links work. Winter shortcut opens general Activities instead of a winter filter.
- Home widths: 320/375/390/430/768/1024/1440. Root clientWidth equals scrollWidth respectively 305/360/375/415/753/1009/1425. No root horizontal overflow. Screenshots saved. Three very small secondary buttons detected; no full WCAG certification.
- 12 city routes opened at 390px: İstanbul, Ankara, Antalya, İzmir, Cappadocia, Gaziantep, Muğla, Aydın, Denizli, Trabzon, Konya, Bursa. Correct city H1s, root 375px without overflow. No completed broken image was observed; this does not assert every lazy offscreen image had downloaded. Bursa forecast and Chinese summary rendered.
- Gaziantep city -> Hotels: URL transfers `city=gaziantep`; Google hotels included Shimall, Tower Residences, ibis.
- Taxi: empty calculation yields a selection instruction. Taksim -> Sultanahmet suggestions selectable; OSRM returned 5.6 km / ~9 min; displayed approximate TRY 340, official İstanbul source/date exposed in Calculation details. Google embed rendered; its independently selected route is disclosed. No invented traffic surcharge observed.
- Transit: free-text Taksim, İstanbul -> Sultanahmet, İstanbul returned 4 Google alternatives (29/36/37/37 min), 5.5 km, TRY 92.40 reported provider fare, bus 70FE + T1, map/polyline rendered. Ankara Kızılay -> Anıtkabir returned 4 alternatives (35/35/36/36 min). These are observation-time responses, not guaranteed future schedules.
- Transit widths 320/390/768: no root overflow. All eight language switches render localized H1; origin/destination values retained. Switching language intentionally clears route results.
- Aydın Near Me manual city search: genuine Google names including Güldeste, Kipa, Zincirlihan, Atatürk hospital, Efeler Hotel, Aydın Park. Six initially visible; provider set larger. Location request could not obtain position and showed friendly recovery text; no successful real GPS or actual permission-denied prompt was witnessed.
- Near Me UI sampled in all 8 languages: DE/FR/AR/RU/ZH have English categories/disclosure. Arabic root RTL rendered without sampled root overflow.
- Manual Beşiktaş, İstanbul selected while city query remained Aydın: real Beşiktaş businesses returned. Reload clears address/selection and restores Aydın + idle state. Before/after evidence saved. This is distinct from city-level navigation, which persists.
- Antalya Restaurants: 15 Google results, 6 initially visible; 7 Mehmet detail contains address, phone, hours, official website/directions and clearly unavailable reservation service. Browser back + reload preserves Antalya city/list route. No legacy detail URLs observed.
- Exchange: 100 EUR -> TRY 5,565.42 based on dated reference, not bureau quotes. -1 hides output without a validation message. Aydın search returned Aydemir Döviz & Altın and Menderes Doviz.
- Chinese Tours: 12 real products loaded; external URLs have Viator host and `pid`, `mcid`, `medium`, `api_version` parameters. No purchase or commission settlement tested. Chinese UI correctly states English provider content fallback.
- Safety: emergency 112, taxi advice, Near Me shortcut, 6 safety tips, 4 practical disclosures and official-source link render; duplicated bottom safety summary remains.
- Guides: 20 disclosure items, category controls/search visible. Booking-related guidance remains despite reservation service being paused.
- Anonymous `/#admin`: no CMS content; sign-in gate shown. Login modal has no dialog role or explicit input labels, focus remains on background trigger, Escape does not close it. No credential entered.
- Contact: owner identity/support contact explicitly awaiting confirmation; no usable support channel.
- Preview: existing Antalya restaurant tab reloaded; same discovery architecture. This is a spot parity check, not full preview acceptance of all flows.
- Long-session photo comparison: production tab whose results were fetched at 18:06 remained open over 15 minutes. Show more expanded from 6 to 15 cards: first six had images, all nine newly shown cards lost their image elements. A fresher production session showed loaded 640px images for the same McDonald's Işıklar, Köfteci Yusuf and Varsak Pide. Source confirms 15-minute signed URLs + error hiding, without reference refresh. Evidence: `photos-expired-session.jpg` (F14).

## External CTA HTTP sample

200: BiTaksi `/home`, İETT route 34G, İzmir Metro sefer-plani, TCDD e-bilet, EGO kart-basvurusu, Antalyakart KartCesitleri. Metro İstanbul SeferDetaylari: Node transport TypeError; **unverified**, not labelled broken. 200 alone does not prove a meaningful schedule response. No hotel/restaurant telephone was called.

## Explicit limitations

Physical iOS/Android, WebKit, Firefox, virtual keyboard, OS rotation and real successful GPS were unavailable. Browser offline/throttle/interception unavailable in current control surface. Timeout/quota/zero/error cases covered by existing automated fixtures, not claimed as all real-provider browser tests. No authenticated admin write lifecycle or production RLS introspection. No billing dashboards/remaining credit checks, no verified current WAF/quota configuration, no Search Console index evidence. Lighthouse package absent; browser evaluation does not expose Performance API here. LCP/INP/CLS are **not measured**; HTTP times in JSON are warm command observations only.
