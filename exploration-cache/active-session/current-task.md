## Task

Sync cache/tasks/changelog after Sprint 3 document UI draft and proforma-lines migration, then validate, commit, and push.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Run server typecheck/build after adding the migration and document UI/API wrappers.
- Run client build for Proformas/Invoices routes and dialogs.
- Smoke-test document flows: proforma create/list/detail/promote, invoice draft/line/issue/cancel, BL create/get.
- Smoke-test `proforma_lines` migration application in the dev stack.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Sprint 3 now has the document backend draft plus client document screens/API wrappers and a generated `proforma_lines` migration. Server typecheck/build and client build pass; tracking keeps Sprint 3 tasks at `[~]` until migration application and API/client smoke are complete.
