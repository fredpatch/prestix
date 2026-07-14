## Where we left off

Sprint 1 is now closed in task tracking after end-to-end runtime checks and
typecheck cleanup.

## What's in scope today

Cache/task sync after Sprint 5 penalties/creances backend draft.

## State of the codebase

Backend has working Express routes for bootstrap, auth, users, settings, Party,
Party History, Credit/Avoir, Proformas, Invoices, Delivery Notes, Payments, and Creances, with JWT cookie auth, RBAC middleware, default settings seed, job registration, generated document migrations, and optional document référent linkage.
Client now includes bootstrap-status route gating in App routing, a dedicated
bootstrap initialization page, upgraded login/set-password UX, settings/users management,
Party list/detail/create/edit/quick-add screens, document list/detail/create/promote/issue/cancel/BL flows, and invoice-detail payment issue/record/reschedule flows behind guarded routes.

Validation snapshot (2026-07-14):

- Docker stack is up in dev context (validated by successful `docker compose exec api ...` pre-flight run).
- Puppeteer PDF pre-flight passed (`docker compose exec api npm run preflight:pdf`, exit 0).
- Drizzle schema gaps found during audit were fixed.
- Mongo->PG migration schema mapping spike documented in cache technical notes.
- `npm run dev` in `packages/server` exited 130 (manual interrupt), not treated as a functional blocker.
- `packages/client` dependencies installed successfully (`npm i`, exit 0).
- `ignoreDeprecations` regression was fixed and pushed; Sprint 1 validation gate marked closed in `TASKS.md`.
- Party/Credit/History backend routes and Party client routes are drafted; document backend/client routes are mounted; payments backend routes and invoice-detail payment UI are drafted. Sprint 5 penalties/creances backend routes and cron wiring are drafted; server validation and penalty/creance API smoke are the next gates.

## Key constraints active right now

- npm workspaces, run scripts from within each package
- Windows MINGW64 dev environment
- Health check is /api/health (not /health)
- Migration dry-run is blocked until Beta production data access is available
