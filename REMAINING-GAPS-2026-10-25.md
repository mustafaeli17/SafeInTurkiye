# Remaining audit gaps — technical closure pass

## Implemented

- Split React and Supabase into independently cacheable runtime chunks using the installed Vite/Rolldown API. No blanket vendor group that forces lazy routes into initial load. Build manifest plus CI budget checks count **all initial imports** and reject JS chunks over 500kB.
- Largest chunk: 599.34kB baseline -> 214.55kB. App chunk: 201.56kB. **Total initial JS is 606,429 bytes / 194,148 gzip bytes**, not 201kB. This is a caching/chunk-size improvement, not a claim of a reduced cold-load payload.
- Taxi map extracted without changing fare maths, coordinates or routes. Packaged Leaflet replaces unpkg executable/CSS injection. Preview/local use the same OSRM route geometry on the existing OSM map if no dedicated Preview Embed key exists. Live hostnames continue to use their production Google Embed key. Lookalike hosts cannot inherit that key.
- Optional `VITE_GOOGLE_MAPS_PREVIEW_BROWSER_KEY` documented. No new credential, Google Cloud permission, paid API or key restriction changed. This removes the Preview taxi-map blocker through an existing fallback; it does **not** certify a separate Google Preview key.
- Baseline **enforced** CSP: object embeds prohibited, same-origin base/form actions, no framing. Strict provider/script allowlist stays report-only: claiming full strict-CSP completion would be inaccurate. No unsafe-inline script/eval exception added to enforcement.
- Fixed CI sequence: prerender tests require build output, so build runs before tests. Do not concurrently rebuild/empty dist during tests.

## Verified

- 63 files / **396 tests passed**; production build, typecheck and lint passed.
- Bundle budget, final SEO/head, favicon and 25 decoded-image checks passed.
- Local production build served with exact configured response headers; HTTP confirms enforced CSP. Actual browser renders under this policy.
- Real browser: Taksim -> Sultanahmet, actual address suggestions, 5.6km / about TRY340, route polyline + both endpoints; 15 successfully decoded map tiles. Desktop and 390px mobile viewport: no horizontal page overflow, route remains present. Native mobile navigation and Exchange route/component load verified (local static server intentionally has no rate API).
- Screenshot: `audit-evidence/remaining-map-desktop.jpg`.

## Cannot be manufactured by code

- Owner has not yet supplied an approved public operator name. A planned `support@safeinturkiye.com` mailbox is **not active/verified** and was not published as a working support channel. Reservations remain closed. No retention policy, response time or contact identity invented; no historical data deleted.
- Physical iPhone/Android, actual GPS permissions/location and authenticated staff lifecycle remain owner/device acceptance checks, not replaced by viewport emulation or unit tests.
- Strict nonce/hash CSP across third-party Maps and static/prerender pages needs a separately scoped compatibility implementation. Baseline enforcement is delivered; strict script enforcement remains a follow-up, not a hidden completed item.

## Sources used for implementation decisions

- [Rolldown code splitting](https://rolldown.rs/reference/OutputOptions.codeSplitting) and [group matching](https://rolldown.rs/reference/TypeAlias.CodeSplittingGroup): stable vendor caching, explicit groups, side-effect caveat.
- [Google Maps CSP guide](https://developers.google.com/maps/documentation/javascript/content-security-policy): nonce-based strict CSP requirements and provider compatibility. No untested broad script policy enforced.

Production/main unchanged; no remote migration. Preview deployment verification is recorded below after deploy.

## Deployment verification

- `fcb7664` pushed only to Preview branch; Vercel reports **Ready** (10s build). Production/main remains `924674c`.
- Authenticated Preview browser loads the packaged taxi map with decoded OSM tiles and no rejected Google iframe. Production Google key restrictions remain intact.
- Preview end-to-end: Taksim Meydanı -> Sultanahmet Meydanı, 5.6km / about TRY340; decoded map tiles, route and endpoints visible; 485px client/scroll widths match. Proof: `audit-evidence/remaining-map-preview.jpg`.
- Operator/contact remains awaiting an approved public person/company name and an actually active support mailbox. The owner has only proposed a future mailbox so far; no invented working contact was published.
