## Where We Left Off

Sprint 11c (UI Hardening) is closed in full — all three phases (11c-1
Foundations, 11c-2 Contained Fixes, 11c-3 Architectural Migration). See
`sessions/2026-07-21.md` for the full session log of 11c-3, which was the
largest single push: React Hook Form extension, generic TanStack Table
components, and a full React Query migration across every reachable page
and dialog.

## What's In Scope Today

Cache/changelog/TASKS sync after the Sprint 11c-3 close-out.

## State Of The Codebase

Backend is unchanged this sprint — this was a frontend-only hardening pass.
Routes remain mounted for bootstrap, auth, users, settings, Party, Party
History, Credit/Avoir, Proformas, Invoices, Delivery Notes, Payments,
Creances, Stock, Commissions, Savings, and Reporting.

Frontend architecture as of Sprint 11c-3 close:

- **Data fetching**: `hooks/queries/` and `hooks/mutations/` — one hook per
  query or mutation, colocated by type rather than inline in pages. Every
  reachable page's `useState`+`useEffect`+axios fetch has been migrated to
  a query hook; every dialog mutation (create/update/delete/toggle actions)
  now uses real `useMutation`, not plain async+manual invalidate. The
  global `mutations.onError` default in `query-client.ts` (a Sonner toast)
  is now actually reachable and fires for any mutation that doesn't
  override it. `query-keys.ts` is the single registry for every cache key
  in the app — extend it rather than inventing ad-hoc key arrays.
- **Tables**: `components/ui/data-table.tsx` (sortable/filterable,
  `DataTable`) and `components/ui/read-only-table.tsx` (static
  display/KPI, `ReadOnlyTable`), both built on shadcn's `Table` primitives.
  `ReadOnlyTable` supports a `ReactNode` title, an optional `footer` slot,
  and a `bare` mode for tables nested inside a caller's own custom card.
  Column defs are loosely typed (`ColumnDef<T, any>`) by design, via a
  shared `lib/table-meta.ts` module augmentation for `meta.align`.
- **Forms**: React Hook Form + zod now covers all creation/edit dialogs of
  meaningful complexity (11 total across 11c-3 and earlier sessions). The 5
  simplest dialogs from earlier sessions were extended this sprint:
  `CreatePartyDialog`/`EditPartyDialog` (shared `party-schema.ts`),
  `CreateStockArticleDialog`, `RecordPaymentDialog`, `CreateCommissionDialog`.
- **Known, deliberate exceptions** (not migrated, not oversights):
  `InvoiceDetailPage`/`ProformaDetailPage` line-items tables (inline
  row-editing state doesn't fit `DataTable`'s model), `CommissionEditQueuePage`'s
  per-request diff grid (a 3-column comparison, not a record list),
  `SettingsPage` (sub-component-local loading, deliberately skipped since
  Sprint 11c-1), `BootstrapPage` (one-time wizard, no cache-sharing need).

## Validation Snapshot (2026-07-21)

- Every diff in the Sprint 11c-3 migration (16 batches) was validated
  independently: `git apply --check` against a fresh clone, `npm install`,
  `npx tsc --noEmit` — all clean before being handed off for Fred to apply.
- Not yet done: manual runtime smoke test of the migrated pages/dialogs in
  a running app. Typecheck-verified only.
- Reporting/analyse API-runtime smoke (summary, trends, KPIs, exports,
  recent-activity, employee drill-down, creances, party history): still
  pending end-to-end, carried over from Sprint 10.

## Key Constraints Active Right Now

- npm workspaces, run scripts from within each package.
- Windows dev environment.
- Health check is `/api/health`, not `/health`.
- Sandbox containers used for diff generation/validation are ephemeral —
  nothing persists between chat sessions unless committed and pushed. A
  "drafted in sandbox" state is not durable; treat it as lost until it's
  actually on `main`.
