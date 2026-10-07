# Platform Foundation — isolated verification, 2026-10-07

Status: IN PROGRESS, not production-ready approval.

## Additional closure checks
- 178 tests / 39 files; typecheck, lint and default build pass.
- CMS-mode build reads the public publication view, refuses fallback on failure,
  and uses that snapshot for detail HTML and sitemap. Tested against the actual
  isolated project: 2 business URLs, 11 city pages, no orphan business URLs.
- Admin browser: received the visitor request and confirmed it; confirmation
  success state verified. Real metrics displayed in the admin screen.
- Admin browser edit/save changed the restaurant description; fresh public
  detail displayed exactly the updated description.
- Request history now clears on auth changes and ignores stale in-flight results.
- Static prerender/sitemap are build-time snapshots, not automatically rebuilt
  by a CMS edit. A publishing/rebuild procedure is still required before rollout.

## Verified
- Migrations 0001–0005 applied only to qctltygvdxpzdaliczig (foundation test).
- Real Supabase Auth/PostgREST: visitor insert defaults PENDING; a different
  user cannot read that booking; staff confirmation is visible to its owner.
- Real published view excludes DRAFT/ARCHIVED and includes PUBLISHED.
- Real local event endpoint → test database → staff metrics; ordinary users
  cannot read metrics. Fixed local middleware ordering (404 before fix).
- Browser: test visitor login, restaurant detail, request submission with a
  generated reference, request history with pending/confirmed entries.
- Mobile request history at 390px viewport: no horizontal overflow.
- Earlier browser check: test editorial listing and explicit Sponsored label.
- 175 tests / 38 files pass (PGlite tests enabled), typecheck/lint/build pass.
- Existing static build produces 70 detail pages. Initial JS 710.73 kB,
  gzip 219.52 kB; known bundle warning remains.
- Server credential absent from dist. Local env and test-user file ignored.

## Implemented but not fully browser-E2E verified
- Opt-in foundation CMS mode preserving public_slug and gallery metadata.
- Contacted reservation stage, seven-language visitor history.
- Sponsorship management/public placement, metrics administration.
- Editorial impression/detail/phone/site/directions/reservation events.

## Required before approval
- Complete actual admin browser edit/status/sponsorship/metrics flows.
- Finish canonical CMS publication snapshot integration with prerender/sitemap;
  default production remains legacy static and MUST NOT enable the foundation
  flag until existing catalog migration and URL parity have been verified.
- Complete remaining important city/transport translations and Google discovery
  interaction instrumentation (currently editorial events only).
- Full desktop/mobile regression against configured Google and Exchange preview.
  The isolated local launcher intentionally has no Google API proxy configured.
- Test authenticated history after logout/session changes and account navigation.

No production deployment or production database mutation performed.
No production credential changed. Test records are explicitly labelled fixtures.
No Google business data copied into the CMS. Analytics are event counts, not
unique visitors or physical visits. Rate limiting is instance-local, not a
distributed billing/abuse guarantee. No email/SMS/payment integration.
