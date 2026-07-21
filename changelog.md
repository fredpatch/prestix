# Changelog

## Sprint 0

- Monorepo scaffold created (npm workspaces, packages/shared/types, packages/server, packages/client)
- Deployment infra added (docker-compose dev/staging/prod, nginx, deploy scripts)
- Sprint 1 backend foundation committed (bootstrap/auth/users/settings + JWT cookie auth + RBAC)
- Documentation and exploration cache synchronized with repository state

## Sprint 2 (2026-07-13)

- Added Party backend draft: list/search/filter, create/update, manager+ activation toggle, audit logging, and `/api/parties` route mount.
- Added Credit/Avoir backend draft: derived balance, dated lots, FIFO spend service, manager+ refund action, expired-unconverted lot query, and `/api/credit` route mount.
- Added Party History backend scaffold: agent+ `/api/parties/:id/history` route with separate commercial and épargne pagination contracts, ready to fill from M4 invoices and M11 savings.
- Added Party client draft: nav/routes, Parties list with search/role filter, create + quick-add dialogs, Party detail page with credit balance/lots and history placeholder tabs.
- Added Party edit dialog on the Party detail page, wired to the existing party update API.
- Added `requireManager` RBAC helper for Sprint 2 money/activation actions.
- Validation: server typecheck and client build pass; API/client smoke still pending for Party/Credit/History flows.

## Sprint 3 (2026-07-13)

- Added document-engine backend draft: proforma, invoice, delivery-note controllers/routes/services and API mounts.
- Added `proforma_lines` schema and document line snapshots for proforma/invoice flows.
- Added row-locked counter allocation for continuous `PRO-` and `INV-` numbers.
- Added invoice draft creation, line add/remove, proforma promotion, issue with `requestId` idempotency, admin cancellation with audit, and BL scaffold.
- Added proforma 48h expiry cron registration in the server job registry.
- Validation: server typecheck/build and client build pass; API smoke still pending for document routes.

## Sprint 3 (2026-07-14)

- Added document client API wrappers for proformas, invoices, and delivery notes.
- Added Proformas and Invoices navigation/routes plus list pages.
- Added proforma creation/detail/promote flow with shared party search and line-item builder.
- Added direct invoice draft creation/detail flow with draft line add/remove, issue action, cancellation dialog, and BL generation/display.
- Added `proforma_lines` migration folder (`20260714090648_damp_ravenous`).
- Added optional document référent support in proforma/invoice create/detail screens, with filtered référent search and `referrer_party_id` migration (`20260714132909_cooing_mathemanic`).
- Validation: server typecheck/build and client build pass after référent changes; migration application and API/client smoke still pending.

## Sprint 4 (2026-07-14)

- Added payment backend draft: payment service/controller/routes mounted at `/api/payments`.
- Added invoice `paymentStatus` tracking and payment-plan creation during invoice issue.
- Added installment creation for full-payment or <=3-installment plans, with total-sum validation.
- Added FIFO payment allocation with optional target installment override, per-installment status updates, and invoice-level payment status recompute.
- Added overpayment handling with required change-vs-credit choice and credit-lot creation for credit overpayments.
- Added admin+ installment reschedule flow with forward-only guard, reason/audit, and invoice final due-date adjustment.
- Updated invoice cancellation to compute already-paid amounts from payment rows and move paid money to credit.
- Added payment client draft on invoice detail: issue payment-plan dialog, payment plan card, record-payment dialog, and admin reschedule dialog.
- Added `payment_status` migration folder (`20260714174707_motionless_toad_men`).
- Validation: server typecheck/build and client build pass; payment migration/API/client smoke still pending.

## Sprint 5 (2026-07-14)

- Added penalties backend draft: weekly overdue penalty accrual service, settings-backed penalty amount/grace defaults, and daily cron registration.
- Added creances backend draft at `/api/creances` with principal/penalty due aggregation and optional overdue filtering.
- Wired invoice cancellation to void active penalties with audit logging.
- Extended payment recording with principal-vs-penalty allocation support and exposed penalty accrued/paid/due totals on installment views.
- Added creances client draft: `/creances` route/nav entry, creance API wrapper, overdue toggle, principal/penalty totals, and invoice links.
- Added penalty-aware invoice payment UI: installment penalty due display and principal-vs-penalty allocation choice with warning.
- Added penalty accrual unit coverage: extracted accrual-count calculation into a pure helper and covered grace boundary, weekly cadence, no-cap accumulation, longer grace, and midnight normalization with Vitest.
- Fixed payment record controller forwarding for `allocationTarget` so principal-vs-penalty allocation reaches the service.
- Validation: root typecheck, server build, and client build pass; `npm test` passes (8 penalty tests) after elevated rerun for Windows `spawn EPERM`; penalty/creance API/client smoke and legacy Beta cross-compare still pending.

