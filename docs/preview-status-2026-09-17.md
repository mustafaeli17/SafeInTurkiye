# Preview status — not approved for production

## Implemented in this pass
- Replaced the visible assistant/chat screen with a searchable 14-question travel FAQ. Turkish, English, Arabic and Chinese answer sets are present. Other languages currently fall back to English answers.
- Added Ankara to the city data, home cards and city selector. Its photo remains a deliberate placeholder pending a suitable verified asset.
- Added transport-card guides for İstanbul, Ankara, İzmir and Antalya with official source links.
- Exact city-name home searches open the city page. Unknown searches go to filtered FAQs, not an AI endpoint. This is not yet a full search engine.
- Geolocation has a 15-second UI watchdog, stale callbacks are ignored, and unmount clears the timer.
- Account/booking actions explain missing local configuration. No authentication bypass was introduced.
- Admin preview-only updates no longer claim to publish persistently. Booking request copy no longer promises a guaranteed reservation.

## Follow-up progress
- Added Activities to the home tool grid.
- Added an Anıtkabir Ankara image with visible Wikimedia author/source and CC BY-SA 4.0 attribution.
- Added a multi-city transit journey form for free-form origin/destination, departure time and fewer-transfer/less-walking preferences. A server-only `/api/transit` proxy is implemented with input checks, authentication, throttling and timeouts. It intentionally reports that live routing is unavailable until `GOOGLE_ROUTES_API_KEY` is configured on the server; no fabricated route, departure or fare is shown.
- Fixed horizontal mobile overflow found during the 390px preview check.
- Recovered the public project URL and public anon key from the deployed site's public JavaScript. Auth settings endpoint returned HTTP 200. Configured the ignored local environment file; no service-role key was used.
- Deferred profile queries outside the auth event callback and added stale role-response protection.
- Added the #admin entry point, with authentication and existing role checks intact.
- Replaced the in-memory admin panel with database-backed forms for hotels, restaurants, activities, exchange offices, attractions and museums. Forms use existing schema columns; no migration was applied. Moderator UI is read-only. Record saves have NOT been tested with the owner's account yet.
- Anonymous published-content checks returned zero visible records for cities, hotels, restaurants, activities and exchange offices. This does not prove tables have no private drafts.

## Outstanding release blockers
- Owner-authorized browser sign-in succeeded and the profile resolved to admin. Admin hotel and city reads succeeded with empty results. No credentials were saved to source files. Save and full RLS tests remain pending; no remote records were written in this pass.
- The new admin supports core fields, but photos, dedicated structured business fields and city creation still need implementation/schema decisions. Public listing arrays still need replacement with database-backed content.
- Current transit guide covers only a small Istanbul station network. No four-city live itinerary/departure/fare provider is connected. Do not fabricate route results.
- Nearby live provider reliability and geolocation success still require end-to-end verification. A timeout guard does not guarantee provider availability.
- Site-wide Arabic/Chinese localization is incomplete outside the new FAQ answers.
- Activity, hotel and restaurant arrays still contain demonstration content; verify assets, business identity, availability and booking integrations before release.
- Booking requests are not confirmed supplier reservations.
- Full search matching, empty-state navigation and all mobile flows need further implementation/testing.

## Review
Home and FAQ viewed in desktop and 390px mobile preview. Full end-to-end QA not complete. No deployment, git push, remote migration or secret insertion was performed.
