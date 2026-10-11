# API contract

## Conventions

- Prefix: `/api/v1`
- JSON request/response payloads
- Field names: `snake_case`
- IDs: UUID strings
- Timestamps: ISO 8601 with timezone
- Status fields: explicit enums
- Auth: HTTP-only session cookie (`cbc_session`)
- Never trust client-supplied `college_id` / role / student_id / driver_id

## Error shape

```json
{
  "error": {
    "code": "EXAMPLE_CODE",
    "message": "Human-readable explanation."
  }
}
```

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 422 | Invalid body/query invalid |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `NOT_FOUND` | 404 | Resource missing or outside tenant |
| `CONFLICT` | 409 | Uniqueness / state conflict |
| `DATABASE_UNAVAILABLE` | 503 | DB not reachable |

## Implemented

### Health / auth / tenancy

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | none |
| GET | `/ready` | none |
| POST | `/auth/otp/request` | public |
| POST | `/auth/otp/verify` | public → sets cookie |
| POST | `/auth/logout` | session |
| GET | `/auth/me` | session |
| POST | `/operator/college-applications` | public |
| GET | `/operator/college-applications` | operator |
| POST | `/operator/college-applications/{id}/approve` | operator |
| POST | `/operator/college-applications/{id}/reject` | operator |
| POST | `/colleges/{college_id}/domains` | college_admin |
| GET | `/operator/domains` | operator | List domains (`?status=pending` default; empty = all) |
| POST | `/operator/domains/{id}/approve` | operator |
| POST | `/operator/domains/{id}/reject` | operator | Optional `{ notes }` |
| GET/POST | `/colleges/{college_id}/campuses` | college_admin | Create accepts optional `lat`/`lng` (depot). Required before planning. |
| PATCH | `/colleges/{college_id}/campuses/{campus_id}` | college_admin | Update name and/or depot `lat`/`lng` |
| PUT | `/colleges/{college_id}/campuses/{campus_id}/settings` | college_admin |

### Fleet / import / planning

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET/POST | `/colleges/{college_id}/buses` | college_admin | List / create buses (`driver_email`, campus labels on list) |
| PATCH | `/colleges/{college_id}/buses/{bus_id}` | college_admin | Status (`available` \| `unavailable` for maintenance/out of service), capacity, driver (`driver_email` or `clear_driver`). `in_service` is trip-managed. |
| GET/POST | `/colleges/{college_id}/drivers` | college_admin | List / add driver roster (email → membership) |
| POST | `/colleges/{college_id}/imports/students` | college_admin | Excel/CSV upload (`multipart`: `campus_id`, `file`) |
| GET | `/colleges/{college_id}/imports/students` | college_admin | List import batches (`?campus_id=`, `?active_only=`). Includes campus labels, `active_student_count` / `locked_student_count`, `is_active` (completed + unlocked students). |
| GET | `/colleges/{college_id}/imports/students/{batch_id}` | college_admin | Import batch status (+ active/locked counts) |
| GET | `/colleges/{college_id}/students` | college_admin | List students |
| POST | `/colleges/{college_id}/planning-runs` | college_admin | Cluster + route + bus proposal |
| GET | `/colleges/{college_id}/planning-runs` | college_admin | List runs |
| GET | `/colleges/{college_id}/planning-runs/{run_id}` | college_admin | Run detail |
| POST | `/colleges/{college_id}/planning-runs/{run_id}/confirm` | college_admin | Lock allocations |
| POST | `/colleges/{college_id}/planning-runs/{run_id}/items/{item_id}/assign-stop` | college_admin | Resolve `needs_admin_review` onto a stop (+ optional route/bus) |
| POST | `/colleges/{college_id}/planning-runs/{run_id}/stops` | college_admin | Create manual stop (`name`, `lat`, `lng`, optional `route_id` to append on that route) |
| POST | `/colleges/{college_id}/planning-runs/{run_id}/stops/merge` | college_admin | Merge two non-campus stops (`keep_stop_id`, `merge_stop_id`) |
| POST | `/colleges/{college_id}/planning-runs/{run_id}/stops/split` | college_admin | Split students onto new stop (`stop_id`, `name`, `lat`, `lng`, `student_ids`) |
| PUT | `/colleges/{college_id}/planning-runs/{run_id}/routes/{route_id}/stops` | college_admin | Reorder pickup stops (`stop_ids`; campus bookends applied server-side) |
| GET | `/colleges/{college_id}/me/allocation` | student/admin | Locked assignment (+ stop/route/bus labels) |
| GET | `/colleges/{college_id}/me/active-trip` | student/admin | Active trip for the student’s allocated bus |
| GET | `/colleges/{college_id}/emergency-reallocations` | college_admin | List plans (`?status=proposed` default). `plan_json.replacement_buses[].distance_m_approx` is straight-line proximity. |
| GET | `/colleges/{college_id}/analytics/attendance` | college_admin | Boarded vs assigned counts per trip |
| POST | `/colleges/{college_id}/buses/{bus_id}/disruption-proposal` | college_admin | Mark unavailable + propose reassignment (`kind: disruption`; confirm via emergency) |