## Document UI Hardening (2026-07-15)

- Replaced proforma and direct-invoice creation dialogs with dedicated `/proformas/new` and `/invoices/new` pages.
- Added a guided Proforma creation flow with React Hook Form/Zod validation, labeled ticket fields, completion summary, totals panel, and Framer Motion line transitions.
- Added a Proforma line composer with shadcn labels/inputs/selects, ticket-vs-shop line cards, collapse/remove controls, and clearer required-field feedback.
- Extended ticket detail shape for return dates and GDS references across client and server proforma types.
- Updated Proformas/Invoices list actions to link into the new creation pages.
- Added shared layout page-header state so routed pages can set the top-bar title, back target, and badge from one place.
- Moved list/detail/create page titles and back links into the shared layout header across Parties, Proformas, Invoices, Créances, Users, Settings, and document detail/create views.
- Simplified document line composers by removing duplicate generated-description panels now that ticket details are explicitly labeled.
- Validation: client build passes after elevated rerun for the known Vite/esbuild `spawn EPERM`; existing Vite chunk-size warning remains.

## Document PDF Export (2026-07-15)

- Added Proforma PDF export endpoint at `/api/proformas/:id/pdf`, reusing the shared invoice print template with the 48h validity note.
- Added Delivery Note PDF export endpoint at `/api/delivery-notes/invoice/:invoiceId/pdf`, reusing invoice line/party data without payment recap.
- Added `DOCUMENT_PRINTED` audit logging for invoice, proforma, and delivery-note PDF generation.
- Added client PDF actions on Proforma detail and generated delivery-note display on Invoice detail.
- Added ticket return-date rendering in invoice/proforma/BL PDFs.
- Added invoice payment schedule rendering for multi-installment invoices.
- Tightened the shared print template spacing, table sizing, totals, signature, and footer layout for denser PDF output.
- Restored TypeScript `ignoreDeprecations` settings to the repo-compatible `5.0` value in base/server configs.
- Validation: server typecheck/build and client build pass; client build required elevated rerun for the known Vite/esbuild `spawn EPERM`, and the existing Vite chunk-size warning remains.

## Sprint 7 Stock Backend (2026-07-15)

- Added Stock backend module mounted at `/api/stock` with agent+ article/movement reads and manager+ article create/update/activation/restock actions.
- Added append-only stock movement recording with row-locked `stock_items` balance updates, duplicate reference protection, manual negative-stock blocking, and negative override flags for invoice issue only.
- Wired invoice issue to create idempotent stock OUT movements for shop lines with `articleId` inside the invoice transaction.
- Added invoice issue controller support for manager-gated negative stock override requests and stock error responses.
- Wired invoice cancellation to create compensating stock adjustments for previously recorded shop OUT movements.
- Added `proforma_shop_details` schema/migration (`20260715180806_lazy_ultimo`) so quoted shop lines can carry article, supplier/selling price, and passenger metadata before promotion.
- Extended proforma/invoice line views and draft/add/promote flows to persist and return shop details alongside ticket details.
- Added stock client API wrapper, `/stock` route/nav entry, stock article list with inactive toggle, manager create/restock/activate actions, and stock article picker fields in Proforma/Invoice line composers.
- Updated Proforma/Invoice create-page validation schemas to accept `shopDetails`, preserving stock article, supplier price, selling price, and passenger assignments on submit.
- Added low-stock warnings to Proforma/Invoice shop line composers when requested quantity exceeds current on-hand stock.
- Added invoice issue support for manager negative-stock override from the client, including translated stock error messages and a confirmation prompt before forcing issue.
- Updated document PDF exports so shop lines print as PrestiShop rows and use the assigned shop passenger when present.
- Added stock audit logging for article mutations and negative-stock overrides.
- Validation: server typecheck/build pass; client build passes after elevated reruns for the known Vite/esbuild `spawn EPERM`, with the existing chunk-size warning; runtime stock API, shop-detail, low-stock override, and invoice stock movement smoke still pending.

## Sprint 9 Savings Core (2026-07-16)

