## Task

Sync cache/tasks with latest Sprint 1 client admin wiring, then proceed to validation.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Run Sprint 1 validation pass (typecheck + route smoke checks for bootstrap/auth/users/settings).
- Verify newly wired admin pages (users/settings) and guarded navigation behavior.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Previous versions of this file focused on Sprint 0 closure and scaffold validation. Focus is now Sprint 1 client/backend validation and route hardening.
Latest client delta includes real `/users` and `/settings` route mounting behind `AdminRoute` and a first users-management screen wired to API endpoints.
