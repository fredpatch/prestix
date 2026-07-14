## Task

Sync cache/tasks/changelog after Sprint 5 penalties/creances backend draft, then validate, commit, and push.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Run server typecheck/build after penalties, creances, and penalty-aware payment allocation wiring.
- Smoke-test `/api/creances` with and without `?overdue=true`.
- Smoke-test penalty accrual on overdue unpaid/partial installments and confirm paid installments do not accrue.
- Smoke-test payment recording with `allocationTarget: "penalty"` and verify principal status remains principal-only.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Sprint 5 penalties/creances draft now has backend coverage: penalty accrual service, daily cron registration, `/api/creances`, invoice-cancel penalty voiding, penalty-first payment allocation, and penalty totals on installment views. Server typecheck/build pass; runtime API smoke and dedicated tests are still pending.
