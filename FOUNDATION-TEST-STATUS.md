# Platform Foundation — closure, 2026-10-07

Status: DEVELOPMENT CHECKPOINT READY; production activation remains approval-gated.

## Verified
- 179 tests / 39 files pass, including isolated PostgreSQL/PGlite tests.
- Typecheck, lint, default build and foundation-mode build pass.
- Default build: 70 pages; initial JS 711.52 kB (219.84 kB gzip).
- Foundation test-project build: 13 pages (2 fixture businesses + 11 cities).
  Public CMS snapshot supplies detail HTML and sitemap; no silent JSON fallback.
- Server service-role value absent from foundation build assets.
- Real test Supabase: own pending booking insert, cross-user RLS isolation,
  staff confirmation visible to owner, draft/archive visibility rules.
- Real event intake → test DB → staff metrics; ordinary users cannot read metrics.
- Browser visitor submission/reference/history and mobile 390px without overflow
  verified earlier. Admin edit/save appeared in fresh public detail; admin
  confirmation and metrics verified earlier.
- Browser sponsor creation persisted; restaurant listing showed explicit
  Sponsored label on new fixture.
- All 59 existing eligible routes prepared for migration. Seed executed three
  times in PostgreSQL: no duplicate, no overwritten CMS edit, no draft accidentally
  published; explicit publication preserves all 59 slugs.

## Closure fixes
- Guarded deterministic catalog seed and controlled publication procedure.
- Removed duplicate sponsor-click + detail-mount count.
- Google discovery event wiring stores place ID only, not Google business content.
- Completed remaining transit helper/mode labels in seven languages.
- Corrected obsolete admin instructions and explained build/sitemap refresh.

## Known limitations / rollout gates
- No production deploy, production database mutation or credential change.
- Catalog seed tested locally; production export reconciliation, approved import,
  publication and flag activation remain. Follow FOUNDATION-ROLLOUT.md.
- Isolated browser server intentionally lacks Google API proxies. New Google
  event wiring has validation/code checks, not a fresh real-provider browser E2E.
  Existing configured preview was not changed.
- HTML/sitemap require an approved rebuild after CMS publication changes; no
  automatic deployment hook or realtime update of already-open tabs.
- 500 kB bundle warning remains. Metrics count events, not unique visitors.
  Instance-local limiting is not distributed abuse protection.
- Targeted foundation/transit translations are covered; this does not claim
  all third-party descriptions are human-translated into every language.

Next API work can start from this development checkpoint in a separate request.
Production readiness is contingent on the explicit rollout gates above.
