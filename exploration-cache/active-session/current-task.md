## Task

Sync cache/tasks/changelog after Sprint 5 penalties/creances client draft, then validate, commit, and push.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Smoke-test client build output after creances page/nav/API wiring and penalty-aware payment UI updates.
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

Sprint 5 penalties/creances draft now has backend and initial client coverage: penalty accrual service, daily cron registration, `/api/creances`, invoice-cancel penalty voiding, penalty-first payment allocation, penalty totals on installment views, `/creances` route/nav, and invoice payment allocation controls. Server typecheck/build and client build pass; runtime smoke and dedicated tests are still pending.
