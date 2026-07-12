# Legacy Reference - PrestiX Rewrite

> Distilled from the legacy `tripwise-monorepo` (microservices + Kafka + MongoDB).
> Purpose: consult these instead of re-cloning/grepping the legacy. Each doc keeps the **proven business logic and invariants**, translated to our target: **modular monolith + PostgreSQL/Drizzle**.
> Rule of translation applied throughout:
>
> - **Kept:** business invariants, lifecycle rules, edge cases, known gaps to fix.
> - **Dropped/translated:** Kafka events, gateway/JWT-forwarding, `/internal/mark-invoiced` HTTP hops, per-service Mongo → all become **in-process service calls inside one DB transaction**.
> - **Mongo → PG:** "derive via aggregation" → SQL `SUM`/views; "non-blocking fire-and-forget cross-service call" → **synchronous call in the same transaction** (monolith removes the failure mode entirely).

## Index

| Doc                     | Modules         | Source patterns                                               |
| ----------------------- | --------------- | ------------------------------------------------------------- |
| `document-workflow.md`  | M4, M8, M9, M10 | document-first-workflow, data-flow                            |
| `payments-penalties.md` | M5, M6          | (reporting-hardening receivables) + CDC v2 §3/§4              |
| `stock-shop.md`         | M9              | stock-linked-sales                                            |
| `savings-ledger.md`     | M11             | ledger-balance-flow                                           |
| `party-history.md`      | M3              | party-history-pattern                                         |
| `auth-settings.md`      | M1, M2          | authentication, settings-architecture                         |
| `dashboard-kpi.md`      | M12             | reporting-hardening                                           |
| `commission-divers.md`  | M10             | assurance + mobile-money (real) + visa/rental/housing (stubs) |
| `remises.md`            | M7              | invoice-service discount model (partial oracle)               |

> Per-module **code-level** detail (exact numbering counters, field shapes) is captured just-in-time during Phase 2 feasibility, appended to the relevant doc below.

## Oracle coverage map - how much legacy is worth mining per module

Not every module has real legacy code. Know this before pulling, so no one hunts for logic that's a UI stub:

| Module                   | Legacy oracle strength | Notes                                                                             |
| ------------------------ | ---------------------- | --------------------------------------------------------------------------------- |
| M4 Document Engine       | **High**               | Real, mature; mine invariants, fix id-rebinding hack                              |
| M5/M6 Payments/Penalties | **Low-Medium**         | CDC v2 is authoritative; legacy penalty was thin                                  |
| M9 Stock/Shop            | **High**               | Real stock-linked-sales pattern                                                   |
| M11 Épargne              | **High**               | Real ledger pattern, well-audited                                                 |
| M3 Party                 | **Medium**             | Backend real, frontend/stats were stubs                                           |
| M1/M2 Auth/Settings      | **Medium**             | Keep invariants, drop gateway/Kafka                                               |
| M12 Dashboard/KPI        | **High**               | Real, plus documents the exact bug to fix                                         |
| M10 Commission Divers    | **Mixed**              | Assurance + Mobile Money real; Visa/Location/Hébergement stubs; Transfert net-new |
| M7 Remises               | **Partial**            | Line-level fixed-amount discount exists; % + global open                          |
| M8 Billetterie           | **Medium**             | Real ticketing service; `prem`/Premium abbrev conflict open                       |
