# Taxi / transit address reliability — 2026-11-19

Scope: extend the generic selected-place fix beyond Sabiha Gökçen. No production deployment, new credential, database change or paid service.

## Evidence

- 21 real Photon queries across airports, landmarks, hotels, hospital and street names; 11 returned results and 10 failed (non-JSON responses or timeouts). Raw local evidence: `tmp/address-audit-results.json`.
- Esenboğa's ceremonial hall and Trabzon's airport guesthouse preceded the actual airport. Bursa hospital's connecting roads preceded the hospital; the provider did not return a confirmed hospital result in the original five-result sample. A later ten-result check timed out; that location remains unverified.
- Airport examples with real responses: Istanbul, Antalya, Adnan Menderes, Esenboğa, Milas-Bodrum, Dalaman, Trabzon, Gaziantep. Also Anıtkabir and İzmir hotel results. These are observed provider records, not confirmation of operational/business status.
- Arabic/Russian/Chinese live search attempts timed out; multilingual live coverage is NOT established.

## Changes

- Request ten candidates in one existing request; display five after stable type-based ranking. No additional per-keystroke requests or fixed-city bias.
- Prefer actual aerodromes/hospitals/museums when the query explicitly names that type; retain provider order for explicit sub-place requests such as airport hotel, metro, terminal or road. Never synthesize missing results or select a suggestion automatically.
- One validated parser for taxi and transit: reject malformed/non-finite coordinates and explicit foreign-country results, retain numeric building numbers, trim/deduplicate address parts.
- Taxi search now exposes localized loading/empty/error states, ignores cancelled responses and does not request fewer than three characters. Existing selection and tariff rules remain intact.
- Earlier generic map fix continues to pass the chosen full place/address to Google Maps; GPS-only locations remain coordinates. Tests cover airport, hotel, hospital, landmark and street names before/after calculation.

## Verification and limits

- 661 unit/regression tests passed; typecheck, lint and production build checked separately.
- Browser regression uses the captured real provider responses (not a fresh availability test) for Esenboğa, Trabzon, Adnan Menderes, Anıtkabir and an İzmir hotel. Includes empty, 503, malformed, timeout, stale-response and mobile-layout scenarios.
- Provider outages and missing data remain genuine limitations. No invented fallback coordinates or another city's result.
- Google Embed independently resolves full address text; the OSRM calculator uses selected provider coordinates. Existing source/distance discrepancy notice remains. These are not guaranteed identical routes or terminal entrance coordinates.
- Official Photon API reference: https://github.com/komoot/photon/blob/master/docs/api-v1.md

Only Preview is to be updated. Google-backed address autocomplete would be a separate implementation with API/cost/privacy review, not silently introduced here.
