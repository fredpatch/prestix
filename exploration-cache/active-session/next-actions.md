1. Sprint 9 (M11 — Épargne Voyage): read feasibility spec, plan savings
   accounts/ledger schema-to-service work. EPARGNE_INSCRIPTION_FEE = 5000 XAF
   already confirmed at project kickoff (see decisions.md).
2. M12 dashboard (Sprint 10) will need to read: ticket margin (Sprint 6),
   stock low-threshold (Sprint 7), and commission agentId/type/amount
   (Sprint 8) — all three are capture-only right now, no display anywhere.
3. Deferred from Sprint 8: filter capability in the commission Settings tab.
4. Correction-request dialog only covers date/amount/note — client/référent
   and type-specific dynamic fields deliberately out of scope for the first
   pass. Revisit if real usage shows it's needed.
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
