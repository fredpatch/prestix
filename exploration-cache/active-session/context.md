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
- `9cd6342 feat: add notifications and mail foundation`
- `a57eb19 feat: add document email delivery`
- `3f873b2 feat: update application` - design-token foundation pass
- `962af9e feat: update application` - dark palette/status token refinement
- `6f727cc feat: update application` - document and party semantic-token pass
- `2219bab feat: update application` - shared UI primitive token pass
- `a8947e6 feat: update application` - remaining operational pages token pass
- `c3b3430 feat: update application` - Settings impact-card polish

## What's In Scope Today

Update cache/changelog after the latest pushed application commits, then
commit and push the documentation sync.

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
- Document email delivery exists for invoice/proforma/BL manual sends, with
  PDF attachments, mail outbox rows, and automatic document sends guarded by
  `mail_document_auto_send_enabled`.

Resolved hardening/doc state:

- `recordPayment()` overpayment-to-credit now creates the credit lot inside
  the payment transaction.
- Auto-converted epargne deposits now display a `(converti)` badge on party
  detail when `agentId == null`.
- Sprint 9 credit-conversion fee-pair verification remains open.

Document UI:

- `ProformasPage` has KPIs, filters, table/grid views, pagination via
  `DataTable`, mobile grid default, latest proforma, and quick view.
- `InvoicesPage` now mirrors that pattern with KPIs, status/payment filters,
  table/grid views, latest invoice, mobile grid default, and quick view.
- `InvoiceDetailPage` and `ProformaDetailPage` use a shared
  `DocumentWorkspace` module: KPI cards, status badges, party summary, line
  cards, paper preview, preview toggle, and empty states.
- `/aide` provides bundled Markdown help content by module, and contextual
  help panels can open from page headers using `helpTopic`.
- Page headers can now expose short guide steps through `GuideTrigger`,
  especially on dense operational pages and document create flows.

Dark mode/UI token state:

- The brand gold is now formalized as semantic CSS custom properties and wired
  through primary/ring/sidebar tokens.
- Shared inputs, selects, calendars, tabs, buttons, popovers, switches, data
  tables, and read-only tables use semantic surfaces/borders/text instead of
  fixed neutral/white classes.
- Major feature pages have been migrated away from hardcoded Tailwind palette
  classes toward semantic tokens and status groups.
- Settings' sensitive impact-card dashed backgrounds now read from CSS custom
  properties, so they respond to dark mode.

Parties/documents:

- Parties support `individual` vs `company`, with company `tradeName` and
  optional `taxId`.
- Document snapshots/PDFs resolve company buyers to trade name and print
  RCCM/NIF when present.

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

## Validation Snapshot

- `npm run typecheck`: PASS.
- Root `npm run build`: PASS after elevated rerun for the known Vite/esbuild
  Windows `spawn EPERM`; existing client chunk-size warning remains.
- Dark-mode retrofit noted in `TASKS.md` as visually confirmed by Fred on
  2026-07-23; still worth doing a final runtime smoke on dense mobile pages.

## Key Constraints Active Right Now

- npm workspaces, run scripts from within each package when possible.
- Windows dev environment.
- Health check is `/api/health`, not `/health`.
- Sandbox containers used for diff generation/validation are ephemeral;
  nothing persists between chat sessions unless committed and pushed.
- New migrations must be applied before notification/mail and company-party
  runtime smoke.
