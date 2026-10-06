# Three-phase readiness — 2026-10-06

## Status

Phase 1 INCOMPLETE. Phase 2 and Phase 3 NOT STARTED. No deployment, remote migration, paid service activation or credential changes.

Branch: `codex/three-phase-readiness`. Existing favicon-only work preserved independently in `0ef819d`. Working production baseline `82ceccb` remains available. Unrelated untracked work was not staged.

## Architecture / baseline

- React 19, TypeScript 6, Vite 8, Tailwind 4. SPA with manual history routing and lazy detail components; Vercel API functions, Supabase auth/database/storage.
- Catalog currently uses the photo-curated JSON publication list, not Supabase as its exclusive content authority. Taxi tariffs come from Supabase with source/status/date checks.
- Photon address search, Nominatim reverse address, OSRM driving alternatives; Overpass with Photon fallback for nearby places. Development makes direct requests; production has `/api/nearby`.
- Currency: TCMB reference rates through Frankfurter v2, not bureau buy/sell offers. Weather: Open-Meteo. Existing Google Routes server handler; FAQ interface and a separate Gemini handler. Neither should be described as newly integrated.
- Env names found: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ENABLE_MOCK_DATA, VITE_GOOGLE_MAPS_BROWSER_KEY, GOOGLE_ROUTES_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY. Values were not exported or changed.
- Seven languages: en/tr/de/fr/ar/ru/zh. Inline UI dictionaries plus editorial JSON and Chinese overlays. No translation API at page load.
- Existing build generates 65 directory/city HTML files with metadata; essential page content still depends on client rendering. SEO changes deferred.
- Baseline lint/typecheck/build PASS; 81 tests PASS (24 files). PGlite seed validation uses the existing local installation. Initial JS 690.07 kB / gzip 212.17 kB; existing large-chunk warning.

### Real-browser baseline, localhost:5191

- Homepage, Aydın search/city route, home navigation: loaded.
- Istanbul Taksim → Sultanahmet: 5.6 km, about 9 min, roughly TRY 338–378. Actual route provider response; not a fixed regression fixture.
- Near Me: Istanbul centre succeeded on this attempt with Photon/OSM fallback. First-attempt failure not reproduced; no claim that the intermittent production issue is fixed.
- Currency: reference rates loaded with date 2026-10-05 and explicit non-bureau-rate label.
- Hotels (16), restaurants (7), activities (36): listing loaded; representative Swissôtel, Kanaat and Göreme detail pages loaded with photos and official links.
- German Aydın local tip remained English: reproduced and corrected for the six regional city descriptions.
- Home widths 390/430/768/1440: no horizontal document overflow observed. Not a complete device/browser certification.

## Phase 1 changes

- Seven taxi status/error strings translated in all seven languages. Location failure no longer incorrectly assumes every failure is permission denial. Routing and tariff math unchanged.
- Six regional city descriptions now have persisted German, French, Arabic and Russian translations. Existing Turkish/English originals and Chinese overlay preserved.
- Mobile-only hero wash reduced so the existing image is more visible. No asset replacement or desktop layout change.
- Added regression tests and a repeatable read-only inventory: `node scripts/audit-readiness-baseline.mjs`.

## Taxi coverage blocker — no unverified seed created

Address resolution intentionally accepts only Istanbul. Expanding it without verified jurisdiction-specific tariffs would be unsafe. Coordinate rectangles are not a safe alternative.

- Izmir official March 11, 2026 council summary refers tariff proposals to commissions and lists separate district/class scopes. It is not the final numerical tariff approval: https://www.izmir.bel.tr/YuklenenDosyalar/MeclisKararOzetleri/12032026_010122_11.03.2026%20KARAR%20%C3%96ZET%C4%B0%20%C4%B0LANI.pdf
- The official 2025 decision https://www.izmir.bel.tr/tr/KararDetayi/35756 is not sufficient to assert current 2026 values.
- Antalya transport tariff page https://ulasim.antalya.bel.tr/Home/TarifeListesi exposes service timetable controls, not a complete current taxi meter tariff. Search results disagree on fares. Municipality permit fees are not passenger meter fares.
- Ankara official sources inspected include https://direct.ankara.bel.tr/ukome and https://www.ankesob.org.tr/2026-yili-genelgeleri/ ; no complete current numeric meter tariff and jurisdiction established in this pass.

