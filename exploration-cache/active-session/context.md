## Where We Left Off

Sprint 8 is closed. Sprint 9 - Epargne Voyage (M11) is now underway.

## What's In Scope Today

Cache/changelog sync after the Sprint 9 savings backend core, then commit and push.

## State Of The Codebase

Backend has mounted routes for bootstrap, auth, users, settings, Party, Party
History, Credit/Avoir, Proformas, Invoices, Delivery Notes, Payments,
Creances, Stock, Commissions, and Savings. The server uses JWT cookie auth,
RBAC middleware, default settings seed, job registration, generated migrations,
and audit logging.

Sprint 9 savings backend is drafted: `/api/savings` supports direct
subscriptions, account lookup by party, deposits, manager withdrawals,
admin reversals, transaction listing, withdrawal receipt PDFs, and super_admin
manual credit-conversion trigger. Savings balances are derived from recorded
ledger rows. Standalone withdrawals and epargne-as-payment withdrawals use
serializable transactions to protect against double-spend.

Credit-window auto-conversion is registered as a daily job and handles existing
account deposits, new-account subscription with fee deduction, and under-fee
hold-for-review logging. Party History now fills the epargne section from
savings transactions.

Client savings UI is not built yet.

## Validation Snapshot (2026-07-16)

- `npm run typecheck -w packages/server`: PASS after savings backend core.
- `npm run db:generate -w packages/server`: PASS, generated `20260716082550_daffy_blacklash`.
- `npm run build -w packages/server`: PASS after savings backend core.
- Runtime savings API smoke is pending.
- Epargne-as-payment smoke is pending.
- Credit auto-conversion smoke is pending.
- Withdrawal receipt PDF smoke is pending.
- Legacy Beta cross-compare is still blocked on data access.

## Key Constraints Active Right Now

- npm workspaces, run scripts from within each package.
- Windows dev environment.
- Health check is `/api/health`, not `/health`.
- Migration dry-run is blocked until Beta production data access is available.
