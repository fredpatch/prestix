## Where We Left Off

Sprint 11d Notifications/mail foundation is implemented in code after the
Sprint 11f UI/reporting polish close-out. The recent session shipped three
main clusters:

1. In-app notification center: schema/migrations, API, client page, sidebar
   entry, unread badge, filters, read/archive actions.
2. System event producers for expired proformas, penalties, credit conversion
   and holds, upcoming installments, and commission edit request decisions.
3. SMTP/Gmail-ready mail foundation with admin test/status endpoints, outbox
   tracking, Settings toggles, and `.env.example` guidance.

Latest pushed commits:

- `0870d10 feat: refine admin UI and dashboard workflows`
- `2c64d26 feat: rework invoice and proforma document views`
- `9ecd434 feat: align dashboard report exports`

## What's In Scope Today

Cache/changelog sync for the notification/mail session, then commit and push
all current changes.

## State Of The Codebase

Backend routes are mounted for bootstrap, auth, users, settings, Party, Party
History, Credit/Avoir, Proformas, Invoices, Delivery Notes, Payments,
Creances, Stock, Commissions, Savings, Reporting, Audit Log, and
Notifications.

Notifications/mail:

- `/api/notifications` supports list/unread count/read/archive operations.
- `/api/notifications/mail/status`, `/mail/test`, and `/mail/outbox` are
  admin+ endpoints for SMTP readiness and delivery diagnostics.
- Mail delivery is guarded both by environment config and the Settings-backed
  `mail_enabled` toggle.
- Automatic document sending and reminders are deliberately seeded as
  disabled toggles until templates, attachments, and retry UX are implemented.

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
- Root `npm run build`: PASS after elevated rerun for the known Vite/esbuild
  Windows `spawn EPERM`; existing client chunk-size warning remains.

## Key Constraints Active Right Now

- npm workspaces, run scripts from within each package when possible.
- Windows dev environment.
- Health check is `/api/health`, not `/health`.
- Sandbox containers used for diff generation/validation are ephemeral;
  nothing persists between chat sessions unless committed and pushed.
- New migrations must be applied before notification/mail runtime smoke.
