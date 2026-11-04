# Search appearance and multilingual routes

Updated 2026-11-04. Implementation branch: codex/multilingual-search; not a production-release record.

## Existing public content

The existing homepage, ten feature pages, twelve city pages and four information pages have eight language variants: English (unprefixed), /tr, /de, /fr, /es, /ar, /ru, /zh. This produces 216 base URLs. URL slugs stay stable; visible city names can be localized. No Dutch locale was added.

src/lib/searchPages.ts supplies titles, descriptions, links and structured data; src/components/SearchGuide.tsx supplies shared visible content. scripts/build-directory-pages.mjs renders that content into initial HTML and builds the canonical sitemap. React displays the same guide in a compact expandable section. The interactive tools and external provider results still require JavaScript and working providers; they are not represented as static business inventory.

Every generated language variant has its own canonical, eight reciprocal language alternates and an English x-default. Homepages use WebSite/Organization structured data, cities TouristDestination, and the remaining base pages WebPage. Client navigation uses the same schema builder. No invented review, aggregate-rating, price, booking or safety claims are added.

Explicit URL language takes precedence over localStorage. Language switching preserves query, fragment and tab history state. Navigation and reload keep the URL language. Manual discovery areas remain scoped to the underlying section/city across language changes and expire after 30 minutes. Coordinates and addresses are not added to sitemap or telemetry.

## CMS, dynamic results and retired pages

The existing published CMS snapshot remains the source for editorial detail pages. English/Turkish detail variants are generated only when actual descriptions exist. Google Places and Viator results are not permanently copied into generated business pages. A public search/discovery query is canonicalized to its base feature page, not advertised as a new sitemap landing page.

The 91 pre-API manual entries remain retired and excluded from sitemap. Existing permanent redirects remain; their Turkish versions now retain Turkish. Restaurant redirects without historical city metadata remain at the restaurant discovery page rather than guessing a city. Admin, API, QA and missing pages are not added to sitemap; unknown production paths must return 404.

## Validation and release

Run build before generated-content tests. localizedSeo.test.ts checks the complete, non-empty 216-page set, translated content, canonical/alternate reciprocity, shared structured data, internal targets and legacy redirect language. Navigation tests cover explicit language changes, history, filters and manual discovery state. Existing catalog, asset, privacy and security regressions remain enabled.

Vite's preview SPA fallback can return homepage HTML for an extensionless nested URL; it is useful for client UI smoke tests but is not proof of hosted static routing. Verify raw nested responses on the Vercel preview, including 200/404, canonical, hreflang and body content. Do not weaken preview protection. Preview must stay excluded from indexing.

After a separately approved production release: verify the public sitemap and representative language URLs; submit https://www.safeinturkiye.com/sitemap.xml in the correct Search Console property and connected Bing Webmaster Tools account. Do not submit preview URLs. Monitor queries, pages, countries and non-brand impressions/clicks over comparable date ranges. Indexing, rankings, snippets and favicon refresh timing are controlled by search engines, not guaranteed by this implementation.

Official references:
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