- Added Savings backend module mounted at `/api/savings` for direct subscriptions, deposits, manager+ withdrawals, admin+ reversals, transactions, withdrawal receipt PDFs, and super_admin credit-conversion trigger.
- Added savings transaction schema migration (`20260716082550_daffy_blacklash`) for withdrawal receipt numbers, reversal links, and nullable system-originated agents.
- Added `REC` counter seeding and receipt-number generation for standalone savings withdrawals.
- Added credit-window auto-conversion job for expired credit lots, including under-fee hold-for-review policy and savings account/deposit creation.
- Wired `method: "epargne"` invoice payments to atomically withdraw from the party savings account inside a serializable payment transaction.
- Filled Party History épargne pagination from savings transactions.
- Extended the shared print template and added withdrawal receipt PDF generation with print audit logging.
- Validation: server typecheck/build pass; migration generated; savings API/runtime smoke still pending.
- Closed Sprint 9 task/cache notes after runtime smoke, documenting the admin+ withdrawal correction, inscription-fee ledger-pair decision, and carried-forward credit-conversion/auto-converted-deposit hardening items.

## Sprint 10 Reporting Core (2026-07-17)

- Added Reporting backend module mounted at `/api/reporting` with agent+ read access everywhere (informational only, no privileged mutation in this module).
- Added dashboard summary endpoint combining CA composition, épargne net-balance-over-period, low-stock count, and overdue/unpaid totals for a given date range and accrual/cash basis.
- Added CA composition, client KPI, apporteur KPI, and employé KPI endpoints, all date-range and accrual/cash aware.
- Added Excel export endpoint (`/api/reporting/export/excel`) generating a workbook of the same reporting data.
- Validation: server typecheck/build pass; reporting API/runtime smoke still pending.
- Added client `reportingApi` wrapper for the summary, CA composition, KPI, and Excel-export endpoints.
- Replaced the dashboard placeholder with a real Dashboard page: date-range presets (this month/30 days/this year) with accrual/cash toggle, CA composition, overdue/unpaid/low-stock/épargne summary tiles, client/apporteur/employé KPI tables, and an Excel export action.
- Widened the sidebar (180px → 225px expanded) to fit the new dashboard nav label.

## Sprint 10 Dashboard Enhancements (2026-07-17)

- Added a PDF export endpoint (`/api/reporting/export/pdf`) rendering the dashboard report (CA composition, summary, KPIs) via the shared print template.
- Added a recent-activity endpoint (`/api/reporting/recent-activity`) surfacing the latest audit-log entries with actor/entity context.
- Added client `getRecentActivity`/`exportPdfUrl` wrappers and a humanized action-label map for the dashboard's activity feed.
- Added a recent-activity feed and a PDF export action alongside the existing Excel export on the Dashboard page, plus explanatory tooltips on the accrual/cash toggle.
- Filtered the dashboard's recent-activity feed to a transaction-focused whitelist (invoices, payments, commissions, épargne, reschedules) by default, with an over-fetch/slice so the feed still fills to the requested limit; the unfiltered audit log remains available server-side for a future dedicated audit page.
- Linked the dashboard's "Impayées (toutes)" tile to `/creances?overdue=false`, and made the Créances page read its overdue-only default from that query param.
- Added client/référent name lookups to the Commissions table so commission rows show the actual party names instead of just IDs.

## Fixes (2026-07-17)

- Fixed proforma-to-invoice promotion dropping `referrerPartyId`: the référent selected on a proforma was never carried forward to the resulting invoice.
- Fixed a date-range boundary bug across every reporting query (CA composition buckets, épargne net-balance, client/apporteur/employé KPIs): `to` was parsed as midnight UTC at the *start* of that day, so any `lte` comparison silently excluded same-day activity happening later than midnight. Added a shared `endOfDay()` helper so `to` is always compared against 23:59:59.999 UTC.

## Sprint 10 Employee Activity Drill-down — Backend (2026-07-17)

- Extended `getEmployeKpis` to return a per-agent `EmployeeActivityBreakdown` (invoices issued, payments recorded, commissions logged, stock movements, savings transactions) instead of one combined volume/value number — separate counts because the person who creates an invoice isn't always the one who later records its payment.
- Added `/api/reporting/employees/:agentId/detail` returning real transaction-level rows (invoices, payments, commissions, stock movements, savings transactions) for one employee over a date range — the actual drill-down behind the KPI, intended for prime/incentive decisions rather than a bare leaderboard number.

## Sprint 10 Employee Activity Drill-down — Frontend (2026-07-17)

