## Task

Documentation/cache sync after Sprint 11c-3 (UI Hardening: Architectural
Migration) closed. Update `exploration-cache/`, `TASKS.md`, and
`changelog.md` to match the current code.

## Current Project State

Sprint 11c is fully closed (11c-1 Foundations, 11c-2 Contained Fixes, 11c-3
Architectural Migration). The frontend now has a consistent, documented
pattern for data-fetching (`hooks/queries/`+`hooks/mutations/`), generic
tables (`DataTable`/`ReadOnlyTable`), and forms (React Hook Form + zod on
every dialog of meaningful complexity).

11c-3 specifically closed out three things that were previously
inconsistent across the app:

1. Mixed `useQuery`-only usage with plain-async mutations → real
   `useMutation` everywhere, activating the previously-dead global error
   toast.
2. Hand-rolled `<table>` markup duplicated across ~15 files → two generic,
   shadcn-based components.
3. Data-fetching logic inline in page components → extracted into
   colocated, reusable hooks.

## Not Yet Done

- Manual runtime smoke test of the Sprint 11c-3 migration — everything was
  validated via typecheck only, not exercised in a running app.
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

## Next up

Two remaining priorities from the three that replaced the cancelled
migration sprint (UI hardening, the third, is now done):

1. **Sprint 11d — Notifications**: not yet scoped. No design decisions made
   (which events to notify on, in-app vs. email, real-time vs. polling).
   Sonner (installed in 11c-1) will likely be part of how in-app
   notifications render.
2. **Sprint 11e — Journal d'audit**: not yet scoped. Full filterable audit
   log page (dedicated page or Paramètres tab), filters by
   user/action/date/entity, reads the existing `audit_log` every module
   already writes to via `logAudit()` — no new tracking needed, purely a
   display layer. Benefits from `DataTable` (now available) for the
   filterable list.
