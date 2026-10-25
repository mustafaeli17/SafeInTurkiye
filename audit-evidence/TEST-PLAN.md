# Full platform audit — 2026-10-25

Baseline: `924674c`. Audit only: no application changes, deploys, remote migrations, bookings, payments, messages, or real personal-location submissions.

## Execution plan

1. Inventory routes, providers, trust boundaries, CMS/RLS, translations, environment-variable **names only**; preserve unrelated work.
2. Run the existing full tests, typecheck, lint, production build once. Record output; do not infer end-to-end success from unit tests.
3. Read-only HTTP inventory of sitemap routes, redirects, missing pages, headers, favicon/robots. Use limited requests, no attack or load testing.
4. Real Chromium browser: home/global search, city navigation, Google discovery/detail/back/reload, taxi addresses/calculation, transit route, currency inputs, tours/affiliate links, safety/FAQ/legal, anonymous admin access.
5. Viewport checks at 320/375/390/430/768/1024/1440; all eight UI languages. Distinguish sampled flows from exhaustive locale/route permutations.
6. Exercise invalid/empty inputs in the browser; inspect automated fixtures for provider timeouts, denied geolocation, zero results and errors. Do not claim browser network simulation or real iOS testing if unavailable.
7. Inspect security/cost/performance in code and passive production responses. Billing, applied remote RLS, admin writes and Google index state require privileged evidence and are otherwise unverified.
8. Compare public primary product pages for travel-platform patterns; label recommendations separately from defects.
9. Produce full report, finding register, 7/30/90-day roadmap and evidence. Stop for owner review.

## Environment separation

- Production: https://www.safeinturkiye.com/ (read-only navigation and ordinary route/search requests).
- Preview: https://safe-in-turkiye-git-codex-phase3-places-preview-eli-1196.vercel.app/ (sample parity; protection may limit raw HTTP).
- Local: production build and tests, no private keys requested or printed. Local Vite does not implement Vercel `/api` routes by itself.
- Browser: in-app Chromium. WebKit/Firefox and physical iPhone unavailable unless separately established.
