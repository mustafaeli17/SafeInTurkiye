# Search appearance

The homepage title, description, canonical, social cards and WebSite/Organization JSON-LD are in `index.html`, before JavaScript rendering. The social/organization logo is the existing unmodified brand asset, verified HTTP 200 on production on 2026-09-20. If that asset changes, update both metadata URLs and check the production URL before publishing.

Only `/` is currently a public crawlable page. Other views are React state tabs; `#admin` opens authentication and is not a public search landing page. `src/lib/seo.ts` updates tab-specific browser metadata without inventing paths or claiming independently indexable pages. The sitemap intentionally lists only the canonical homepage. Proper distinct search landing pages require a separately approved route/rendering migration.

Favicon SVG uses a compact blue S/red sun inspired by the existing logo. The main wordmark is unchanged. `scripts/build-icons.mjs` renders PNG/ICO exports using sharp (pass its installed module path as the first argument). Generated files are checked in, so builds need no image generation dependency. ICO contains 16, 32 and 48px PNG frames; other icons are 96, 180, 192 and 512px.

Homepage has one H1 and section H2s. Added a text separator across the H1 line break; old AI/live-advisor wording is not in the current homepage component. No visual redesign was made.

After production approval: deploy the tested preview revision, verify all canonical/icon/robots/sitemap URLs, submit sitemap.xml in the domain's Google Search Console, and request indexing of https://www.safeinturkiye.com/. Google chooses its own title/snippet and favicon timing; changes require recrawling and are not immediate or guaranteed. Preview's canonical points to production; never submit preview URLs to Search Console.

Reference: https://developers.google.com/search/docs/appearance/favicon-in-search and https://developers.google.com/search/docs/appearance/snippet
