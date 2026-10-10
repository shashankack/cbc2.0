# Test plan

Minimum coverage areas (see requirements §14):

## Authentication and tenancy

- OTP expiry and reuse rejected
- OTP attempt throttling
- Unapproved domain cannot authenticate into a college
- Cross-college access blocked
- Users cannot self-grant roles

## Campus and stop matching

- Missing walking-distance setting blocks allocation
- Campus settings do not leak across campuses
- Map clicks do not create stops
- Invalid coordinates handled

## Allocation

- Capacity never exceeded
- Scarcity-first ordering is deterministic
- Admin confirmation revalidates and is atomic

## Disruption and boarding

- Bus failure creates a proposal, not silent reassignment
- QR expiry / wrong trip / duplicates rejected
- Boarding uniqueness on `(trip_id, student_id)`

## ML

- Missing ML service does not break core features
- Synthetic output clearly labelled
