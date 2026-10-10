# Security policy

**Canonical notes:** [docs/security/SECURITY_NOTES.md](../docs/security/SECURITY_NOTES.md)

## Non-negotiables

1. OTP: short expiry, rate limits, one-time use, store hashes — never log codes.
2. Sessions: prefer HTTP-only cookies; SameSite + CSRF as appropriate; HTTPS in deploy.
3. Authorization: derive identity/role from server session; tenant-scope every protected op.
4. Domains: DNS TXT proof + platform operator approval; domain match ≠ enrollment proof.
5. QR boarding: random short-lived trip tokens; store hashes; student ID from session only; unique `(trip_id, student_id)`.
6. No student GPS tracking / continuous location collection.
7. Synthetic demo data only — no real PII in the repo.
8. Never commit `.env`, secrets, or credentials.