Needed: approved current tariff sheets/authoritative links with opening, km, minimum, waiting where applicable, effective date and district/class coverage. These are evidence gaps, not a reason to fabricate rates. No remote seed approval is requested yet.

## Translation gaps still present

All 59 published editorial entries lack explicit de/fr/ar/ru descriptions; English fallback remains. en/tr and existing zh overlay cover these records. The read-only script lists exact IDs. Legacy city taglines/highlight descriptions and local tips (outside the six regional fixes), transport/editorial text and some auth/catalog states still need full localization. A language-wide PASS is not claimed.

## Image licensing audit

51 reviewed image records carry attribution metadata: CC BY-SA 3.0 (11), CC BY 2.0 (4), CC BY-SA 4.0 (23), CC BY 3.0 (3), CC0 (5), CC BY-SA 2.5 (1), public domain (1), CC BY-SA 2.0 (2), CC BY 4.0 (1). These licenses generally permit commercial reuse subject to their conditions; metadata alone does not prove compliance. Source pages, original authorship, modifications and required attribution must remain auditable.

- City/venue galleries use local responsive WebP variants with source credits. Cinema illustration is labelled, not represented as a venue photo.
- Homepage hero is project-generated AI imagery (heroPhoto.json), not a real location photograph or evidence of venue appearance; no third-party photo-provider license claimed.
- User-supplied logo/favicon: supplied by user, no independent ownership documentation found. Do not claim exclusive ownership.
- Historical hotel photos with previous branding require retaining their captions; do not label them current hotel photography.
- Unreferenced legacy assets and any future CMS `image_url` have no automatic licensing assurance. No working images deleted.
- No newly authorized Google/Viator/hotel image provider confirmed. Provider contracts and attribution rules must be checked before Phase 3.

## Next five tasks

1. Obtain the complete authoritative 2026 taxi tariff documents and model their actual districts/classes before enabling those origins.
2. Finish de/fr/ar/ru editorial and legacy city/UI translations, preserving proper names and reporting fallback coverage.
3. Finish browser regressions including location-denied/failure cases, exchange office search and mobile menu across languages.
4. Close Phase 1 only after those checks; then implement the smallest crawlable-content solution on the existing stack.
5. Confirm provider accounts, terms, scope and server-side credentials before any Phase 3 external integration. No paid activation assumed.

## Final checks for this partial Phase 1 commit

Lint PASS; TypeScript PASS; production build PASS; 93/93 tests PASS across 26 files (12 new tests). Initial JS 699.17 kB / gzip 216.18 kB versus 690.07 / 212.17 before; increase is persisted translations, not a performance improvement. Existing bundle warning remains.

Browser confirmed German Aydın description and German missing-origin/destination message. Mobile screenshot: `tmp/readiness-mobile.png`. No claim that every language/page has passed full end-to-end regression. Existing current-location flow leaves origin coordinates unselected after reverse lookup and needs a separately tested correction before full Phase 1 approval. No new city tariff has been enabled.

Follow-up regression: existing taxi errors now translate immediately when language changes (English → German → English checked in browser). Istanbul Taksim → Sultanahmet repeated after changes: same 5.6 km, ~9 min, TRY 338–378 result as baseline. Partial Phase 1 commit `df88528`; follow-up commit stores error keys instead of translated error strings.

Changed files in this Phase 1 partial commit: `src/App.tsx`, `src/index.css`, `src/lib/taxiErrors.ts`, `src/lib/regionalDescription.ts`, `src/data/regionalDescriptions.json`, `src/test/taxiErrors.test.ts`, `src/test/regionalDescription.test.ts`, `scripts/audit-readiness-baseline.mjs`, `READINESS-SPRINT.md`.

Phase 2: no new SEO, route, rendering, sitemap or schema changes. Phase 3: no provider integrated, no new endpoint, no cost/quota/credential changes. Places/Routes billing and key scopes, approved Viator access, hotel provider selection and AI grounding remain unverified prerequisites; credentials are not to be pasted into chat.
