# Security notes

- Email OTP: short expiry, rate limits, one-time use, store hashes — never log codes.
- Never log OTP codes or session secrets.
- Prefer secure HTTP-only cookies for sessions; configure SameSite and CSRF appropriately.
- Use HTTPS in deployed environments.
- Apply role-based authorization and tenant scoping on every protected operation.
- Verify college domain DNS ownership and require platform operator approval.
- Do not infer student enrollment solely from an email-domain match.
- Derive student identity from the authenticated session; reject client-supplied identity claims.
- Audit administrative changes without recording secrets.
- Do not implement student GPS tracking or continuous student location.
- Driver GPS may be collected **only during an active trip session**, used to show bus position to authorized students/admins; stop on session end; do not retain high-frequency trails longer than needed for the demo/ops window.
- Use synthetic demo data only; never commit real student PII.

## Note

- QR boarding is **in scope** (hash tokens; uniqueness on boarding).
- **No ML service** — do not add ML credentials or prediction endpoints.
