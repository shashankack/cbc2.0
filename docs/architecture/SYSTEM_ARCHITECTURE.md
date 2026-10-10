# System architecture

```text
Next.js + TypeScript + MUI
  ├── Student portal
  ├── College admin portal
  ├── Platform operator portal
  └── Driver portal
           |
           | HTTPS REST /api/v1
           v
FastAPI
  ├── Authentication and authorization
  ├── College/domain onboarding
  ├── Campus, bus, route and stop management
  ├── Preferences and stop matching
  ├── Rule-based allocation
  ├── Allocation review/confirmation
  ├── Reassignment proposals
  ├── Trips and QR boarding
  ├── Audit logging
  └── Optional demand-prediction client
           |
           +--> PostgreSQL (+ PostGIS if available)
           +--> ml-service (optional; graceful fallback)
```

## Ownership boundaries

- Database records and backend business logic are authoritative.
- Frontend validation is for usability only.
- Do not duplicate allocation, authorization, capacity, tenant, or QR rules in the frontend.
- ML must use an explicitly defined input/output contract and must never allocate seats.
