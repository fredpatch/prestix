## Task

None active — Sprint 9 fully closed (2026-07-16), with one item explicitly
flagged rather than silently assumed correct. Awaiting direction on Sprint 10
(Dashboard & Reporting, M12).

## Sprint 9 close-out summary

Full Épargne Voyage module built: accounts, append-only ledger, SERIALIZABLE-
guarded withdrawal (balance is purely derived here, unlike stock's
materialized onHand counter — no single row to lock, so isolation level is
the actual protection), auto-conversion cron consuming Sprint 2's
listExpiredUnconvertedLots() hook, reversal (compensating entry, never
mutates the original), a real printable PDF receipt (4th document type on
the existing template), and épargne-as-payment wired into Sprint 4's
recordPayment().

Two real corrections made during smoke testing, both confirmed with Fred
directly rather than assumed:
- Standalone withdrawal was originally manager+ per the spec's literal
  wording. Real business rule: money only ever leaves an épargne account by
  being spent (ticket/shop purchase), never withdrawn as cash on demand.
  Raised to admin+, reframed in the UI as a deliberate exceptional override.
- The inscription fee was snapshotted as a number on the account row but
  never actually recorded as money moving anywhere — completely invisible in
  the ledger. Fred chose the more rigorous fix: a real deposit+withdrawal
  pair (nets to zero) on both entry paths, not just an on-screen
  confirmation.

Two items explicitly flagged, not closed, per Fred's direct instruction to
keep tracking them rather than assume they're done:
- The credit-conversion path's fee-visibility fix mirrors the direct-
  subscription fix in code, but wasn't independently re-verified with the
  same testing rigor after the correction was made. Needs deeper testing.
- Auto-converted deposits show as generic "Dépôt" in the ledger,
  indistinguishable from an ordinary cash deposit — needs a visible
  "Converti" distinction. UI/status hardening, deferred.

Three real bugs caught during the build itself (before any user-facing
testing): a schema edit accidentally dropped the recordedAt column while
making agentId nullable; getStringValue didn't exist in the settings service
at all; and the quantity field on deposits was over-engineered by mirroring
invoice-line shape onto something that doesn't have a real "quantity" concept.

## Next up

Sprint 10 — Dashboard & Reporting (M12). Not yet started. This is where every
"capture now, display later" deferral from Sprints 6-9 finally gets consumed:
ticket margin (Sprint 6), stock low-threshold (Sprint 7), commission
agentId/type/amount (Sprint 8), and épargne inscription fee → CA (Sprint 9)
all need real aggregation and display for the first time.
