# Legacy Reference - Dashboard & KPI (M12)

> Source: `reporting-hardening.md`. Target: monolith + PG. This is the module with the **known KPI bug** the client explicitly asked to fix (Meeting 4).

## KPI invariants (KEEP - these are the corrections the legacy already learned the hard way)

- **Overdue** = status `issued` AND `dueDate < today`. Single authoritative source = the receivables aggregation. Do **not** compute overdue from ad-hoc invoice filters (legacy's original bug).
- **"Impayées" (unpaid) ≠ "En retard" (overdue)** - distinct cards, distinct meaning. Unpaid = issued regardless of date.
- **Revenue cards use issued invoices only** - drafts and cancelled excluded.
- **Stock KPIs** (`belowThresholdCount`, `totalOnHandUnits`) belong in **operational/stock sections only** - never next to CA/revenue cards.
- **Épargne "Solde net"** is a global period-flow metric - must NOT be labeled a customer available balance, and must NOT enter CA totals.
- **Consistent date range** (`from`/`to`) across all dashboard sections.

## Meeting 4 requirements (PrestiX additions - authoritative)

- **Fix the current KPI bug** (the legacy overdue-source mismatch above is the likely culprit - verify at M12 feasibility).
- **Date filter:** presets + custom range.
- **CA Global composition:** instead of one opaque total, the KPI cards break the CA down by source - e.g. Billetterie 100 000 / Commission 50 000 / Assurance 50 000 = 200 000. Each contributing source shown.
- **Keep** existing KPIs already delivered: Client/Acheteur, Apporteur/Référent, Employé.

## Translation to monolith (SIMPLIFY)

- Legacy pulled KPIs from multiple services (invoice-service summary + reporting endpoint + stock summary) over HTTP, with date-range mismatches as a documented risk.
- **PrestiX: one `reporting` module querying one PostgreSQL database** - CA composition is a single grouped SQL query (`GROUP BY service_type`), overdue is one query, all sharing the same `from`/`to`. The whole class of "wrong endpoint / date mismatch / source drift" bugs disappears.

## To capture at M12 feasibility (append later)

- [ ] Confirm the exact current KPI bug in legacy (reproduce, root-cause)
- [ ] Final list of CA composition buckets (Billetterie, each Commission type, Épargne-inscription, Shop…)
- [ ] Employee KPI definition (what "employé" attributes to whom)
