"""Optional ML demand-prediction service (Stage 1 scaffold)."""

from fastapi import FastAPI

app = FastAPI(
    title="College Bus Demand Prediction",
    version="0.1.0",
)


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ml"}
