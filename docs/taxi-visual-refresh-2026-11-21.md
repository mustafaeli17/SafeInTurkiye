# Taxi page visual refresh — 2026-11-21

- Scope: presentation only; existing address selection, tariff calculation, source notices and Google map component retained.
- Hero uses existing `istanbul-hero-1280.webp` plus a new illustrative taxi cutout, not a photograph of a real taxi operator.
- Cutout created with the built-in imagegen tool, transparent PNG, exported with Sharp to 900px WebP (82,156 bytes). Original is preserved outside the repository.
- Prompt: Premium photorealistic yellow Istanbul-style taxi sedan, front three-quarter view facing left; transparent background; no people, manufacturer emblem, plate numbers or business branding; roof text TAKSİ; natural reflections and soft daylight.
- Animation: one 1.65-second perspective entrance; CSS transforms only; disabled for prefers-reduced-motion. No 3D engine or new dependency.
- Currency amounts in the supplied mockup were not copied. No tariff or provider settings changed.
- Desktop: full-width form; map/result two-column layout. Mobile: single column. Search guide retained once below calculator.
