# Frontend — College Bus System

Next.js App Router + TypeScript + Material UI (no Tailwind).

## Run

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Layout

| Path | Purpose |
|------|---------|
| `app/` | Routes and layouts |
| `theme/` | MUI theme + `ThemeRegistry` |
| `components/` | Shared UI primitives |
| `features/` | Domain feature modules |
| `lib/` | API client helpers |
| `types/` | Shared API types |

## Env

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Canonical product/UI docs: [../docs/ui-ux/DESIGN_SYSTEM.md](../docs/ui-ux/DESIGN_SYSTEM.md).
