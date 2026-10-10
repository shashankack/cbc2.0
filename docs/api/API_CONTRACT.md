# API contract

## Conventions

- Prefix: `/api/v1`
- JSON request/response payloads
- Field names: `snake_case`
- IDs: UUID strings
- Timestamps: ISO 8601 with timezone (e.g. `2026-10-10T15:30:00+05:30`)
- Status fields: explicit enums (never free-text)
- Validation: Pydantic on backend; FastAPI OpenAPI at `/docs`
- Auth (from OTP step onward): HTTP-only session cookie (`cbc_session`); never trust client-supplied `college_id` / role / student_id / driver_id

## Error shape

```json
{
  "error": {
    "code": "EXAMPLE_CODE",
    "message": "Human-readable explanation."
  }
}
```

Common codes (extend as needed):

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 422 | Request body/query invalid |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `NOT_FOUND` | 404 | Resource missing or outside tenant |
| `CONFLICT` | 409 | Uniqueness / state conflict |
| `DATABASE_UNAVAILABLE` | 503 | DB not reachable |

## Authorization rules

- Never trust client-supplied `college_id`, role, student ID, driver ID, allocation status, or capacity as authorization proof.
- Derive actor identity and role from the authenticated server-side session/token.
- Check tenant scope on every tenant-owned read and write.
- Do not return OTP hashes, QR token hashes, or internal credentials.

## Implemented

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/health` | none | Liveness |
| GET | `/api/v1/ready` | none | Readiness (`database: true/false`) |
| POST | `/api/v1/operator/college-applications` | public | Submit college application |
| GET | `/api/v1/operator/college-applications` | operator | List applications |
| POST | `/api/v1/operator/college-applications/{id}/approve` | operator | Approve + appoint admin |
| POST | `/api/v1/operator/college-applications/{id}/reject` | operator | Reject |
| POST | `/api/v1/colleges/{college_id}/domains` | college_admin | Request domain |
| POST | `/api/v1/operator/domains/{id}/approve` | operator | Approve domain (DNS check if enabled) |
| GET | `/api/v1/colleges/{college_id}/campuses` | college_admin | List campuses |
| POST | `/api/v1/colleges/{college_id}/campuses` | college_admin | Create campus |
| PUT | `/api/v1/colleges/{college_id}/campuses/{campus_id}/settings` | college_admin | Walking/cluster settings |
| POST | `/api/v1/auth/otp/request` | public | Request email OTP |
| POST | `/api/v1/auth/otp/verify` | public | Verify OTP → session cookie |
| POST | `/api/v1/auth/logout` | session | Clear session |
| GET | `/api/v1/auth/me` | session | Current user + memberships |

### Local auth notes

- Bootstrap platform operator: set `BOOTSTRAP_OPERATOR_EMAIL` (default `operator@example.com`). First successful OTP login for that email sets `is_platform_operator`.
- Development: OTP codes are logged to the API process (WARNING), not returned in the HTTP response.
- `DNS_VERIFY_ENABLED=false` (default) skips live DNS TXT checks so domain approval works locally.

## Planned (later)

### C — Fleet / planning / trips

Documented when we reach those stages: buses, Excel import, planning runs, allocations, trips, QR, location, distress.

## Out of scope

- No ML / demand endpoints
- No GraphQL

## Related docs

- Features: [../requirements/FEATURES.md](../requirements/FEATURES.md)
- Data model: [../architecture/DATA_MODEL.md](../architecture/DATA_MODEL.md)
- OpenAPI: run backend → `/openapi.json` (stub also at [../../openapi.yaml](../../openapi.yaml))
