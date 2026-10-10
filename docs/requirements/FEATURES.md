# Final MVP feature list

Canonical product narrative: [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md) · decisions: [SCOPE_DECISIONS.md](./SCOPE_DECISIONS.md)

## In scope

1. Bus management (capacity, status, mark unavailable)
2. Admin Excel/CSV student intake (Name, SRN, academic email, home/PG coords)
3. Cluster → centroid stops → dynamic routes (admin merge/split/reorder/manual stops)
4. Sparse/outlier handling (snap or admin review; no micro-routes for 1–2 students)
5. Rule-based bus assignment by headcount vs capacity
6. Admin plan review + atomic confirmation → student pick/drop **locked**
7. Non-emergency disruption reassignment (proposal → admin approval)
8. Driver distress → capture GPS → boarded vs remaining pickups → dynamic available-bus plan → admin quick-confirm
9. QR boarding/attendance (driver **manual start** + **manual end**)
10. Driver ordered stop itinerary (after finalize; shown on trip start)
11. Driver-phone live location while trip active (students see bus on map)
12. Multi-college tenancy + platform operator college approval
13. Verified email domains (DNS + operator approval)
14. Campus settings (max walk, cluster params)
15. Map UI (Leaflet + OSM); planning uses **distance + approx time** only
16. Student OTP login; view locked assignment; live bus; scan QR
17. Simple rule-based attendance analytics (not ML)

## Roles

Platform operator · College admin · Student · Driver

## Out of scope

- Any ML / `ml-service` / `feat/ml-demand-forecast`
- Student self-editing pick/drop after lock
- Student GPS tracking
- Live traffic
- Google Maps as hard dependency
- Turn-by-turn navigation
- Push/SMS, native apps (deferred)
