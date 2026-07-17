# PrestiX

Travel agency management app for Le Prestigieux (client: Lucrèce BOUTOMBA).
Greenfield rewrite of `tripwise-monorepo`, modular monolith, PostgreSQL + Drizzle.
repo : prestix

See `plan.md` and `exploration-cache/` for project state.

## Current status (2026-07-17)

- Sprint 0 scaffold is complete.
- Sprints 1-9 backend/frontend are committed: bootstrap/auth/users/settings/RBAC,
  Party & Party History, Credit/Avoir, Proformas/Invoices/Delivery Notes, Payments,
  Créances, Stock, Commissions, and Épargne Voyage (savings).
- Sprint 10 (M12 — Dashboard & Reporting) is underway: `/api/reporting` backend
  (summary, CA composition, client/apporteur/employé KPIs, Excel/PDF export,
  recent-activity feed, employee activity drill-down), a real Dashboard page,
  and an employee activity drill-down UI are built end-to-end.
- Still pending: full reporting API/runtime smoke test end-to-end.
- See `changelog.md` and `exploration-cache/` for detailed, dated history.

## Dev

Run npm scripts from within each package (`packages/server`, `packages/client`), not from root, per Windows MINGW64 convention.

```bash
npm install
npm run dev:server
npm run dev:client
```
