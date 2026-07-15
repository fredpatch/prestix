1. Smoke `/api/stock` list/create/update/active/restock/movements with agent vs manager role gates.
2. Apply/smoke migration `20260715180806_lazy_ultimo` for `proforma_shop_details`.
3. Smoke proforma shop details create/read/promote into invoice shop details.
4. Smoke direct invoice shop details create/read/add-line behavior.
5. Smoke invoice issue with shop lines carrying `articleId`: stock OUT created inside issue transaction and duplicate issue/request handling stays idempotent.
6. Smoke insufficient stock rejection for normal issue and manager negative override audit path.
7. Smoke invoice cancellation creates compensating stock adjustment for each recorded shop OUT movement.
8. Plan/build the client stock article picker and shop-line passenger/article capture.
9. Open question from Sprint 6, still unanswered: should PNR/GDS/ticket-number appear on the printed document itself, or stay internal-only?
10. Sprint 12 hardening item: recordPayment -> createCreditLot cross-transaction risk on overpayment.
11. Deferred hardening item from Sprint 1: retrofit remaining hardcoded neutral/brand Tailwind pages to semantic tokens for full dark-mode coverage.
12. Open migration-backfill decisions still pending Lucrece: company-type party fields, credit-lot decision-window backfill, epargne fee/status backfill.
13. Still blocked: Beta prod data access is needed for the Sprint 11 migration dry-run and Sprint 5 M6 cross-compare gate.