### Trips / QR / location / distress

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/colleges/{college_id}/me/driver-duty` | driver | Today's auto assignment (bus + route + trip flags) |
| POST | `/colleges/{college_id}/me/driver-duty/start` | driver | Auto-schedule if needed, start trip, return QR + itinerary (`started_at` logged) |
| POST | `/colleges/{college_id}/me/driver-duty/end` | driver | End active trip (`ended_at` logged) |
| GET | `/colleges/{college_id}/trips` | driver or college_admin | List trips (`?status=` optional; includes start/end/duration for analytics) |
| POST | `/colleges/{college_id}/trips` | driver or college_admin | Create scheduled trip (optional; planning confirm auto-schedules) |
| POST | `/colleges/{college_id}/trips/{trip_id}/start` | driver | Start session + QR + itinerary |
| POST | `/colleges/{college_id}/trips/{trip_id}/qr/refresh` | driver | New QR token |
| POST | `/colleges/{college_id}/trips/{trip_id}/end` | driver | End session (invalidates QR) |
| GET | `/colleges/{college_id}/trips/{trip_id}/itinerary` | driver/admin/student | Ordered stops |
| POST | `/colleges/{college_id}/trips/{trip_id}/location` | driver | GPS ping (active only) |
| GET | `/colleges/{college_id}/trips/{trip_id}/location` | driver/admin/student | Last known position |
| POST | `/colleges/{college_id}/trips/{trip_id}/board` | student | Scan QR → attendance |
| POST | `/colleges/{college_id}/trips/{trip_id}/distress` | driver | Distress + emergency plan |
| POST | `/colleges/{college_id}/emergency-reallocations/{id}/confirm` | college_admin | Confirm emergency plan |

### Local notes

- Bootstrap operator: `BOOTSTRAP_OPERATOR_EMAIL` (default `operator@example.com`).
- Dev OTP codes logged at WARNING on the API process.
- DNS TXT: omit `DNS_VERIFY_ENABLED` → auto-enabled when `APP_ENV=production`; set `DNS_VERIFY_ENABLED=false` to skip (typical for local/dev).
- Import requires active domain + campus settings.
- Planning: Haversine DBSCAN → centroid stops (reverse-geocoded names) → link closest centroids into route chains → NN + 2-opt order → capacity packing; campus depot bookends each route (no ML / no traffic). Admin may merge/split/reorder/add stops before confirm.
- Boarding QR payload: `CBC1:<trip_id>|<qr_token>` (student camera or paste).

## Out of scope

- No ML / demand endpoints
- No GraphQL

## Related docs

- Features: [../requirements/FEATURES.md](../requirements/FEATURES.md)
- Data model: [../architecture/DATA_MODEL.md](../architecture/DATA_MODEL.md)
- Clustering: [../architecture/ROUTING_AND_CLUSTERING.md](../architecture/ROUTING_AND_CLUSTERING.md)
