1. Sprint 10 (M12 - Dashboard & Reporting) is closed in code after the July 19
   analysis-section pass. Still needed before beta confidence: full reporting/
   analyse API-runtime smoke across summary, trends, KPIs, exports, employee
   drill-down, creances, and party-history commercial display.
2. Sprint 11c (UI hardening) is now CLOSED (2026-07-21) — all three phases
   done: foundations (font/type-scale/React Query/Sonner), contained fixes
   (toasts/Select/Calendar/composer split), and the architectural migration
   (React Hook Form extended to all remaining dialogs, generic
   `DataTable`/`ReadOnlyTable` components, full React Query hooks migration
   across every page and dialog mutation). Not yet manually smoke-tested in
   a running app — typecheck-verified only. Two real priorities remain,
   neither yet individually scoped: (a) notifications (Sprint 11d), (b)
   Journal d'audit (Sprint 11e, full filterable page).
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
8. Open migration-backfill decisions — now moot, tied to the cancelled
   Sprint 11 (was: company-type party fields, credit-lot decision-window
   backfill, epargne fee/status backfill for a Mongo migration that no
   longer happens).
9. Open question from Sprint 6, still unanswered: should PNR/GDS/ticket-number
   appear on the printed document itself, or stay internal-only?
