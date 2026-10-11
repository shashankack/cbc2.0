# Data model

API surface: [../api/API_CONTRACT.md](../api/API_CONTRACT.md).

Use UUIDs. Tenant-owned tables carry `college_id` where appropriate.

## Stage 3 — Tenant foundation (done)

| Table | Purpose |
|-------|---------|
| `users`, `college_applications`, `colleges`, `college_domains`, `college_memberships` | Tenancy + roles |
| `campuses`, `campus_settings` | Campus + depot `lat`/`lng` + planning knobs |
| `otp_challenges`, `auth_sessions` | Auth |

## Stage 4 — Fleet, import, planning (implement now)

| Table | Purpose | Key fields / constraints |
|-------|---------|---------------------------|
| `buses` | Fleet | `college_id`, `campus_id`, `registration_number`, `capacity`, `status` (`available`/`unavailable`/`in_service`), `driver_user_id` nullable; unique `(college_id, registration_number)` |
| `student_import_batches` | Excel/CSV upload | `college_id`, `campus_id`, `uploaded_by_user_id`, `filename`, `status`, counts |
| `student_import_rows` | Per-row validation | `batch_id`, `row_number`, `status` (`valid`/`invalid`), `error_message`, `student_id` |
| `students` | Imported students | `college_id`, `campus_id`, `user_id`, `srn`, `email`, `full_name`, `home_lat`, `home_lng`, `status` (`imported`/`needs_admin_review`/`allocated`/`locked`); unique `(college_id, srn)`, `(college_id, email)` |
| `planning_runs` | Cluster/route proposal | `college_id`, `campus_id`, `import_batch_id`, `status` (`draft`/`proposed`/`confirmed`/`cancelled`) |
| `stops` | Pick/drop points | `college_id`, `campus_id`, `name`, `lat`, `lng`, `source` (`cluster`/`manual`/`campus`), `planning_run_id` |
| `routes` | Ordered stop groups | `college_id`, `campus_id`, `name`, `status` (`draft`/`confirmed`), `planning_run_id`; `route_stops` bookend campus depot |
| `route_stops` | Ordered itinerary | `college_id`, `route_id`, `stop_id`, `sequence`; unique `(route_id, sequence)` |
| `planning_run_items` | Per-student proposal | `planning_run_id`, `student_id`, `stop_id`, `route_id`, `bus_id`, `status` (`proposed`/`snapped`/`needs_admin_review`/`confirmed`) |
| `allocations` | Locked assignment after confirm | `college_id`, `planning_run_id`, `student_id` unique active, `stop_id`, `route_id`, `bus_id` |

## Stage 5 — Trips / QR / location / distress (implement with Stage 4 APIs)

| Table | Purpose | Key fields / constraints |
|-------|---------|---------------------------|
| `trips` | Driver session | `college_id`, `route_id`, `bus_id`, `driver_user_id`, `status` (`scheduled`/`active`/`ended`), `started_at`, `ended_at`, last location fields |
| `trip_qr_tokens` | Active QR | `trip_id`, `token_hash`, `expires_at`, `revoked_at` |
| `boarding_records` | Attendance | unique `(trip_id, student_id)` |
| `trip_location_pings` | Driver GPS history | `trip_id`, `lat`, `lng`, `recorded_at` |
| `distress_events` | Distress press | `trip_id`, `bus_id`, `lat`, `lng`, `status` (`open`/`resolved`) |
| `emergency_reallocations` | Distress plan | `distress_event_id`, `status` (`proposed`/`confirmed`/`cancelled`), `plan_json` |

Cross-college FKs must not allow rows to reference another college’s entities.

## Important constraints (product-wide)

- Normalized email uniqueness on `users`.
- College slug uniqueness; active domain uniqueness.
- Campus settings required before planning.
- Capacity enforced transactionally on plan confirm.
- Unique `(trip_id, student_id)` boarding.
- QR valid only while trip is `active`.

See [ROUTING_AND_CLUSTERING.md](./ROUTING_AND_CLUSTERING.md).
