# ML demand prediction service

Optional service that forecasts demand by campus, route, and time slot.

- Must label synthetic data clearly (`data_source`).
- Must never allocate seats or mutate core records.
- Core backend must continue if this service is unavailable.

Contract: [../docs/ml/DEMAND_PREDICTION.md](../docs/ml/DEMAND_PREDICTION.md)

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Branch: `feat/ml-demand-forecast`
