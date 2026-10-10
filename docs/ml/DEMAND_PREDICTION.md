# Demand prediction (ML contract)

The ML teammate works in `ml-service/` on `feat/ml-demand-forecast`.

## Endpoint

`GET /api/v1/analytics/demand?campus_id=...&route_id=...&date=...&time_slot=...`

## Response shape

```json
{
  "campus_id": "example-campus-id",
  "route_id": "example-route-id",
  "date": "2026-10-10",
  "time_slot": "08:00-09:00",
  "predicted_demand": 72,
  "available_capacity": 50,
  "estimated_shortage": 22,
  "data_source": "synthetic_demo",
  "model_version": "baseline-v1",
  "metric": {
    "name": "MAE",
    "value": null
  }
}
```

## Rules

- Label synthetic-data predictions as demonstrations.
- If no valid evaluation set exists, leave the metric unavailable rather than inventing it.
- ML forecasts must never override hard allocation constraints.
- Core allocation must work if the ML service is unavailable.
