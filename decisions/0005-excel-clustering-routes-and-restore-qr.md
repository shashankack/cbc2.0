# ADR 0005 — Excel import + clustering routes; restore QR boarding; no heavy ML

## Status

Accepted (owner direction, 2026-10-10)

## Context

The product pivots from student self-serve ranked preferences to an **admin-driven, batch/year planning** model closer to traditional college transport, plus **QR attendance** for boarding analytics. Heavy ML stays out; use **rule-based** inference.

## Decision

### Student onboarding
1. Admin uploads an Excel/CSV of students: Name, SRN, academic email, home/PG coordinates (and related fields as agreed).
2. System clusters nearby coordinates, computes **centroids** as candidate pick/drop stops.
3. Nearby centroids are ordered into **routes** (dynamic per planning batch / academic year).
4. After admin confirms the plan, each student’s pick/drop is **locked** (students cannot change it).
5. Bus(es) assigned to a route by **headcount vs capacity** using rule-based thresholds (not ML models).

### Sparse / outlier students (1–2 far from dense clusters)
Do **not** auto-create a dedicated route for tiny groups.
Policy (in order):
1. If within campus `max_walk_to_stop_m` of an existing centroid → **snap to nearest stop**.
2. Else mark status `needs_admin_review` and instruct student/admin contact (UI message).
3. Admin may **manually assign** an existing stop or **manually create** a stop, then attach to a route.

Clustering: prefer **DBSCAN** (or equivalent density clustering) so sparse points become **noise** → review queue, not fake micro-routes. Configure `min_samples` and `eps` per campus/batch.

### Centroid and route construction (MVP)
1. Cluster student points (Haversine or projected metres).
2. Centroid = mean lat/lng of cluster members (optionally snap to nearest road node later).
3. Build route stop order with a simple heuristic (e.g. nearest-neighbour from campus depot, or admin drag-reorder).
4. Estimate leg times with **road network** if available (OSRM); else Haversine × speed factor — label clearly.
5. Admin reviews map + stats, then confirms atomically.

### Maps / distance / time (MVP)
- UI maps: Leaflet + OpenStreetMap.
- **MVP metric:** distance + **approximate** travel time only (Haversine × speed factor, and/or static OSRM road time).
- **No live traffic** in MVP for centroids, route order, or ETAs.
- **Do not depend on Google Maps Platform for MVP.**
- Commute-time goal: minimize estimated (approx) route duration under capacity and max-walk constraints; admin can override.
- Traffic-aware routing is a future enhancement only.

### QR boarding (restored)
1. Assigned driver **manually starts** a trip session for their bus/route.
2. System shows a short-lived trip QR while the session is active.
3. Authenticated student scans → attendance/boarding marked once.
4. Driver **must manually end** the session; ending invalidates the QR and rejects further scans for that trip.
5. MVP does not auto-end sessions by timer alone (optional safety timeout may be added later; manual end remains required UX).
6. Aggregated boarding history may feed **rule-based** future planning analytics (counts, no-shows) — not a trained ML model in scope.

### Driver stop itinerary (in scope)
- Once the admin **finalizes/confirms** a route, the assigned driver can see stops in **sequence order**.
- When the driver **starts** the trip, the driver UI shows that ordered itinerary (list + map markers).
- Order is the confirmed `route_stops` sequence. No turn-by-turn navigation in MVP.

### Driver live location (in scope)
- During an **active** trip session only, the driver phone sends periodic GPS updates.
- Students on that trip/route can see the bus position in near real time.
- Ending the session stops sharing. No tracking when the session is not active.
- **Student phones are never tracked.**

### Driver distress / emergency reallocation (in scope)
1. Driver presses **Distress** on an active trip.
2. Backend immediately stores distress event + **current GPS**.
3. Compute:
   - `boarded` = distinct successful boarding records on this trip
   - `remaining_pickups` = assigned students on this route/trip without boarding
   - seats/capacity still needed (policy: prioritize remaining pickups; optionally also plan rescue capacity for boarded passengers)
4. Select available buses by rules (status available, capacity, optionally nearest to distress coords using distance/approx time — **no traffic**).
5. Build emergency allocation covering remaining stops/students; notify admin for **quick-confirm** (audited). Auto-apply-only-on-distress may be enabled for demo if explicitly configured.
6. No heavy ML.

### Still out of scope
- Heavy ML / neural demand models.
- Student self-serve changing pick/drop after lock.
- Student GPS tracking / geofencing of students.
- Live traffic-aware centroid optimization.

## Consequences
- Supersedes student ranked-preference + student map-click matching as the primary planning path.
- Supersedes ADR 0004’s removal of QR (QR restored); ML remains removed.
- Update PROJECT_REQUIREMENTS, data model, acceptance criteria, demos.
