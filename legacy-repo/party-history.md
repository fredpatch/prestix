# Legacy Reference - Party & History (M3)

> Source: `party-history-pattern.md`. Target: monolith + PG.

## Core principle (KEEP)

`Party` is the central registry of clients (buyers) and referrers (apporteurs). The party history view shows a customer's **commercial (invoices)** and **savings (épargne)** history - **two semantically separate sections that must never be merged**.

## Invariants (KEEP)

- **Commercial vs épargne are distinct** - épargne is BALANCE_FLOW, never in CA/revenue/receivables.
- **Party snapshots on invoices** are copied from the party record at document creation - not re-read live (see document-workflow.md).
- **Only post-issuance invoices** appear in party history; drafts do not.
- **Available épargne balance** is derived at query time, never stored (see savings-ledger.md).
- Breakdown labels are human: `shop` → "Boutique", `ticketing` → "Billets", etc. - not raw keys.

## Legacy frontend gaps (FIX)

The legacy `party-service` was "complete backend, partial frontend" - `CustomerPage`/`ClientPage` were **stubs**, Kafka consumers were **stubs**, and **party stats always returned 0**. So: **trust the legacy's party data model, but its party UI + stats are unfinished - build these fresh, don't port stubs.**

- Legacy pagination bug worth avoiding: two paginated sections must use **distinct URL params** (`?page=` for invoices, `?epargnePage=` for savings) so one section doesn't reset the other.

## PrestiX target

- `party` module: `parties` (type: client | referrer, or a flag for both), contact, status, credit balance.
- Credit balance: decide in feasibility whether derived (ledger-style, safer) or maintained. Legacy had a "credit engine" - inspect at M3 feasibility (code-level pull, append here).
- History endpoints per domain; distinct pagination; commercial and savings sections separate.

## To capture at M3 feasibility (code-level, append later)

- [ ] Exact party credit-balance mechanism (derived vs stored)
- [ ] Referrer (apporteur) → referred-invoice linkage shape
- [ ] Party code/search fields
