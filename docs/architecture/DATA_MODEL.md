# Data model (draft)

Use UUIDs or another consistent non-guessable identifier strategy. Every tenant-owned table should carry `college_id` where appropriate.

## Suggested entities

- `colleges`
- `college_domains`
- `users`
- `college_memberships`
- `otp_challenges`
- `college_applications`
- `campuses`
- `campus_settings`
- `buses`
- `routes`
- `stops`
- `route_stops`
- `student_preferences`
- `allocations`
- `allocation_runs`
- `allocation_run_items`
- `trips`
- `trip_qr_tokens`
- `boarding_records`
- `audit_logs`

## Important constraints

- Normalized email uniqueness.
- College slug uniqueness.
- Exact active domain uniqueness.
- Unique route stop sequence within a route.
- Bus registration uniqueness within college/campus scope.
- One active allocation per student in the defined allocation scope.
- Unique `(college_id, campus_id)` campus setting.
- Campus must belong to the same college as its setting.
- A campus must have a valid walking-distance setting before allocation is enabled.
- Capacity must be enforced transactionally.
- Unique `(trip_id, student_id)` boarding record.

Authoritative schema detail lands in Stage 3. Do not implement conflicting schemas elsewhere.
