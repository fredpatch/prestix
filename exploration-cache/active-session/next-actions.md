1. Apply/smoke migration `20260716082550_daffy_blacklash`.
2. Smoke `/api/savings/subscribe`, `/api/savings/party/:partyId`, deposits, withdrawals, transaction list, reversal, receipt PDF, and manual credit-conversion trigger.
3. Smoke invoice payment with `method: "epargne"`: sufficient balance succeeds atomically; insufficient balance blocks payment.
4. Smoke credit auto-conversion branches: existing savings account deposit, new account with fee deduction, and under-fee hold-for-review audit.
5. Smoke Party History epargne pagination from real savings transactions.
6. Build savings client UI for account overview, deposit/withdrawal, transaction history, receipt link, and reversal flow.
7. M12 dashboard will need to read ticket margin, stock low-threshold, commission agent/type/amount, savings subscription/deposit/withdrawal rows, and credit-conversion rows.
8. Deferred from Sprint 8: filter capability in the commission Settings tab.
9. Correction-request dialog only covers date/amount/note; revisit client/referent/type-specific fields if real usage requires it.
10. Sprint 12 hardening item: recordPayment -> createCreditLot cross-transaction risk on overpayment.
11. Deferred hardening item from Sprint 1: retrofit remaining hardcoded neutral/brand Tailwind pages to semantic tokens for full dark-mode coverage.
12. Open migration-backfill decisions still pending Lucrece: company-type party fields, credit-lot decision-window backfill, epargne fee/status backfill.
13. Still blocked: Beta prod data access is needed for the Sprint 11 migration dry-run and Sprint 5 M6 cross-compare gate.
