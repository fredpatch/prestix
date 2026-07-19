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
- Sprint 11 migration dry-run and M6 cross-compare remain blocked on legacy
  Beta production data access.
