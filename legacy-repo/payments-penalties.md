# Legacy Reference - Payments, Échéancier & Pénalités (M5, M6)

> Source: legacy receivables logic (`reporting-hardening.md`) + CDC v2 §3/§4 + Meeting 4. The legacy's penalty engine was thin; PrestiX rules are stronger and come mostly from CDC v2 - treat CDC v2 as authoritative here, legacy as secondary.

## Overdue definition (KEEP from legacy)

- **Overdue = status `issued` AND `dueDate < today`.** Source of truth for receivables KPIs = the reporting/receivables aggregation, NOT ad-hoc invoice filters.
- **"Impayées" (unpaid) ≠ "En retard" (overdue)** - never conflate. Unpaid = issued regardless of date; overdue = past due date.

## Échéancier rules (CDC v2 §3 - authoritative)

- `MAX_INSTALLMENTS = 3` per invoice.
- Payment mode chosen at issue: full **or** installments.
- Each échéance: expected date + amount.
- **Invoice final due date = date of the last échéance.**
- Installment status auto-updates on payment.
- Échéancier visible on invoice detail AND on the printed invoice.

## Penalty rules (CDC v2 §4 + Meeting 4 - authoritative, non-negotiable)

- `PENALTY_AMOUNT_XAF = 2500`, fixed.
- Starts **1 week after** a missed échéance date.
- **Accumulates in parallel and independently per échéance.** If échéance 1 and échéance 2 are both overdue, **two penalties accumulate simultaneously**, each continuing until its own échéance is fully settled.
- **No manual waiver.** The "renoncer à la pénalité" option is removed entirely - once triggered, a penalty cannot be cancelled by any role.

## Implementation notes (monolith + PG)

- Penalty accrual is a **`node-cron` job** (per reference stack) that runs daily: for each unsettled overdue échéance past its 1-week grace, accrue +2500 for each full week late, per échéance.
- Model penalties as their own rows keyed to `(invoiceId, installmentId)` so parallel independent accumulation is natural - never a single penalty field on the invoice.
- Business rules as **named constants**, not magic numbers.
- Because this is money: back these rules with a **dedicated test suite**, and validate outputs against the legacy Beta on migrated data (cross-compare gate).

## Legacy caveat (FIX)

- Legacy settings doc noted **grace/penalty were frontend-only constants**, not persisted, and warned not to let settings PATCH overwrite them until overdue logic was updated. **In PrestiX, penalty parameters live server-side** (named constants or a settings row), single source of truth.