- Added `EmployeeKpiTable`, replacing the generic `KpiTable` for the Employé KPI panel, showing each agent's per-activity-type breakdown summary and a drill-down link (kept separate from the shared `KpiTable` since Client/Apporteur have no equivalent breakdown).
- Added `EmployeeActivityDetailPage` at `/reporting/employees/:agentId`, listing an agent's invoices, payments, commissions, stock movements, and savings transactions for the selected date range/basis, carried over via query params from the dashboard.
- Extended `reporting.api.ts` with `EmployeeKpiRow`, `EmployeeActivityBreakdown`, `EmployeeActivityDetail` types and `getEmployeeActivityDetail`.

## Sprint 10 Dashboard UI Polish (2026-07-17)

- Reduced the shared `Button` component's density (smaller text, shorter default height, tighter icon-button sizing) for a more compact dashboard layout.
- Added a `className` passthrough to `CaCompositionTable` so it can be placed in a grid alongside future dashboard panels.

## Refactors (2026-07-17)

- Split `DashboardPage.tsx` (was ~390 lines) into a `pages/dashboard/` module: a `useDashboardData` hook owning the fetch/state, pure helpers (`date-presets.ts`, `action-labels.ts`, `format.ts`), and presentational components (`DashboardFilterBar`, `SummaryCards`, `CaCompositionTable`, `KpiTable`, `RecentActivityFeed`). `DashboardPage` is now a ~55-line orchestrator. No behavioral change; dropped an unused `useAuth()` leftover from the old placeholder.

## Sprint 10 Analysis Section Close-out (2026-07-19)

- Added the `/analyse` route and sidebar entry for a dedicated analysis surface separate from the operational Dashboard.
- Added `AnalysePage` with shared period/basis controls and six tabs: Vue globale, Employés, Clients & Référents, Services, Créances & Engagements, and Rapports.
- Added `ChartCanvas`, a reusable Chart.js wrapper with line/bar/doughnut controller registration, shared brand-aligned chart colors, accessibility labels, and StrictMode-safe cleanup.
- Added analysis tab components for global CA trend, employee performance, client/referrer comparison, service composition/trend, receivables/engagements, and selectable report exports.
- Extended the reporting API/client contract with CA volume, CA trend, service trend, creances by party, accrual-vs-cash comparison, open engagements, and optional module selection for Excel/PDF exports.
- Expanded `/api/reporting` routes/controllers/services for the new analysis endpoints while keeping the module agent+ read-only and table-free.
- Expanded Excel and PDF reporting exports to support selected modules (`global`, `employes`, `clients_referents`, `services`, `creances`) and added report sections/sheets for services, creances, accrual-vs-cash, and open engagements.
- Filled Party History's commercial section from invoices and proformas, including computed proforma totals from `proformaLines`, closing the old Sprint 3 placeholder.
- Added optional `partyId` filtering to `/api/creances` and the client `creanceApi.list()` wrapper while preserving the shared receivables aggregation source used by Dashboard/Analyse/party detail.
- Updated party-history client types to expose typed commercial proforma/invoice rows.
- Fixed the Analyse page import casing for `RapportsTab` after `npm run typecheck` exposed a Windows case-sensitivity mismatch.
- Removed obsolete `docs/diffs/*.diff` working artifacts and updated `.gitignore` for the current repo workflow.
- Validation: `npm run typecheck` passes; client build passes after elevated rerun for the known Vite/esbuild Windows `spawn EPERM`, with the existing chunk-size warning.

## Validation Notes (2026-07-12)

- `npm run db:seed` in `packages/server`: FAIL (exit 1)
- `docker compose up -d postgres api`: blocked (Docker daemon unavailable)
- `npm run format` from repo root: PASS

## Sprint 11c-1 UI Hardening: Foundations (2026-07-20)

- Installed `sonner`, `@tanstack/react-query`, `@tanstack/react-table`.
- Swapped the client font from Mulish to Plus Jakarta Sans; removed Geist.
- Replaced ad-hoc arbitrary px values with a fixed-px type scale (`--text-xs` 11px through `--text-xl` 20px).
- Wired `QueryClientProvider` in `main.tsx`; added `query-client.ts` (staleTime/retry defaults, centralized mutation error → toast) and `query-keys.ts` as the single registry for every cache key used in the app.
- Added `<Toaster />` and `api-error.ts` (`getApiErrorMessage`, `getApiErrorCode`) as the shared error-surfacing pattern.

## Sprint 11c-2 UI Hardening: Contained Fixes (2026-07-20)

- Replaced both raw `alert()` calls with Sonner toasts.
- Converted all 8 remaining native `<select>` elements to shadcn `<Select>`, using a `__all__` sentinel value where Radix/shadcn's Select doesn't support an empty-string option value.
- Added shadcn Calendar + a `DatePicker` wrapper, replacing plain `<input type="date">` on commission and payment forms.
- Split the two ~700-line line-items composer components into a shared generic `LineItemsComposer.tsx` plus two thin per-document wrappers.

