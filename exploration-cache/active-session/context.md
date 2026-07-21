## Where We Left Off

Sprint 11f UI/reporting polish is closed in code. The recent session shipped
two main clusters:

1. Operational UI/document polish across Party, Users, Login, Commission
   requests, Commissions, Creances, Stock, Dashboard, Settings, mobile layout,
   Proformas, Invoices, and document detail workspaces.
2. Dashboard report export alignment so quick PDF/Excel exports reflect the
   upgraded dashboard rather than only the older table/card report shape.

Latest pushed commits:

- `0870d10 feat: refine admin UI and dashboard workflows`
- `2c64d26 feat: rework invoice and proforma document views`
- `9ecd434 feat: align dashboard report exports`

## What's In Scope Today

Cache/changelog/TASKS sync for the UI/reporting polish session, then commit
and push documentation changes.

## State Of The Codebase

Backend routes are mounted for bootstrap, auth, users, settings, Party, Party
History, Credit/Avoir, Proformas, Invoices, Delivery Notes, Payments,
Creances, Stock, Commissions, Savings, Reporting, and Audit Log.

Document UI:

- `ProformasPage` has KPIs, filters, table/grid views, pagination via
  `DataTable`, mobile grid default, latest proforma, and quick view.
- `InvoicesPage` now mirrors that pattern with KPIs, status/payment filters,
  table/grid views, latest invoice, mobile grid default, and quick view.
- `InvoiceDetailPage` and `ProformaDetailPage` use a shared
  `DocumentWorkspace` module: KPI cards, status badges, party summary, line
  cards, paper preview, preview toggle, and empty states.

Dashboard/reporting:

- Dashboard uses summary KPIs, CA/gain trend, service trend,
  commission-type trend, recent sales, top services, top parties/referrers,
  and top employees.
- PDF export now renders inline SVG charts from backend reporting data:
  CA/gain, services, commission types, plus recent sales.
- Excel export now includes graph-oriented sheets with numeric trend data and
  static text-bar "vue" columns. Do not reintroduce ExcelJS `dataBar`
  conditional formatting; Excel repaired/removed it in real use.
- `getRecentSales()` now resolves payment party names via related invoices.

## Validation Snapshot (2026-07-21)

- `npm run typecheck`: PASS.
- `npm run build -w packages/server`: PASS after report export changes.
- `npm run build -w packages/client`: PASS during document UI passes after
  elevated rerun for the known Vite/esbuild Windows `spawn EPERM`; existing
  chunk-size warning remains.

## Key Constraints Active Right Now

- npm workspaces, run scripts from within each package when possible.
- Windows dev environment.
- Health check is `/api/health`, not `/health`.
- Sandbox containers used for diff generation/validation are ephemeral;
  nothing persists between chat sessions unless committed and pushed.
- Git worktree currently has an unrelated formatting-only local change in
  `packages/client/src/pages/analyse/ClientsReferrersTab.tsx`.
