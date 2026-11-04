# Privacy and advertising readiness — 2026-11-04

Scope: technical review of the current source, production database access policies (read-only), personal-data flows, email handling, typography and provider attribution. This is not legal certification or a guarantee against fines. No paid service, tracking pixel, credential change or remote migration was introduced.

## Changes

- Inter is self-hosted instead of requesting Google Fonts on each visit. The unmodified upstream variable font, OFL license and pinned source are shipped in public/fonts. Existing font family and design remain.
- Reservation retention runs independently of notification delivery. A failing notification queue no longer prevents the scheduled 90-day PII cleanup attempt. Either task failing still returns a safe 503 for monitoring/retry.
- Privacy disclosures no longer switch back to outdated retention statements when new reservation intake is disabled.
- Eight-language privacy information now describes language/auth storage, seven-day reservation session summaries, technical connection data, possible international processing, no reservation-contact marketing, and a contact route for access/correction/deletion.
- Both optional visitor analytics and business interaction events honour Global Privacy Control as well as Do Not Track.

## Verified

- Production Supabase public tables have RLS enabled. Booking access is restricted to the owner or staff; notification health and business metrics require staff. Profiles have a role-escalation prevention trigger. No customer rows or secrets were exported.
- Read-only aggregate: zero guest reservation rows currently overdue under the implemented 90-day terminal-status/visit-date cleanup policy. This does not prove every previous cron invocation succeeded.
- Email payload excludes customer contact details; status access uses a hashed private token and seven-day cutoff. These boundaries have automated coverage.
- Google Places/photo endpoints use private/no-store responses; author attribution is rendered. AI destination covers have an illustrative-artwork notice. Viator disclosure remains visible and tour payment is external. These checks do not replace the provider contracts or prove rights to every historic/admin-uploaded file.
- No Meta pixel or Google Ads tag was found in the inspected application source. Homepage analytics strip query parameters and exclude admin/receipt routes.
- npm audit --omit=dev: zero reported vulnerabilities (not a guarantee of absence of vulnerabilities).
- 577 tests across 80 files passed; typecheck, lint, production build passed. This build has no >500 kB chunk warning; largest reported JS chunk is ~232.35 kB before gzip.
- Real browser: privacy page at 390x844 in en/tr/de/fr/es/ar/ru/zh, correct locale/direction and no horizontal overflow; Turkish desktop at 1365x900 and navigation to terms passed.
- The previous failed Vercel preview was caused by ENOTFOUND for the paused test Supabase project, not a TypeScript failure. Both production and test projects now report ACTIVE_HEALTHY.

## Owner / professional follow-up before paid advertising

- Establish applicable Netherlands/EU/Türkiye business, tax, consumer and privacy requirements with qualified advice; code cannot establish the operator's registration or lawful basis.
- Confirm processing purposes/lawful bases, processor agreements and international transfer mechanisms for Supabase, Vercel, Resend and map providers. A provider privacy-policy link alone does not establish these.
- Determine whether deployed optional analytics/map integrations require additional consent for the actual audience; GPC/DNT support is not a substitute for legally required consent. No blanket GDPR/KVKK compliance claim is made.
- Pending/future and legacy account-linked reservations are deliberately excluded from the 90-day automatic cleanup. Establish a review/closure process and retention policy for these plus provider backups/logs. No historical data was deleted in this pass.
- Keep evidence of rights for user-supplied branding and future sponsored-business uploads. Verify each campaign's music, images, claims and affiliate disclosures separately.
- No paid advertising campaign was opened. No claim that the quoted social-media fine applies to this site.

Deployment status and exact commit are reported separately after Vercel verification.
