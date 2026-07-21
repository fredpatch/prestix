# Database Schema

Full Drizzle schema is committed in packages/server/src/db/schema.ts.

Current status:

- Enums and core tables are defined across M1-M12 domains.
- Startup default settings seed exists in start/services/parameters-seed.service.ts.
- Sprint 5 uses existing `penalties`, `installments`, `payments.allocation_target`, and `invoices.payment_status` schema to track weekly penalty accrual, penalty settlement, and principal-only payment status.
- Sprint 7 uses existing `stock_articles`, `stock_items`, `stock_movements`, and `shop_details.article_id` schema for article setup, row-locked stock balances, append-only movements, invoice issue OUT references, and cancellation compensation.
- Sprint 7 adds `proforma_shop_details` via migration `20260715180806_lazy_ultimo` so proforma shop lines can preserve article, supplier/selling price, and passenger metadata before invoice promotion.
- Sprint 9 updates `savings_transactions` via migration `20260716082550_daffy_blacklash`: adds `receipt_number`, adds `reversal_of_transaction_id`, and makes `agent_id` nullable for system-originated credit conversions.
- Sprint 10 reporting/analyse adds no new tables. `/api/reporting` aggregates existing invoices, proformas/proforma lines, invoice lines, payments, penalties, savings transactions, stock movements, parties, users, and commission tables. This matches the original "capture now, display later" M12 decision.
- Sprint 11d adds notifications via migration `20260721183222_third_christian_walker`: notification enums/table for in-app system messages, read state, priority/category, action URLs, actor/entity links, and metadata.
- Sprint 11d adds mail outbox via migration `20260721192747_petite_luke_cage`: delivery status enum plus recipient/subject/template/source/message-id/error/retry metadata for SMTP delivery tracking.
- Remaining work is validation and runtime verification (migrations + smoke tests), not initial schema authoring.
