# Multilingual search implementation plan

> Execute inline with superpowers:executing-plans and test-driven-development.

**Goal:** Make existing public cities and features discoverable in all eight supported languages without changing working tools or creating copied provider business pages.
**Spec:** User-approved full-site scope in this conversation, following the 4 November read-only SEO audit.
**Architecture:** Retain Vite, React, existing routes and static generation. English remains unprefixed; translated public routes use /tr, /de, /fr, /es, /ar, /ru and /zh. URL language is authoritative. Share localized editorial content and metadata between interactive UI and generated HTML. Provider results remain dynamic.
**Constraints:** No production release, paid service, credential, database mutation, AI or hotel booking. Preserve pre-existing dirty files. No invented prices, ratings or verification dates. Keep retired venue catalog retired.

## Task 1 — URL language and history
- [x] Add failing tests for locale parsing, query preservation, unknown prefixes and language switching/back behavior.
- [x] Add locale helpers and integrate navigation, App and informational routes. Explicit language URLs override stored preferences; links retain language and filters.
- [x] Verify focused navigation and language tests.

## Task 2 — Shared content and generated pages
- [x] Add regression tests requiring real non-empty eight-language route sets, reciprocal self-inclusive alternates, self canonicals, localized titles/descriptions and body links.
- [x] Share localized practical explanatory content across city and service pages, retaining existing design. Reuse approved FAQ and legal text where appropriate; do not replicate live API data.
- [x] Generate all existing public page language variants with shared schema/metadata and sitemap. Preserve current CMS snapshot and only translate CMS detail variants with actual descriptions.
- [x] Preserve all retired routes and keep Turkish redirects in Turkish. City/query context retained where historical metadata exists; unknown restaurant cities are not inferred.

## Task 3 — Acceptance and preview
- [x] Update obsolete SEO documentation with actual architecture and operational follow-ups.
- [x] Run typecheck, lint, build, complete suite, asset/bundle checks; fix regressions.
- [ ] Browser desktop/mobile: explicit language, reload/back, Arabic RTL, city links, tools and metadata. Deploy preview only if current access allows; verify raw status/HTML there.
- [ ] Review whole change; checkpoint only task files and report limitations honestly.

## Review focus
Unknown locale paths must remain 404; query/hash/history state must survive switching; English URLs must remain English even with stored preference; no stale city/schema/alternate tags on navigation; no secret/PII in sitemap or analytics.

## Progress / rulings
- Baseline 5456c87. Existing checkout reused on dedicated codex/multilingual-search branch; unrelated historical files preserved.
- User requested execution without repeated intermediate approval. No production authorization inferred.
- Read-only audit already verified live 27-URL set; do not repeat discovery as a new project.

- Implementation: 216 base variants, shared visible guide and schema, locale-aware history/navigation and existing city name aliases.
- Complete suite: 584 tests passed. Build/typecheck/lint passed; post-review focused verification ongoing before checkpoint.
- Independent review found homepage/information schema drift; fixed with shared schema builder.
- Browser found Chinese city chips wrapping vertically at 390px; fixed with non-shrinking single-line chips.
