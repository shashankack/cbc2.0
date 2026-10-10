# System architecture

```text
Next.js + TypeScript + MUI
  ├── Student portal (assignment, live bus map, scan QR)
  ├── College admin portal (Excel import, clusters, routes, confirm)
  ├── Platform operator portal
  └── Driver portal (ordered stops + trip session + QR + GPS pings + manifest)
           |
           | HTTPS REST /api/v1 (poll or short-lived stream for location)
           v
FastAPI
  ├── Auth / tenancy / domains
  ├── Student import + clustering + route proposals
  ├── Rule-based bus assignment + admin confirm
  ├── Disruption reassignment proposals
  ├── Trips, QR tokens, boarding/attendance
  ├── Driver location pings (active trip only) → student map read API
  └── Audit + simple attendance analytics
           |
           v
PostgreSQL (+ optional OSRM sidecar for road times)
```

**Live tracking:** driver phone → backend while trip `active`; students read latest position. No student GPS. No heavy ML.

See [ROUTING_AND_CLUSTERING.md](./ROUTING_AND_CLUSTERING.md).
