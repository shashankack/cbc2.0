# ADR 0004 — Remove QR boarding and all ML

## Status

Accepted

## Context

Owner reduced scope for the hackathon: QR boarding and related driver/trip flows add complexity without being required by the official problem statement. ML demand prediction is also not required and must not be part of the product.

## Decision

1. Remove QR boarding confirmation, trip QR tokens, boarding records, driver portal, and student QR scan.
2. Remove the ML service, demand-prediction API, and any ML-related demo claims.
3. Keep capacity-aware allocation, admin batch confirm, preferences, map stop matching, disruption reassignment, and multi-college tenancy.

## Consequences

- Do not implement `trips` / `trip_qr_tokens` / `boarding_records` for boarding.
- Do not maintain or depend on `ml-service/` for the product (folder may remain unused/retired).
- Retire teammate work on `feat/ml-demand-forecast` for product features.
- Update demos to end at allocation confirm + disruption reassignment + tenant isolation.
