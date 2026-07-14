1. Validate server/client builds after payment UI and `payment_status` migration changes
2. Apply/check payment-related schema migrations in dev/staging stack
3. API/client smoke invoice issue payment plans: full and <=3 installments, sum validation, idempotency retry
4. API/client smoke payments: FIFO allocation, target installment override, overpayment change/credit, payment status recompute, admin reschedule
5. Keep migration/backfill decisions open: company parties, credit window, epargne backfill
