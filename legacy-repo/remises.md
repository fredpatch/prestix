# Legacy Reference - Remises / Discounts (M7)

> Source: legacy `invoice-service` (invoice model + `invoice.calculation.ts` + `invoice.helpers.ts`). Target: monolith + PG.
> Status: **partial oracle** - the legacy has a working discount model, but it's simpler than what CDC v2 §5 leaves open.

## What the legacy actually does (KEEP as baseline)

- **Line-level discount:** each invoice item carries a `discount` field.
- **Fixed amount, not percentage:** `discount: Number, min 0, default 0`. No percentage type anywhere.
- **Invoice discount = sum of line discounts:** `invoice.calculation.ts` computes `discount = items.reduce((sum, item) => sum + (item.discount ?? 0), 0)`. So the invoice-level discount is **derived** from line discounts, not entered separately.

**This means the legacy already answers half of CDC v2 §5's open question:** discounts are **line-level, fixed-amount**, and the invoice total reflects them. This matches CDC v2 §5's requirement "remise applicable au niveau des billets (ligne)".

## What's still open (CDC v2 §5 - decide at M7 feasibility)

CDC v2 §5 open point: _"montant fixe ou pourcentage, remise ligne ou remise facture globale - à trancher en feasibility."_

| Question                        | Legacy answer                              | Decision needed                                                   |
| ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| Fixed amount vs percentage      | **Fixed amount** (legacy)                  | Keep fixed, or add % option?                                      |
| Line vs global invoice discount | **Line-level, summed to invoice** (legacy) | Keep line-only, or also allow a separate global invoice discount? |

**Recommendation for feasibility:** keep the legacy's proven model as V1 - **fixed-amount, line-level discount, invoice total = sum of line discounts**. It satisfies CDC v2 §5's stated needs (appears on invoice, applicable to tickets/lines). Defer percentage and separate-global-discount to V2 (already parked as "advanced discount rules ➤" in Phase 1 §8) unless the client insists otherwise.

## Invariants to enforce (KEEP)

- Discount `>= 0`, never negative.
- Applied discount **must appear on the printed invoice** (CDC v2 §5) - legacy computes it into totals; ensure the print template surfaces it as a line and/or summary row.
- Discount only mutable while the document is `draft` (same draft-only rule as all invoice mutations - see document-workflow.md).

## Target (monolith + PG)

- `discount` column on the invoice-line table (numeric, default 0). Invoice-level discount is a derived sum (SQL or computed in the `documents` service), not a stored duplicate.
- Print template (Puppeteer) shows per-line discount and a total discount summary row.

## To confirm at M7 feasibility (append answer later)

- [ ] Client decision: fixed-only (V1) vs add percentage
- [ ] Client decision: line-only (V1) vs allow global invoice-level discount
- [ ] Interaction with penalties/CA: discount reduces CA - confirm it's netted correctly in M12 KPIs
