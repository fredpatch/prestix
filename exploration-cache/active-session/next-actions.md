1. Smoke `/api/stock` list/create/update/active/restock/movements with agent vs manager role gates.
2. Smoke invoice issue with shop lines carrying `articleId`: stock OUT created inside issue transaction and duplicate issue/request handling stays idempotent.
3. Smoke insufficient stock rejection for normal issue and manager negative override audit path.
4. Smoke invoice cancellation creates compensating stock adjustment for each recorded shop OUT movement.
5. Plan/build the client stock article picker and shop-line passenger/article capture.
6. Open question from Sprint 6, still unanswered: should PNR/GDS/ticket-number appear on the printed document itself, or stay internal-only?
7. Sprint 12 hardening item: recordPayment -> createCreditLot cross-transaction risk on overpayment.
8. Deferred hardening item from Sprint 1: retrofit remaining hardcoded neutral/brand Tailwind pages to semantic tokens for full dark-mode coverage.
9. Open migration-backfill decisions still pending Lucrece: company-type party fields, credit-lot decision-window backfill, epargne fee/status backfill.
10. Still blocked: Beta prod data access is needed for the Sprint 11 migration dry-run and Sprint 5 M6 cross-compare gate.
