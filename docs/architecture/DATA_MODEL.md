# Data model

API surface: [../api/API_CONTRACT.md](../api/API_CONTRACT.md).

Use UUIDs. Tenant-owned tables carry `college_id` where appropriate.

## Stage 3 — Tenant foundation (implement now)

| Table | Purpose | Key fields / constraints |
|-------|---------|---------------------------|
| `users` | Global login identity | `id`, `email` (unique, normalized lowercase), `full_name`, `is_platform_operator`, `created_at` |
| `college_applications` | Operator onboarding queue | `id`, `college_name`, `slug`, `applicant_email`, `status` (`pending`/`approved`/`rejected`), timestamps |
| `colleges` | Tenant workspace | `id`, `name`, `slug` (unique), `status` (`active`/`suspended`), `created_at` |
| `college_domains` | Verified email domains | `id`, `college_id`, `domain` (unique when active), `dns_txt_token`, `dns_verified_at`, `status` (`pending`/`active`/`rejected`) |
| `college_memberships` | User↔college role | `id`, `college_id`, `user_id`, `role` (`college_admin`/`student`/`driver`), unique `(college_id, user_id, role)` |
| `campuses` | Campus under a college | `id`, `college_id`, `name`, `code`, unique `(college_id, code)` |
| `campus_settings` | Per-campus planning knobs | `id`, `college_id`, `campus_id` (unique with college), `max_walk_to_stop_m`, `cluster_eps_m`, `cluster_min_samples`, `min_students_per_route` |
| `otp_challenges` | Email OTP | `id`, `email`, `code_hash`, `expires_at`, `attempts`, `consumed_at` |

Cross-college FKs must not allow a campus/domain/membership to reference another college’s rows (enforce `college_id` consistency in app + DB checks where practical).

## Later stages (do not implement yet)

- `buses`, `routes`, `stops`, `route_stops`
- `students`, import batches/rows
- `planning_runs`, `planning_run_items`, `allocations`
- `trips`, `trip_qr_tokens`, `boarding_records`, `trip_location_pings`
- `distress_events`, `emergency_reallocations`
- `audit_logs`

## Important constraints (product-wide)

- Normalized email uniqueness on `users`.
- College slug uniqueness.
- Exact active domain uniqueness.
- Unique `(college_id, campus_id)` campus setting.
- A campus must have valid settings before planning/allocation is enabled.
- Capacity enforced transactionally on plan confirm (later).
- Unique `(trip_id, student_id)` boarding (later).

See [ROUTING_AND_CLUSTERING.md](./ROUTING_AND_CLUSTERING.md).
