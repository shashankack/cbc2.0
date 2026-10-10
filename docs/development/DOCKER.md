# Docker (local Postgres)

We use Docker **only for PostgreSQL** in local development. The FastAPI app and Next.js app still run on the host (easier debugging while learning).

## Prerequisites

- Docker Desktop running (Windows)
- `docker` and `docker compose` available in a terminal

## Start / stop

From repo root `c:\crucifer\CBC`:

```powershell
docker compose up -d
docker compose ps
docker compose logs -f db
# Ctrl+C to stop following logs (DB keeps running)

docker compose stop
docker compose down          # stop + remove container (keeps volume)
docker compose down -v       # ALSO deletes DB data volume — careful
```

## Connection

Copy `.env.example` → `.env` at the repo root and set `POSTGRES_PASSWORD` (required by compose). Use the same password in `backend/.env` `DATABASE_URL`.

| Setting | Value |
|---------|--------|
| Host | `localhost` |
| Port | `5432` |
| User | from `POSTGRES_USER` (default `postgres`) |
| Password | from `POSTGRES_PASSWORD` (required) |
| Database | from `POSTGRES_DB` (default `college_bus`) |

`backend/.env` (use `pg8000` on Windows if App Control blocks `psycopg` DLLs):

```env
DATABASE_URL=postgresql+pg8000://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/college_bus
```

## Verify

```powershell
docker compose exec db psql -U postgres -d college_bus -c "SELECT 1;"
curl http://localhost:8000/api/v1/ready
```

When the API is running, ready should show `"database": true`.
