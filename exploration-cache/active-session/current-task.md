## Task

Sprint 10 — Dashboard & Reporting (M12), underway (2026-07-17). Backend
reporting core, dashboard frontend, PDF/Excel export, recent-activity feed,
and employee activity drill-down (backend only) are built. See
`sessions/2026-07-17.md` for the full session log.

## Sprint 10 progress so far

Backend: `/api/reporting` module (summary, CA composition, client/apporteur/
employé KPIs, Excel export, PDF export, recent-activity, employee activity
detail drill-down). All date-range queries fixed for an end-of-day boundary
bug that was silently excluding same-day activity.

Frontend: real Dashboard page replacing the Sprint-1 placeholder — date
presets, accrual/cash toggle, summary tiles, CA composition, KPI tables,
recent-activity feed, PDF/Excel export actions. Refactored into a
`pages/dashboard/` module (hook + pure helpers + presentational components)
for maintainability, no behavioral change.

Real bug also fixed in passing: proforma→invoice promotion was dropping
`referrerPartyId`.

Employee activity drill-down is now complete end-to-end: the Employé KPI
panel uses a dedicated `EmployeeKpiTable` with a per-activity breakdown and a
drill-down link into `EmployeeActivityDetailPage` (`/reporting/employees/:agentId`),
which lists the agent's invoices/payments/commissions/stock/savings rows for
the selected date range and basis.

## Not yet done

- Reporting API/runtime smoke not yet run end-to-end.
- Global `Button` density change (smaller text/height) needs a visual pass
  across other pages that use it, not just the dashboard.
