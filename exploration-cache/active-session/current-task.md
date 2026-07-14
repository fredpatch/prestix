## Task

Sync cache/tasks/changelog after Sprint 3 document référent UI/migration draft, then validate, commit, and push.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Run server typecheck/build after adding the document référent migration.
- Run client build for Proformas/Invoices référent selectors and detail display.
- Smoke-test document flows with optional référent: proforma create/detail/promote, invoice draft/detail.
- Smoke-test `proforma_lines` and `referrer_party_id` migrations in the dev stack.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Sprint 3 now has the document backend draft plus client document screens/API wrappers, generated `proforma_lines` migration, and optional document référent migration/UI. Server typecheck/build and client build pass; tracking keeps Sprint 3 tasks at `[~]` until migration application and API/client smoke are complete.
