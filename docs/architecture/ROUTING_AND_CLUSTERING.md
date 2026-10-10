# Routing and clustering (planning batch)

## Goal

From an admin Excel of student home/PG coordinates, propose pick/drop stops (centroids), routes, and buses so commute time and walk distance stay reasonable under capacity — using **rules**, not heavy ML.

## Pipeline

```text
Excel import
  → validate rows (SRN, email domain, lat/lng)
  → density cluster (DBSCAN recommended)
  → centroids = cluster means (= candidate stops)
  → outliers → snap OR needs_admin_review
  → order centroids into routes (heuristic + admin edit)
  → assign bus(es) by headcount vs capacity rules
  → admin confirm (atomic) → lock student stop/route
```

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

## Centroids

- Default: arithmetic mean of member coordinates.
- Optional later: snap centroid to nearest road graph node (OSRM nearest).
- Admin may drag centroid / merge / split clusters before confirm.

## Route order and commute time (MVP)

**MVP uses distance + approximate time only. No live traffic.**

1. Admin sets campus depot coordinates (`campuses.lat` / `lng`). Planning requires them.
2. Order pickup centroids with nearest neighbour **starting from the campus depot**.
3. **Pack** consecutive ordered stops onto each available bus while cumulative headcount ≤ capacity — one route may include many centroids (not one bus per cluster).
4. Each route’s `route_stops` sequence is **campus → pickups → campus** (same campus stop at start and end).
5. Duration source (pick one or combine; always label as approximation):
   - **Default MVP:** Haversine distance × assumed average bus speed → approx time.
   - **Optional upgrade:** OSRM static road distance/duration (still **no traffic**).
6. Live traffic, congestion, and time-of-day traffic multipliers: **out of MVP**.

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
