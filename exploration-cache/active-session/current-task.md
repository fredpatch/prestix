## Task

Sync cache/tasks/changelog after commits `23cb752` and `6612e92` (Party edit dialog + Sprint 3 document backend draft), then validate and commit the documentation sync.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Run server typecheck/build after document route mounts and job registration.
- Smoke-test authenticated document endpoints: proforma create/list/get, invoice draft/line/issue/cancel, BL create/get.
- Smoke-test proforma expiry cron registration and expired-proforma promotion guard.
- Smoke-test Party edit dialog against the update API.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Since `35fc581`, the repo has Party edit UI (`23cb752`) and the Sprint 3 document-engine backend draft (`6612e92`). Server typecheck/build and client build pass; tracking keeps Sprint 3 tasks at `[~]` until API smoke is complete.
