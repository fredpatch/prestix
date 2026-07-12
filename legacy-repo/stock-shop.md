# Legacy Reference - Stock-Linked Sales (M9)

> Source: `stock-linked-sales.md`. Target: monolith + PG.

## Core principle (KEEP)

A shop order line can carry an optional `stockArticleId`. When the **parent invoice is issued**, a **stock OUT movement** is created. Triggered by **invoice issuance**, not by shop-order creation.

## Lifecycle (KEEP, translated)

```
[Operator adds shop line, selects stockArticleId (optional)]
[invoice.issue()]
   → for each shop line with stockArticleId:
       if NOT already moved (refType='SHOP_ORDER', refId=lineId):   ← idempotency
         create StockMovement { type: OUT, quantity, stockBefore, stockAfter }
         stockItem.onHand -= quantity
         if onHand < minLevel → below-threshold warning
```

## Invariants (KEEP)

- **Auto-OUT allows negative stock** (`blockNegative = false`): system records the movement even if onHand goes negative - never blocks an issue over stock.
- **Manual OUT/ADJUST blocks negative** (`blockNegative = true`): rejected with 400.
- **Idempotency:** `refType + refId` guard prevents duplicate movements on re-issue/retry.
- **`stockArticleId` optional** - lines without it produce no movement (pure service items).

## Translation to monolith (SIMPLIFY)

- Legacy did stock-OUT as a **non-blocking cross-service HTTP call** → could fail silently, needed a re-sync route, could produce drift.
- **PrestiX: stock decrement happens in the same DB transaction as `issue()`.** If the transaction commits, stock moved; if it rolls back, nothing moved. **No fire-and-forget, no re-sync route, no drift.** Keep the idempotency guard anyway (protects against a re-issue attempt on an already-issued doc).

## PrestiX scope decision (from this session)

- **V1:** shop items are **invoice lines only**. Even a walk-in buying only a shop item gets a shop-only invoice. Stock decrements on issue. Each shop line linked to a **designated passenger** (distinct from the invoice buyer - CDC v2 §1).
- **V2:** standalone **POS receipt** mode for high-frequency low-value sales (Papeterie). Separate receipt + stock flow - prototype for owner decision. Not in V1.

## Target notes

- `stock` module: `stock_articles`, `stock_items` (onHand, minLevel), `stock_movements` (append-only, typed IN/OUT/ADJUST).
- onHand is derived-or-maintained from movements; below-threshold surfaced in operational KPIs only (never on revenue cards - see dashboard-kpi.md).