## Sprint 11c-3 UI Hardening: React Hook Form + Table Components (2026-07-20/21)

- Extended React Hook Form + zod to the 5 remaining simple create/edit dialogs: `CreatePartyDialog`, `EditPartyDialog` (shared `partySchema`/`partyToValues` in `party-schema.ts`), `CreateStockArticleDialog`, `RecordPaymentDialog` (overpayment-choice branching preserved), `CreateCommissionDialog` (party pickers and dynamic fields stay local state, only scalar fields go through RHF).
- Added `ReadOnlyTable` (static KPI/display) and `DataTable` (sortable/filterable) generic table components on top of TanStack Table; both later rebuilt on shadcn's `Table` primitives once that component was added to the project. `ReadOnlyTable` gained `title: ReactNode` support, an optional `footer` slot (shadcn `TableFooter`), and a `bare` mode for tables nested inside a caller's own custom card.
- Added `lib/table-meta.ts` — a shared `ColumnDef` module augmentation (`meta.align`) used by both table components; loosely typed (`ColumnDef<T, any>`) by design for fast adoption across ~15 existing hand-rolled tables.

## Sprint 11c-3 UI Hardening: React Query Migration (2026-07-21)

- Established the `hooks/queries/` + `hooks/mutations/` convention — one hook per query or mutation, colocated by type rather than inline in pages, matching the folder structure requested for maintainability.
- Migrated every reachable page's data-fetching from `useState`+`useEffect`+axios to React Query hooks: `PartyDetailPage`, `InvoiceDetailPage`, `ProformaDetailPage`, `CommissionEditQueuePage`, `CommissionsPage`, `CreancesPage`, `UsersPage`, `EmployeeActivityDetailPage`, `PartiesPage`, `InvoicesPage`, `ProformasPage`, `StockArticlesPage`, `DashboardPage`, and all 6 `analyse/*Tab.tsx` files (`RapportsTab` has no data-fetching, skipped).
- Adopted real `useMutation` throughout — previously the app used `useQuery` exclusively; every "mutation" was a plain async call with manual `queryClient.invalidateQueries()`, and `query-client.ts`'s centralized `mutations.onError` toast was dead code. Converted ~15 dialog mutations (party, stock, commission, invoice, payment, savings, user CRUD/actions) onto `useMutation`, activating that default toast app-wide. Bespoke error branching (overpayment choice, manager-only stock-override offer, savings error-code message map) preserved via hook-level `onError` overrides, which replace rather than stack with the global default.
- Fixed two latent bugs surfaced by the migration: `UsersPage`'s OTP-reset and `CommissionsPage`'s delete previously had no error handling at all (unhandled promise rejections on failure); both now correctly toast.
- Migrated every genuine list/detail table to `DataTable`/`ReadOnlyTable`: `CreancesPage`, `UsersPage`, `CommissionsPage`, `PartiesPage`, `InvoicesPage`, `ProformasPage`, `StockArticlesPage`, `EmployeeActivityDetailPage` (5 sections), `KpiTable`, `EmployeeKpiTable`, `CaCompositionTable`, `CreancesEngagementsTab`'s créances-by-party table. `KpiTable`/`EmployeeKpiTable`/`CaCompositionTable` kept their existing external props — internals-only swap, zero changes needed at their call sites.
- Deliberately left hand-rolled: `InvoiceDetailPage`/`ProformaDetailPage` line-items tables (inline row-editing state), `CommissionEditQueuePage`'s per-request comparison grid (not a record list), `SettingsPage` (sub-component-local loading pattern), `BootstrapPage` (one-time wizard).
- Retired `pages/dashboard/useDashboardData.ts` — its 5 fetches were already covered by hooks created for the `analyse` tabs (shared `useCaComposition`, `useDashboardSummary`, `useClientKpis`, `useApporteurKpis`, `useEmployeeKpis`); added one new `useRecentActivity` hook and moved `from`/`to`/`basis` state directly into `DashboardPage`.
- Corrected a stale memory/handoff claim of "11 pages migrated to React Query" — audited against the actual repo and found only 8 were, with 3 dialogs described as "migrated in sandbox" never actually committed (sandbox containers don't persist between sessions). All redone and verified this pass.
- Validation: `git apply --check` + `npm install` + `npx tsc --noEmit` clean for every diff in this migration, applied incrementally across 16 batches.
