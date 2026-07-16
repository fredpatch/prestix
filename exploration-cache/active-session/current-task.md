## Task

Sync cache/changelog after Sprint 9 savings backend core, then commit and push all current changes.

## Current Sprint 9 State

Sprint 9 - Epargne Voyage (M11) is underway. The backend savings module is drafted
and mounted at `/api/savings`, covering direct subscriptions, deposits,
manager-gated withdrawals, admin-gated reversals, transaction listing, withdrawal
receipt PDFs, and super_admin credit-conversion trigger.

Savings balances are derived from recorded ledger rows. Standalone withdrawals
run in serializable transactions and generate stable `REC` receipt numbers.
`method: "epargne"` invoice payments now withdraw from the party savings account
inside the same serializable payment transaction. Credit-window auto-conversion is
registered as a daily job and can be manually triggered by super_admin.

## Last Validation Run (2026-07-16)

- Server typecheck: PASS (`npm run typecheck -w packages/server`)
- Migration generation: PASS (`npm run db:generate -w packages/server`, generated `20260716082550_daffy_blacklash`)
- Server build: PASS (`npm run build -w packages/server`)

## Immediate Next Technical Check

- Smoke `/api/savings` direct subscription, account lookup, deposit, withdrawal, transaction list, reversal, receipt PDF, and manual conversion trigger.
- Apply/smoke migration `20260716082550_daffy_blacklash`.
- Smoke invoice payment with `method: "epargne"` for sufficient and insufficient savings balances.
- Smoke credit auto-conversion for existing-account, new-account, and under-fee hold-for-review branches.
- Smoke Party History epargne pagination from real savings transactions.

## Note

Runtime savings API smoke and client savings UI are still pending. The committed
backend slice also includes `docs/sprint9-savings-core.diff` as a review artifact
for this Sprint 9 batch.
