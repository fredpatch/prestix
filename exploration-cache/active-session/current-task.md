## Task

Sync cache/tasks/changelog after Sprint 5 penalties test pass, then validate, commit, and push.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Keep penalty accrual unit tests green after extracting `computeExpectedAccrualCount`.
- Smoke-test `/creances` with and without the overdue toggle.
- Smoke-test penalty accrual on overdue unpaid/partial installments and confirm paid installments do not accrue.
- Smoke-test payment recording with `allocationTarget: "penalty"` and verify principal status remains principal-only.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Sprint 5 penalties/creances draft now has backend, initial client coverage, and dedicated accrual-count unit tests: penalty accrual service, daily cron registration, `/api/creances`, invoice-cancel penalty voiding, penalty-first payment allocation, penalty totals on installment views, `/creances` route/nav, invoice payment allocation controls, and 8 Vitest cases for the weekly accrual rule. Server typecheck/build, client build, and `npm test` pass; runtime smoke and legacy Beta cross-compare are still pending.
