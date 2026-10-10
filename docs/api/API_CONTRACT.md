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
| POST | `/operator/domains/{id}/approve` | operator |
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
| GET | `/colleges/{college_id}/imports/students` | college_admin | List import batches (`?campus_id=` optional) |
| GET | `/colleges/{college_id}/imports/students/{batch_id}` | college_admin | Import batch status |
| GET | `/colleges/{college_id}/students` | college_admin | List students |
| POST | `/colleges/{college_id}/planning-runs` | college_admin | Cluster + route + bus proposal |
| GET | `/colleges/{college_id}/planning-runs` | college_admin | List runs |
| GET | `/colleges/{college_id}/planning-runs/{run_id}` | college_admin | Run detail |
| POST | `/colleges/{college_id}/planning-runs/{run_id}/confirm` | college_admin | Lock allocations |
| GET | `/colleges/{college_id}/me/allocation` | student/admin | Locked assignment (+ stop/route/bus labels) |

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
- `DNS_VERIFY_ENABLED=false` skips live DNS TXT checks.
- Import requires active domain + campus settings.
- Planning uses Haversine DBSCAN + nearest-neighbour route order + capacity packing (no ML / no traffic).

## Out of scope

- No ML / demand endpoints
- No GraphQL

## Related docs

- Features: [../requirements/FEATURES.md](../requirements/FEATURES.md)
- Data model: [../architecture/DATA_MODEL.md](../architecture/DATA_MODEL.md)
- Clustering: [../architecture/ROUTING_AND_CLUSTERING.md](../architecture/ROUTING_AND_CLUSTERING.md)
