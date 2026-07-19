1. Sprint 10 (M12 - Dashboard & Reporting) is closed in code after the July 19
   analysis-section pass. Still needed before beta confidence: full reporting/
   analyse API-runtime smoke across summary, trends, KPIs, exports, employee
   drill-down, creances, and party-history commercial display.
2. Sprint 11 starts next: Mongo->PG migration scripts, dry-run tooling,
   reconciliation report, and historical warning handling. This is still
   blocked until legacy Beta production data access is available.
3. FLAGGED, not closed (Sprint 9): credit-conversion path's fee-visibility
   fix needs deeper independent testing - code mirrors the direct-subscription
   fix but wasn't re-verified with the same rigor.
4. FLAGGED, not closed (Sprint 9): auto-converted epargne deposits need a
   visible "Converti" distinction from ordinary cash deposits in the ledger UI.
5. Notion write failed mid-Sprint-9 with a "No approval received" tool error -
   retry logging the auto-converted-deposit item once Notion access is
   confirmed working again.
6. Sprint 12 hardening item filed in Notion: recordPayment->createCreditLot
   cross-transaction risk on overpayment (see Notion backlog, Sprint 12).
7. Deferred hardening item (from Sprint 1): retrofit remaining hardcoded
   neutral-*/brand-* Tailwind pages to semantic tokens for full dark-mode
   coverage.
8. Open migration-backfill decisions still pending Lucrece (see
   mongo-pg-migration-mapping.md): company-type party fields, credit-lot
   decision-window backfill, epargne fee/status backfill.
9. STILL BLOCKED: Beta prod data access - needed for the Sprint 11 migration
   dry-run AND Sprint 5's M6 cross-compare gate.
10. Open question from Sprint 6, still unanswered: should PNR/GDS/ticket-number
    appear on the printed document itself, or stay internal-only?
