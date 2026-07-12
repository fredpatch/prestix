# Legacy Reference - Épargne Voyage / Savings Ledger (M11)

> Source: `ledger-balance-flow.md`. Target: monolith + PG.

## Core principle (KEEP)

Épargne uses an **append-only transaction ledger** as the source of truth. **Balance is never stored as a mutable field** - it is always derived from recorded transactions. Withdrawal is guarded against insufficient funds at the service layer.

## Lifecycle (KEEP)

```
[Create SavingsTransaction]  → status: draft
   → nature: deposit | withdraw
   → totalAmount = amount * quantity   (SERVER-computed; client value ignored)
[recordTransaction(id)]
   IF nature == withdraw:
     availableBalance = Σ(recorded deposits) − Σ(recorded withdrawals)  for (partyId, currency)
     if withdrawAmount > availableBalance → 400 INSUFFICIENT_EPARGNE_BALANCE
   → status: recorded (immutable)
```

## Invariants (KEEP - non-negotiable)

- **Balance derived, never stored** - `SUM(recorded deposits) − SUM(recorded withdrawals)` per `(partyId, currency)`.
- **Draft transactions don't affect the guard balance.**
- **`recorded` is immutable** - only drafts are editable.
- **`totalAmount` server-computed** from `amount * quantity`; `amount > 0`, `quantity >= 1`.
- **Épargne is NOT revenue** - must never appear in CA, invoice totals, or receivables KPIs.
  - ⚠️ PrestiX addition (Meeting 4): **inscription fee** for a new saver **DOES count in CA**; only deposit/withdraw **transactions** stay out. Two distinct flows - keep them separate.
- **Party history:** commercial (invoices) and épargne sections are separate, paginated independently.

## Legacy risks to FIX

- **Withdrawal race condition:** legacy relied on a Mongo session to make the balance-check + status-update atomic. **In PG: do the check and the insert in one `SERIALIZABLE` (or row-locked) transaction** - cleaner guarantee.
- **Historical negative balances** (pre-guard data): surface as a warning on migration, don't silently hide.
- **Global vs customer balance label confusion:** "Solde net (période)" ≠ "Solde disponible client". Keep labels explicit.
- Legacy had **stale invoice-related dead code** in the savings service and an **unimplemented cancel route** - build cancel properly, don't port the dead code.

## Target notes (monolith + PG)

- `savings` module: `savings_accounts` (identity/registration + inscription fee → CA) + `savings_transactions` (append-only ledger, out of CA).
- Balance = SQL aggregate or a maintained materialized view; guard runs inside the record transaction.
- Expose party-level summary + history for the Party history page.
