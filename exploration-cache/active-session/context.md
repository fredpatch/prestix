## Where we left off

Sprint 0 is now closed and key Sprint 1 backend modules are committed.
Recent infrastructure and pre-flight work moved prior blockers to resolved state.

## What's in scope today

Cache sync after schema/infra/pre-flight updates.

## State of the codebase

Backend has working Express routes for bootstrap, auth, users, and settings,
with JWT cookie auth, RBAC middleware, and default settings seed.
Client remains mostly scaffold-level (placeholder App/Login, axios stub).

Validation snapshot (2026-07-12):

- Docker stack is up in dev context (validated by successful `docker compose exec api ...` pre-flight run).
- Puppeteer PDF pre-flight passed (`docker compose exec api npm run preflight:pdf`, exit 0).
- Drizzle schema gaps found during audit were fixed.
- Mongo->PG migration schema mapping spike documented in cache technical notes.
- `npm run dev` in `packages/server` exited 130 (manual interrupt), not treated as a functional blocker.

## Key constraints active right now

- npm workspaces, run scripts from within each package
- Windows MINGW64 dev environment
- Health check is /api/health (not /health)
- Migration dry-run is blocked until Beta production data access is available
