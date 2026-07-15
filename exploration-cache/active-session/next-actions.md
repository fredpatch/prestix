1. Sprint 8 (M10 — Commission Divers): read feasibility spec, plan
   commission_transactions schema-to-service work. Genuinely different shape
   from every module so far — autonomous, never touches the document engine.
2. General lesson from Sprint 7, worth remembering for all future zodResolver
   forms: every field the UI writes to react-hook-form state must be
   explicitly declared in the Zod schema, or it silently vanishes on submit
   with zero error. Audit existing forms (proforma/invoice composers) for any
   other fields that might have the same gap.
3. Deferred feature (person's own idea, Sprint 7): reusable per-page guide/
   help panel. Needs real content authored per page + a UX design pass
   (panel vs. toggleable handle). Filed in Notion backlog.
4. Below-threshold stock KPI display — data/query ready (listLowStockArticles),
   display is explicit M12 (Sprint 10) scope, same treatment as ticket margin.
5. Sprint 12 hardening item filed in Notion: recordPayment→createCreditLot
   cross-transaction risk on overpayment (see Notion backlog, Sprint 12)
6. Deferred hardening item (from Sprint 1): retrofit remaining hardcoded
   neutral-_/brand-_ Tailwind pages to semantic tokens for full dark-mode
   coverage
7. Open migration-backfill decisions still pending Lucrèce (see
   mongo-pg-migration-mapping.md): company-type party fields, credit-lot
   decision-window backfill, épargne fee/status backfill
8. STILL BLOCKED: Beta prod data access — needed for the Sprint 11 migration
   dry-run AND Sprint 5's M6 cross-compare gate (not yet done)
9. Open question from Sprint 6, still unanswered: should PNR/GDS/ticket-number
   appear on the printed document itself, or stay internal-only?
