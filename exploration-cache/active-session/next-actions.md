1. Sprint 10 (M12 — Dashboard & Reporting): read feasibility spec, plan
   aggregation queries. Four separate "capture now, display later" deferrals
   converge here: ticket margin (S6), stock low-threshold (S7), commission
   agentId/type/amount (S8), épargne inscription fee (S9).
2. FLAGGED, not closed (Sprint 9): credit-conversion path's fee-visibility
   fix needs deeper independent testing — code mirrors the direct-
   subscription fix but wasn't re-verified with the same rigor.
3. FLAGGED, not closed (Sprint 9): auto-converted épargne deposits need a
   visible "Converti" distinction from ordinary cash deposits in the ledger
   UI — currently indistinguishable.
4. Notion write failed mid-Sprint-9 with a "No approval received" tool error
   — retry logging the auto-converted-deposit item once Notion access is
   confirmed working again.
5. Sprint 12 hardening item filed in Notion: recordPayment→createCreditLot
   cross-transaction risk on overpayment (see Notion backlog, Sprint 12)
6. Deferred hardening item (from Sprint 1): retrofit remaining hardcoded
   neutral-*/brand-* Tailwind pages to semantic tokens for full dark-mode
   coverage
7. Open migration-backfill decisions still pending Lucrèce (see
   mongo-pg-migration-mapping.md): company-type party fields, credit-lot
   decision-window backfill, épargne fee/status backfill
8. STILL BLOCKED: Beta prod data access — needed for the Sprint 11 migration
   dry-run AND Sprint 5's M6 cross-compare gate (not yet done)
9. Open question from Sprint 6, still unanswered: should PNR/GDS/ticket-number
   appear on the printed document itself, or stay internal-only?
10. Pre-existing gap noted during Sprint 9, not fixed (out of scope): party-
    history's "commercial" section is still an unfilled Sprint 3 TODO.
