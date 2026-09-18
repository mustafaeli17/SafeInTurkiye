# Transit data coverage

`TransitPlanner` provides an editorial station-to-station guide for the central
Istanbul F1/T1 corridor. It is not a complete or live journey planner. The route
depends on the selected supported stations, can run in either direction, and
only adds an F1/T1 interchange when necessary. Unsupported station IDs fail
closed. Changing a station clears the previous result.

Official station order and the Kabataş connection were checked on 17 September
2026 against Metro İstanbul:

- https://www.metro.istanbul/en/Hatlarimiz/HatDetay?hat=F1
- https://www.metro.istanbul/en/Hatlarimiz/HatDetay?hat=T1

Map points are approximate station locations, not a surveyed platform entrance
or route trace. The map does not use driving directions. It has no polylines
purporting to show transit geometry. Map data attribution remains visible.

## Missing live service

No live multimodal journey-planning service or credentials are configured.
Complete arbitrary-address routing requires a server-side provider covering the
requested Turkish cities, with scheduled and realtime transit data, transfers,
walking legs, service alerts and licensing suitable for public display. It may
instead use licensed GTFS/GTFS-Realtime feeds with a routing backend. A map tile
service or OSRM driving endpoint does not supply this data.

No departure, duration, frequency, traffic score or fare is calculated from
station count or a driving route. The page explicitly marks these unavailable.
Official fare data must separately include ticket type and effective date.

If adding a provider, keep the credential server-side and return structured legs
with provider provenance, feed timestamp, covered area, real geometry (if
licensed), service alerts, and per-field availability. Error and no-route cases
must never fall back to this guide silently or claim the best/fastest route.
