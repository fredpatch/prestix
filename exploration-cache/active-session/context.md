## Where we left off

Sprint 0 is closed and Sprint 1 backend foundations are in place.
Client-side Sprint 1 wiring advanced with bootstrap gating, first-run init screen,
auth flow polish, and initial settings management screens.

## What's in scope today

Cache/task sync after Sprint 1 client implementation updates.

## State of the codebase

Backend has working Express routes for bootstrap, auth, users, and settings,
with JWT cookie auth, RBAC middleware, and default settings seed.
Client now includes bootstrap-status route gating in App routing, a dedicated
bootstrap initialization page, upgraded login/set-password UX, and a settings page
that consumes settings/feature-flags/commission-catalog APIs.

Validation snapshot (2026-07-13):

- Docker stack is up in dev context (validated by successful `docker compose exec api ...` pre-flight run).
- Puppeteer PDF pre-flight passed (`docker compose exec api npm run preflight:pdf`, exit 0).
- Drizzle schema gaps found during audit were fixed.
- Mongo->PG migration schema mapping spike documented in cache technical notes.
- `npm run dev` in `packages/server` exited 130 (manual interrupt), not treated as a functional blocker.
- `packages/client` dependencies installed successfully (`npm i`, exit 0).

## Key constraints active right now

- npm workspaces, run scripts from within each package
- Windows MINGW64 dev environment
- Health check is /api/health (not /health)
- Migration dry-run is blocked until Beta production data access is available
