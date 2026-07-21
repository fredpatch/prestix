## Where We Left Off

Sprint 11c (UI Hardening) is closed in full: foundations, contained fixes,
and the architectural migration to React Query hooks, real mutation hooks,
React Hook Form/zod, and generic TanStack/shadcn table components.

Sprint 11e (Journal d'audit) is now closed in code. It adds a standalone
admin+ `/audit-log` page over the existing audit-log backend, using the
11c primitives instead of another one-off table/form pattern.

## What's In Scope Today

Cache/changelog/TASKS sync after Sprint 11e, then commit and push all
changes.

## State Of The Codebase

Backend routes are mounted for bootstrap, auth, users, settings, Party, Party
History, Credit/Avoir, Proformas, Invoices, Delivery Notes, Payments,
Creances, Stock, Commissions, Savings, Reporting, and Audit Log.

Audit log backend already exists at `/api/audit-log` with admin+ access,
pagination/filter support, and distinct action/entity-type helper endpoints.
The new frontend page consumes that API directly; no new audit tracking or
schema was needed.

Frontend architecture as of Sprint 11c/11e:

- **Data fetching**: `hooks/queries/` and `hooks/mutations/` — one hook per
  query or mutation. `query-keys.ts` is the cache-key registry.
- **Tables**: `DataTable` and `ReadOnlyTable`, both built on shadcn table
  primitives. The audit log page uses `DataTable`.
- **Forms/filters**: shadcn `Select`, `DatePicker`, and React Query state
  patterns are now the norm for filterable operational pages.
- **Audit log UI**: `/audit-log` is an admin+ route/nav item with filters
  for user/action/entity/date, paginated rows, a refetch indicator, and
  metadata details in a popover. The typoed `useAditLog.ts` hook was renamed
  to `useAuditLog.ts`.

## Validation Snapshot (2026-07-21)

- `npm run typecheck`: PASS after restoring the repo-compatible
  `ignoreDeprecations: "5.0"` in `tsconfig.base.json`.
- `npm run build -w packages/client`: sandboxed run hit the known
  Vite/esbuild Windows `spawn EPERM`; elevated rerun PASS. Existing
  chunk-size warning remains.
- Not yet done: manual runtime smoke of Sprint 11c/11e UI flows in a running
  browser session.
- Reporting/analyse API-runtime smoke remains pending end-to-end, carried
  over from Sprint 10.

## Key Constraints Active Right Now

- npm workspaces, run scripts from within each package.
- Windows dev environment.
- Health check is `/api/health`, not `/health`.
- Sandbox containers used for diff generation/validation are ephemeral —
  nothing persists between chat sessions unless committed and pushed.
