## Task

Sync cache/tasks after Sprint 2 Party frontend draft and prepare validation follow-up.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Smoke-test authenticated Party endpoints: list/search/create/update/activation.
- Smoke-test authenticated Credit endpoints: balance/lots/entries/refund error paths.
- Smoke-test authenticated Party History endpoint with separate commercial/epargne pagination params.
- Smoke-test client Party list/detail/create/quick-add/history flows against the API.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Sprint 2 Party frontend draft is now in repo on top of the Party, Credit/Avoir, and Party History backend drafts. Server typecheck and client build pass; tracking keeps the affected tasks at `[~]` until API/client smoke is complete.
