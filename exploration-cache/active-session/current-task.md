## Task

Documentation/cache sync after the July 19 analysis-section work. Compare from
`d6e8027` (`docs: Update README status to reflect Sprint 10 progress`) through
`HEAD` (`a9ba28c`) and update `exploration-cache/`, `TASKS.md`, and
`changelog.md` to match the current code.

## Current Project State

Sprint 10 - Dashboard & Reporting (M12) is closed in code. The repo now has
both the operational Dashboard and a dedicated `/analyse` section with six
tabs: Vue globale, Employes, Clients & Referents, Services, Creances &
Engagements, and Rapports.

Backend reporting is read-only agent+ and now includes dashboard summary, CA
composition with volume, CA trend, per-service trend, client/apporteur/employe
KPIs, employee activity drill-down, creances by party, accrual-vs-cash
comparison, open engagement totals, recent activity, and selectable-module
Excel/PDF exports.

Related cleanup closed two older gaps: party-history commercial data now lists
invoices and proformas for the party, and `/api/creances` can be filtered by
`partyId` while still using the same single receivables aggregation source.

## Not Yet Done

- Full reporting/analyse API-runtime smoke not yet run end-to-end.
- Sprint 9 credit-conversion fee-pair deep check remains flagged.
- Auto-converted epargne deposits still need a visible converted/source label.

## Sprint 11 (Data migration) — cancelled, not blocked

Confirmed with Fred: the legacy tripwise-monorepo was itself a dev/test
deployment with Lucrece, never mature production data. There is nothing real
to migrate even with Beta access, so this is cancelled outright rather than
left "blocked." tripwise-monorepo's role as a UI/business-logic reference
oracle is unaffected — that was always about pattern validation, not data.

The project's actual remaining goal is getting Lucrece to adopt the new,
simplified design (the whole reason this rebuild exists), not preserving old
data. Sprint 5's M6 cross-compare gate against legacy Beta data is similarly
moot for the same reason and should be treated as cancelled, not blocked,
going forward.

## Next up

Three new priorities, replacing the cancelled migration sprint, none yet
individually scoped:
1. UI hardening & state improvement (carries forward the flagged items above,
   plus the Sprint 1 dark-mode retrofit)
2. Notifications — no design decisions made yet
3. Journal d'audit — full filterable page, already logged as backlog during
   Sprint 10 (dedicated page or Parametres tab, filters by user/action/date/
   entity, reads the existing audit_log)
