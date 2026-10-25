# Audit fixes — preview implementation

Baseline `924674c`; production is unchanged. No remote database migration, secret edit or new paid service.

## Implemented

- F02: Vite 8.2.4 security patch; Vitest 5.0.3 patch; unused @google/genai removed. Explicit sharp 0.35.5 dev dependency; compatible transitive zod patch. `npm audit`: zero reported vulnerabilities (not a security certification).
- F03: Shared discovery gaps in DE/FR/AR/RU/ZH/ES translated; staff login/admin fields and safe errors localized in 8 languages. Provider product fallback language remains explicitly labelled.
- F04: Selected manual area restored from tab history for 30 minutes, not written to URLs/analytics/localStorage. Query/detail navigation preserves history state; city change clears area. No actual GPS is persisted by this mechanism.
- F05: Nonfunctional Summer/Winter shortcuts removed; Museum/Cinema/Entertainment remain.
- F06: Native modal dialog, autofocus/labels/autocomplete, browser focus containment, Escape and focus restoration. Auth provider errors no longer dumped raw.
- F07: Observational budget samples now enforce a 30-day review window and reject future/invalid dates, matching conservative tariff maintenance principles. Existing fare maths and source dates unchanged. **Human source review remains necessary; default October 6 observations need rechecking before early November.** No invented fresh date or tariff.
- F08 partial: Logo losslessly optimized/resized from 541.74kB to 51.73kB; original editable PNG retained. Stable public logo URL avoids hashed OG/schema asset links. Nearby code lazy-loaded; main JS 633.80 -> 599.34kB (gzip 205.86 -> 193.22). >500kB warning remains.
- F09 partial: X-Frame-Options DENY prepared; scoped CSP **report-only**, not enforced. Provider compatibility still monitored; no security settings changed in the live account.
- F10: Sharp explicitly declared; 25 active images decode and build paths verify. SEO validator no longer hardcodes a historical hashed logo file.
- F11: Paused-service notice added to general reservation confirmation FAQ; useful general advice retained. Privacy summary now describes actual providers/closed requests instead of implying active reservation intake. Owner contact/retention remain unresolved.
- F12: Accessible localized invalid currency amount message, including zero as valid.
- F13: Duplicate bottom safety banner removed; emergency and primary advice retained.
- F14: Expired signed photos trigger a shared, rate-limited list refresh (one attempt per 30sec), preserving expanded results/detail state. No token security weakening, permanent Google storage or per-image search storm.
- Read-only GitHub quality workflow prepared: tests/typecheck/lint/build/icons/SEO/images. Actual repository branch protection/required checks not changed.

## Evidence so far

- Full suite: 62 files / **392 tests passed**. Typecheck, lint, build passed.
- Favicon, SEO build validators and **25 decoded active images** passed.
- Local native dialog: Email received focus, Escape closed, trigger focus restored.
- Local manual area: Beşiktaş, İstanbul retained after reload; Google API unavailable on plain Vite as expected (do not mistake local API error for provider acceptance).
- Local-only fixture harness: first search issued expired photos; one failure triggered one extra search, all six fresh images loaded. Stats: searches=2, expiredPhotos=1. Explicit TEST ONLY data never deployed or presented as genuine businesses. Harness uses no Google credential.
- Existing production historical audit remains unchanged in the three audit reports. Preview-specific final evidence is appended after deployment verification.

## Still requires owner / environment

- F01: Real operator name, support email/operation and retention policy. No invented identity/contact. Reservations stay closed.
- Real physical iOS/Android/GPS, authenticated CMS lifecycle, account WAF/provider quota verification are not claimed completed.
- Full enforced CSP and remaining chunk optimization are follow-up items, not silently marked fixed.

## Final Preview verification — 2026-10-25

- Implementation checkpoint: `a37c138`, pushed only to `codex/phase3-places-preview`; Vercel deployment Ready. Production/main remains `924674c`.
- Authenticated Preview: real Google discovery results loaded; selected Beşiktaş area survived reload; Chinese category/search/disclosure/status copy rendered correctly. See `audit-evidence/fix-preview-restored-area.jpg`.
- Chinese staff dialog: labelled inputs/autofocus and Escape closure verified. See `audit-evidence/fix-preview-dialog.jpg`.
- Root horizontal overflow checks passed at 320, 390 and 1440px viewports. This is browser viewport testing, not physical-device certification.
- Taxi regression: Taksim Meydanı to Sultanahmet Meydanı returned 5.6km / about TRY340; existing calculation unchanged.
- **Preview Maps limitation:** existing browser key only authorizes production domains, so Google Maps Embed rejects the Preview host. No key/restriction changed. A separate Preview-restricted map key/config is needed for Preview map acceptance; production maps were not changed by this work.
- Unauthenticated Preview HTTP checks returned SSO redirects for homepage/logo/sitemap. Protection was not weakened. Final deployed response headers could not be independently verified through unauthenticated HTTP.
- Final code validation: 392 tests passed, typecheck/lint/build passed; photo/favicon/SEO validators passed; npm audit reports zero vulnerabilities. The taxi-budget test clock was subsequently stabilized and its 17 targeted tests passed.
- No production deploy, remote database migration, new paid service or credential change performed.
