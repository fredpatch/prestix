## Task

Documentation/cache sync after Sprint 11e Journal d'audit was implemented in
code, then commit and push all changes.

## Current Project State

Sprint 11c is fully closed (11c-1 Foundations, 11c-2 Contained Fixes, 11c-3
Architectural Migration). Sprint 11e is also closed in code: the app now has
a dedicated admin+ `/audit-log` page using the existing audit-log backend,
React Query hooks, shadcn filters, DatePicker, DataTable pagination, and
metadata popovers.

11c-3 specifically closed out three things that were previously
inconsistent across the app:

1. Mixed `useQuery`-only usage with plain-async mutations → real
   `useMutation` everywhere, activating the previously-dead global error
   toast.
2. Hand-rolled `<table>` markup duplicated across ~15 files → two generic,
   shadcn-based components.
3. Data-fetching logic inline in page components → extracted into
   colocated, reusable hooks.

11e builds directly on those primitives: `useAuditLog.ts` (renamed from the
typoed `useAditLog.ts`), `queryKeys.auditLog*`, `DataTable`, `DatePicker`,
and the existing `/api/audit-log` backend.

## Not Yet Done

- Manual runtime smoke test of the Sprint 11c/11e UI flows — latest validation
  is typecheck + client build, not browser smoke.
- Full reporting/analyse API-runtime smoke not yet run end-to-end (carried
  over from Sprint 10, unrelated to this sprint's frontend work).
- Sprint 9 credit-conversion fee-pair deep check remains flagged.
- Auto-converted epargne deposits still need a visible converted/source label.

## Sprint 11 (Data migration) — cancelled, not blocked

Confirmed with Fred: the legacy tripwise-monorepo was itself a dev/test
deployment with Lucrèce, never mature production data. There is nothing real
to migrate even with Beta access, so this is cancelled outright rather than
left "blocked." tripwise-monorepo's role as a UI/business-logic reference
oracle is unaffected — that was always about pattern validation, not data.

## Validation Snapshot (2026-07-21)

- `npm run typecheck`: PASS after restoring `ignoreDeprecations` to `5.0`.
- `npm run build -w packages/client`: sandboxed run hit the known
  Vite/esbuild Windows `spawn EPERM`; elevated rerun PASS. Existing
  chunk-size warning remains.

## Next up

Sprint 11d — Notifications is the remaining unscoped priority from the
post-migration-cancellation plan.
