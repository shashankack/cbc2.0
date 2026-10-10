# API contract (draft)

## Conventions

- Prefix: `/api/v1`
- JSON request/response payloads
- `snake_case` field names
- ISO 8601 timestamps with timezone
- Explicit status enums
- Pydantic validation on the backend
- FastAPI OpenAPI documentation

## Error shape

```json
{
  "error": {
    "code": "EXAMPLE_CODE",
    "message": "Human-readable explanation."
  }
}
```

## Authorization rules

- Never trust client-supplied `college_id`, role, student ID, driver ID, allocation status, or capacity as authorization proof.
- Derive actor identity and role from the authenticated server-side session/token.
- Check tenant scope on every tenant-owned read and write.
- Do not return OTP hashes, QR token hashes, or internal credentials.

## Endpoint inventory

Filled from Stage 4 onward. Health check (Stage 2): `GET /api/v1/health`.
