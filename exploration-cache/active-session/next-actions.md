1. Smoke `/creances` and `/api/creances` aggregation with and without the overdue filter
2. Smoke penalty accrual against overdue unpaid/partial installments and confirm paid installments are skipped
3. Smoke payment recording with `allocationTarget: "penalty"` and verify penalty rows do not mark principal paid
4. Add the dedicated penalty test suite with named constants before closing Sprint 5
5. Keep migration/backfill decisions open: company parties, credit window, epargne backfill
