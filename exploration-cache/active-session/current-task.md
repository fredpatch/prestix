## Task

Sync cache/tasks/changelog after Sprint 4 payments backend draft, then validate, commit, and push.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Run server typecheck/build after payment route/service wiring.
- Smoke-test invoice issue with full payment plan and <=3 installment plan.
- Smoke-test payment record FIFO allocation, target override, overpayment change/credit, and status recompute.
- Smoke-test admin reschedule and cancel-to-credit from real payment rows.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Sprint 4 payments backend draft is now in repo: payment records, installments, issue-time payment plans, FIFO allocation, overpayment change/credit, reschedule, and cancel-to-credit. Server typecheck/build pass; tracking keeps Sprint 4 tasks at `[~]` until migration and API smoke are complete.
