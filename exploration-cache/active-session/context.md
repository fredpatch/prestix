## Where We Left Off

Sprint 10 (Dashboard & Reporting, M12) is closed in code after the July 19
analysis-section pass. See `sessions/2026-07-17.md` for the reporting-core
slice and `sessions/2026-07-19.md` for the dedicated Analyse section and
report export expansion.

## What's In Scope Today

Cache/changelog/TASKS sync from `d6e8027` through `HEAD` after the recent
analysis-section pushes. During validation, one tiny code fix was made for a
case-mismatched `RapportsTab` import in `AnalysePage.tsx`.

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
dashboard summary, CA composition with volume, CA trend, service trend,
client/apporteur/employe KPIs (employe KPI includes per-agent activity
breakdown), employee-activity-detail drill-down, creances by party, accrual
vs cash comparison, open engagements, recent activity, and selectable-module
Excel/PDF exports. All date-range queries use a shared `endOfDay()` helper
after a real boundary bug was found and fixed.

Sprint 10 frontend: Dashboard is an operational overview page, while
`/analyse` is now the richer decision screen. It uses the dashboard's shared
period/basis filter, `ChartCanvas` (Chart.js wrapper), shadcn tabs, and tabs
for global trend, employees, clients/referrers, services, creances &
engagements, and report module selection. The employee drill-down remains
available at `/reporting/employees/:agentId`.

Party history commercial data is now filled from invoices and proformas,
not a placeholder. Creances can be filtered by `partyId` while preserving the
single aggregation source used by dashboard/reporting/party detail.

## Validation Snapshot (2026-07-19)

- `npm run typecheck`: PASS after fixing the `RapportsTab` import casing in
  `AnalysePage.tsx`.
- `npm run build -w packages/client`: sandboxed run failed with the known
  Vite/esbuild Windows `spawn EPERM`; elevated rerun PASS. Existing Vite
  chunk-size warning remains.
- Reporting/analyse API-runtime smoke (summary, trends, KPIs, exports,
  recent-activity, employee drill-down, creances, party history): still
  pending end-to-end.
- Legacy Beta cross-compare is still blocked on data access.

## Key Constraints Active Right Now

- npm workspaces, run scripts from within each package.
- Windows dev environment.
- Health check is `/api/health`, not `/health`.
- Migration dry-run is blocked until Beta production data access is available.
