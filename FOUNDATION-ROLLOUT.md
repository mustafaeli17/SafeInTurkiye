# Foundation controlled publication

Development checkpoint only. No production deployment or production migration.

1. Export production and reconcile existing identities against the prepared
   `supabase/seeds/foundation-catalog.sql`. Apply missing 0004/0005 migrations
   only after approval; never replay already applied migrations.
2. Import the 59 existing eligible records as DRAFT/UNVERIFIED. Conflicting
   city/name/slug identities abort. Existing CMS edits are never overwritten.
   Review and publish intended records; verify all 59 previous paths.
3. Only then enable VITE_PLATFORM_FOUNDATION, configure server-only event
   credentials and exact allowed origins, build preview and obtain rollout approval.

Keep foundation OFF until migration/publication parity is confirmed. Empty CMS
must not replace production catalog. Seed was tested in isolated PostgreSQL only.

## Publication consistency

Runtime listings/details refresh from CMS on a fresh load, not realtime.
Prerender HTML and sitemap are a build snapshot. After publish/archive/text edits,
create an approved build against the same CMS, verify URLs, then promote.
There is no automatic deployment hook. Admin UI explains this distinction.

## Metrics

Counts represent interactions, not unique people or physical visits. DNT is
respected; event payloads exclude account/contact/location data. Google metrics
store place ID and our event/context/time only, never Places content.
Policy: https://developers.google.com/maps/documentation/places/web-service/policies
Rate limiting is instance-local, not distributed billing/abuse protection.

## Scope

Editorial CMS, reservation requests and basic measurement are implemented.
Layout/translations/guides remain versioned code/data, not a no-code site builder.
Google discovery stays provider-owned. No email/SMS/payment or new travel APIs.
