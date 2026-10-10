# Backend (FastAPI)

Core API for CBC 2.0. No ML service.

## Run

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # edit DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/api/v1/health  
- Ready (DB): http://localhost:8000/api/v1/ready  
- OpenAPI: http://localhost:8000/docs  

## Layout

```text
app/
  api/v1/     route handlers
  core/       settings, errors
  db/         engine, session, Base
  models/     SQLAlchemy models (Stage 3+)
  schemas/    Pydantic schemas
  services/   business logic
```
