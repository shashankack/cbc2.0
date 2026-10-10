# Data model (draft)

API surface: [../api/API_CONTRACT.md](../api/API_CONTRACT.md).

Use UUIDs. Tenant-owned tables carry `college_id`.

## Suggested entities

- `colleges`, `college_domains`, `users`, `college_memberships`, `otp_challenges`, `college_applications`
- `campuses`, `campus_settings` (max walk, cluster `eps_m`, `min_samples`, etc.)
- `buses`, `routes`, `stops`, `route_stops`
- `students` (SRN, email, locked stop/route after confirm)
- `student_import_batches`, `student_import_rows`
- `planning_runs` (cluster/route/bus proposals), `planning_run_items`
- `allocations` (confirmed seat/route/stop assignment)
- `trips` (status: e.g. `scheduled` / `active` / `ended`; `started_at` / `ended_at`; ended only via driver action)
- `trip_qr_tokens`, `boarding_records` (attendance)
- `trip_location_pings` (or last-known fields on `trips`: lat, lng, recorded_at) — **driver device only**, while trip is active
- `distress_events` (trip_id, bus_id, lat, lng, recorded_at, status)
- `emergency_reallocations` / reassignment proposals linked to distress (suggested buses, remaining students/stops, admin confirm)
- `audit_logs`

## Important constraints

- Unique SRN / email within college scope as defined.
- One active locked stop/route assignment per student per planning period.
- Capacity enforced transactionally on confirm.
- Unique `(trip_id, student_id)` boarding/attendance.
- A trip accepts boarding scans only while `active`; after manual end, scans are rejected.
- Outliers may sit in `needs_admin_review` until resolved.

See [ROUTING_AND_CLUSTERING.md](./ROUTING_AND_CLUSTERING.md).
