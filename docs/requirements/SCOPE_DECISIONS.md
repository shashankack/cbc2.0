# Scope decisions

| Decision | Choice | Date |
|----------|--------|------|
| UI library | MUI (not Tailwind) | 2026-10-10 |
| Auth | Email OTP on verified college academic domains | 2026-10-10 |
| Student intake | Admin Excel/CSV import (Name, SRN, email, home/PG coords) | 2026-10-10 |
| Pick/drop planning | Cluster coords → centroids as stops → assemble routes per batch/year | 2026-10-10 |
| Student pick/drop changes | **Locked after admin confirms plan** (no student self-edit) | 2026-10-10 |
| Sparse students (1–2) | Snap to nearest stop if within max walk; else admin review / manual stop | 2026-10-10 |
| Bus-to-route | Rule-based by headcount vs capacity (no heavy ML) | 2026-10-10 |
| Allocation confirm | Admin reviews clustering/route/bus proposal; atomic confirm | 2026-10-10 |
| Distance / time MVP | **Distance + approximate travel time only** (Haversine and/or OSRM static road time). Label as approximation. | 2026-10-10 |
| Live traffic | **Out of MVP** — do not use traffic data for centroids, routes, or ETAs | 2026-10-10 |
| Google Maps API | **Not required for MVP** — OSM + Leaflet; optional OSRM for road distance/time | 2026-10-10 |
| QR boarding | **Restored** — driver manually starts **and manually ends** session; QR only while active; student scan → attendance | 2026-10-10 |
| Live tracking | **Driver phone only** during an active trip session; students see real-time (or near-real-time) bus position. No student GPS tracking. | 2026-10-10 |
| Driver itinerary | After route finalize, driver sees **stops in order**; shown prominently when trip starts (list + map). No turn-by-turn nav in MVP. | 2026-10-10 |
| Driver distress | Distress button on active trip → capture coords immediately → compute boarded vs remaining pickups → rule-based dynamic allocation of available buses; admin quick-confirm; full audit | 2026-10-10 |
| ML models | **None** — rule-based analytics from attendance OK | 2026-10-10 |
| Branches | `main` + `feat/ui-design-system`, `feat/demo-qa-docs` | 2026-10-10 |
| API prefix | `/api/v1`, JSON, `snake_case` | 2026-10-10 |

See also: [ADR 0005](../../decisions/0005-excel-clustering-routes-and-restore-qr.md).
