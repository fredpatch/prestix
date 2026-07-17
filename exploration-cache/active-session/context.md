## Where We Left Off

Sprint 9 (Epargne Voyage, M11) is closed. Sprint 10 - Dashboard & Reporting
(M12) is underway (2026-07-17): reporting backend core, dashboard frontend,
PDF/Excel export, recent-activity feed, and employee-activity-drilldown
backend are built. See `sessions/2026-07-17.md`.

## What's In Scope Today

Cache/changelog sync after the Sprint 10 reporting/dashboard work (backend
core, frontend, enhancements, referrer/date-range bug fixes, DashboardPage
refactor, employee drill-down backend), then commit and push.

## State Of The Codebase

Backend has mounted routes for bootstrap, auth, users, settings, Party, Party
History, Credit/Avoir, Proformas, Invoices, Delivery Notes, Payments,
Creances, Stock, Commissions, Savings, and Reporting. The server uses JWT
cookie auth, RBAC middleware, default settings seed, job registration,
generated migrations, and audit logging.

Sprint 9 savings backend: `/api/savings` supports direct subscriptions,
account lookup by party, deposits, manager withdrawals, admin reversals,
transaction listing, withdrawal receipt PDFs, and super_admin manual
credit-conversion trigger. Savings balances are derived from recorded ledger
rows. Standalone withdrawals and epargne-as-payment withdrawals use
serializable transactions to protect against double-spend. Client savings UI
is built (Sprint 9).

Sprint 10 reporting backend: `/api/reporting` (agent+ read-only) provides
dashboard summary, CA composition, client/apporteur/employé KPIs (employé
KPI now includes a per-agent activity breakdown), Excel export, PDF export,
recent-activity feed (audit-log-backed, transaction-whitelisted), and an
employee-activity-detail drill-down endpoint. All date-range queries use a
shared `endOfDay()` helper after a real boundary bug was found and fixed.
Dashboard frontend is built and refactored into a `pages/dashboard/` module
(hook + pure helpers + presentational components). The employee drill-down
is now complete end-to-end: `EmployeeKpiTable` on the dashboard links into
`EmployeeActivityDetailPage` (`/reporting/employees/:agentId`).

## Validation Snapshot (2026-07-17)

- `npm run typecheck -w packages/server`: PASS after Sprint 10 reporting work.
- `npx tsc --noEmit -p packages/client/tsconfig.json`: PASS after DashboardPage refactor.
- `npm run build -w packages/client`: PASS after DashboardPage refactor.
- Reporting API/runtime smoke (summary, CA composition, KPIs, exports,
  recent-activity, employee drill-down): still pending end-to-end.
- Legacy Beta cross-compare is still blocked on data access.

## Key Constraints Active Right Now

- npm workspaces, run scripts from within each package.
- Windows dev environment.
- Health check is `/api/health`, not `/health`.
- Migration dry-run is blocked until Beta production data access is available.
