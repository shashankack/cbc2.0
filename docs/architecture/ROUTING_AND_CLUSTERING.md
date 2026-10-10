# Routing and clustering (planning batch)

## Goal

From an admin Excel of student home/PG coordinates, propose pick/drop stops (centroids), routes, and buses so commute time and walk distance stay reasonable under capacity — using **rules**, not heavy ML.

## Pipeline

```text
Excel import (student initial location preferences)
  → validate rows (SRN, email domain, lat/lng)
  → density cluster nearby homes (DBSCAN)
  → centroids = cluster means (= pick/drop stop points)
  → name each stop via reverse geocode (Nominatim; coord fallback)
  → outliers → snap OR needs_admin_review
  → link closest centroids into geographic chains (= candidate routes)
  → optimize visit order (nearest neighbour + 2-opt)
  → pack each chain onto bus(es) by headcount vs capacity
  → bookend campus depot: campus → pickups → campus
  → admin confirm (atomic) → lock student stop/route
```

**Mental model:** a stop is the centroid of a dense pocket of student homes. A route is a chain of those nearby centroids (shared corridor), not “one cluster = one bus.”

## Clustering parameters (per campus / batch)

| Param | Meaning | Typical starting point |
|-------|---------|------------------------|
| `eps_m` | Max distance to be in same neighbourhood | 400–800 m (tune) |
| `min_samples` | Min students to form a cluster | 5–10 (tune) |
| `max_walk_to_stop_m` | Max snap distance for outliers | campus setting |
| `min_students_per_route` | Below this, do not open a solo route | e.g. 8–15 |

## Sparse density (1–2 students)

**Do not** create a route only for them.

1. **Snap** to nearest confirmed centroid if distance ≤ `max_walk_to_stop_m`.
2. Else **`needs_admin_review`** — message: contact transport admin.
3. Admin **manual stop** and/or assign to an existing route.

DBSCAN “noise” points map naturally to step 2–3.

## Centroids (stops)

- Default: arithmetic mean of member student coordinates (from import preferences).
- **Stop name:** reverse-geocode the centroid (neighbourhood / suburb / road). Fallback: `Stop {lat}, {lng}`. Duplicate labels get a numeric suffix.
- Optional later: snap centroid to nearest road graph node (OSRM nearest).
- Admin may drag centroid / merge / split clusters before confirm.

## Route chains (closest centroids → route)

**MVP uses distance + approximate time only. No live traffic.**

1. Admin sets campus depot coordinates (`campuses.lat` / `lng`). Planning requires them.
2. Order all pickup centroids with nearest neighbour **starting from the campus depot**.
3. **Split** that tour into geographic chains wherever consecutive gap > `max(3 × cluster_eps_m, 1200 m)` — distant pockets become separate route families.
4. **2-opt** each chain to shorten the pickup loop.
5. **Pack** consecutive stops in a chain onto each available bus while cumulative headcount ≤ capacity. Large chains may need multiple buses; each packed segment is one route.
6. Route display name uses place labels, e.g. `Route · Koramangala → HSR Layout` (first → last stop on that packed segment).
7. Each route’s `route_stops` sequence is **campus → pickups → campus** (same campus stop at start and end).
8. Duration source (pick one or combine; always label as approximation):
   - **Default MVP:** Haversine distance × assumed average bus speed → approx time.
   - **Optional upgrade:** OSRM static road distance/duration (still **no traffic**).
9. Live traffic, congestion, and time-of-day traffic multipliers: **out of MVP**.

## Bus allocation rules (examples)

- Let `n` = confirmed students on a packed route, `c` = bus capacity.
- Open the next bus/route only when the next stop would exceed remaining capacity (or a single stop alone exceeds `c`).
- If `n < min_students_per_route` after packing → flag those students for admin review (do not open a solo micro-route).
- Leftover stops when buses are exhausted → `needs_admin_review` (partial proposal kept).
- Mark bus unavailable → reassignment proposal (existing disruption rules).

## Distress / emergency reallocation (runtime)

Triggered by driver **Distress** on an active trip (not the yearly planning cluster step).

```text
Distress pressed
  → save lat/lng + trip/bus/route
  → boarded = QR attendance count on this trip
  → remaining = assigned students not yet boarded
  → need ≈ remaining (and optional rescue policy for boarded)
  → pick available buses by capacity (+ optional nearest to distress point)
  → emergency plan → admin quick-confirm → replacement capacity on route
```

Uses **distance + approx time** only (no traffic). Rule-based; no ML.

## Google Maps?

Not required. Prefer OSM tiles (Leaflet) + optional OSRM. Google needs billing and is a poor fit for a free hackathon MVP.

## QR attendance → “future predictions”

Store boarding/attendance events. Later planning can use **simple rules** (e.g. historical no-show rate, peak load counts). No trained ML model in scope.
