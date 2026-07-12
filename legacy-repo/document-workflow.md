# Legacy Reference - Document Workflow (M4, M8, M9, M10)

> Source: `document-first-workflow.md`, `data-flow.md`. Target: monolith + PG.

## Core principle (KEEP)

All commercial revenue flows through an **invoice document**. Service orders (Billetterie, PrestiShop, and - in legacy - commission types) are created independently, then **attached** to a draft proforma, which is promoted to an invoice. **`issue()` is the single commitment point** that triggers all downstream state changes.

> ⚠️ PrestiX divergence from legacy: per CDC v2 §1, **only Billetterie + PrestiShop** ride this workflow. Commissions (M10) are **autonomous** - they do NOT attach to invoices. So the "attach commission order to invoice" path in the legacy is **dropped**.

## Lifecycle (KEEP, translated)

```
[Create service order (ticket / shop line)]        → status: draft
[Create proforma OR attach to existing draft]      → order: attached; doc: draft
[Promote proforma → invoice]                        (optional intermediate)
[issue(invoiceId)]
   → invoice status: issued
   → assign invoiceNumber (e.g. INV-YYYYMM-XXXX via Counter)
   → mark each attached order: invoiced (terminal)
   → shop lines with stockArticleId → create stock OUT movement
[applyPayment()]                                     → paymentStatus: partial | paid
[DeliveryNote]                                       (optional, after issuance)
```

## Invariants (KEEP - these are non-negotiable business rules)

- **Draft-only mutations:** `addLine` / `removeLine` / `updateDraft` throw if document is not `draft`. (Answers our M9 edge case: no mutating an issued invoice - add before conversion or make a new one.)
- **`issue()` idempotent** via a `requestId` - duplicate issue calls never double-issue.
- **Payment only when `issued`** - cannot pay a draft/proforma.
- **Delivery notes are separate documents** - do not re-trigger issuance.
- **Cancellation is terminal** - cancelled documents have no exit path.
- **Snapshots:** buyer/referrer and service details are **copied onto the invoice at creation**, not re-read live later. Historical documents stay stable even if the party record changes.
- **Proforma 48h expiry** (CDC v2 §1): auto-status `Expirée`, no auto-cancel; invoice creation blocked from an expired proforma.

## Legacy bug we must NOT reproduce (FIX)

- **ProformaId/InvoiceId rebinding:** legacy stored `order.invoiceId = proformaId` during attach, and `issue()` had to rebind to the real invoice id before marking orders invoiced - else it silent-matched zero rows. **In the monolith with FKs, model the proforma→invoice relation explicitly (one row, status transition, or a proper FK) so no id-rebinding hack is needed.**
- **Fire-and-forget sync failures:** legacy's `mark-invoiced` and stock-OUT were non-blocking HTTP calls that could fail silently and drift. **In the monolith, these are in-process calls inside the same DB transaction as `issue()` - atomic, no drift, no re-sync route needed.** This is the single biggest simplification the rewrite buys us.

## Target notes (monolith + PG)

- `documents` module owns Proforma / Invoice / DeliveryNote + InvoiceLine. Numbering via a `counters` table (row-locked `SELECT … FOR UPDATE` to avoid gaps/races).
- `issue()` = one transaction: set status, allocate number, mark order lines invoiced, decrement stock. All-or-nothing.
- No gateway, no `/internal/*` routes, no `x-user-id` forwarding - actor comes from the authenticated request context.
