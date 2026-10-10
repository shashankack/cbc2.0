# Security notes

- Email OTP: short expiry, limited attempts, rate limits, one-time use, store hashes not plaintext codes.
- Never log OTP codes, session secrets, or QR token secrets.
- Prefer secure HTTP-only cookies for sessions; configure SameSite and CSRF appropriately.
- Use HTTPS in deployed environments.
- Apply role-based authorization and tenant scoping on every protected operation.
- Verify college domain DNS ownership and require platform operator approval.
- Do not infer student enrollment solely from an email-domain match.
- QR tokens: random, short-lived, trip-specific, revocable; store hashes only.
- Derive student identity from the authenticated session; reject client-supplied identity claims.
- Prevent duplicate boarding with a database uniqueness constraint.
- Audit administrative changes without recording secrets.
- Do not implement student GPS tracking.
- Use synthetic demo data only; never commit real student PII.
