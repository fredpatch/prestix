## Task

Sync cache/tasks after Sprint 2 Party/Credit backend draft and prepare validation/UI follow-up.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Smoke-test authenticated Party endpoints: list/search/create/update/activation.
- Smoke-test authenticated Credit endpoints: balance/lots/entries/refund error paths.
- Start Party UI + quick-add integration once backend smoke is clean.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Sprint 2 backend draft is now in repo for Party and Credit/Avoir. Server typecheck passes; tracking keeps the affected tasks at `[~]` until API smoke and UI integration are complete.
