# Recurring Patterns

- Service/controller/routes triad per module (auth, users, settings, bootstrap)
- Cookie-based JWT auth:
  - access cookie: prestix_access (short-lived)
  - refresh cookie: prestix_refresh (long-lived)
  - refresh endpoint rotates access token
- RBAC via numeric role levels (agent=1, manager=2, admin=3, super_admin=4)
- Structured auth lifecycle:
  - first login can require OTP validation
  - set-password transitions account out of first-login state
  - failed attempt lockout managed via settings values
- Audit log insertion on sensitive auth/user events
- Startup idempotent settings seed using onConflictDoNothing

## Client-side (frontend), established Sprint 11c

- **Data fetching**: `hooks/queries/use<Entity>.ts` wraps `useQuery`,
  `hooks/mutations/use<Action><Entity>.ts` wraps `useMutation` — one hook
  per query/mutation, never inline in a page component. Every cache key
  goes through `lib/query-keys.ts`'s central registry (factory functions,
  never an ad-hoc array literal in a component). Mutations that need
  bespoke error branching (e.g. an overpayment-choice prompt, a
  manager-only override offer) override `onError` at the hook level — a
  hook-level override *replaces* the global default, it doesn't stack with
  it; a callback passed to `mutate()` at the call site runs *in addition
  to* whatever's already resolved at the hook level.
- **Tables**: `components/ui/data-table.tsx` (`DataTable`, sortable) and
  `components/ui/read-only-table.tsx` (`ReadOnlyTable`, static), both on
  shadcn's `Table` primitives, columns typed via TanStack Table's
  `ColumnDef<T, any>[]` (loosely typed on purpose, for fast adoption).
  `meta.align` on a column controls cell/header alignment via a shared
  module augmentation in `lib/table-meta.ts`.
- **Forms**: React Hook Form + zod for every dialog above trivial
  complexity; simple dialogs (a couple of fields, no dependent UI) can stay
  on plain `useState` if genuinely simpler that way.
- **Sandbox containers are ephemeral** — nothing survives between chat
  sessions unless it's actually committed and pushed to the repo. A
  "drafted, not yet applied" state does not persist; don't assume prior
  handoff notes describing sandbox-only work are still true without
  verifying against the repo first.
