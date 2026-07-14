1. Apply/check payment-related schema migration in dev/staging stack
2. API smoke invoice issue payment plans: full and <=3 installments, sum validation, idempotency retry
3. API smoke payments: FIFO allocation, target installment override, overpayment change/credit, payment status recompute
4. API smoke admin reschedule and invoice cancel-to-credit from real paid rows
5. Keep migration/backfill decisions open: company parties, credit window, epargne backfill
