# Database Schema

Full Drizzle schema is committed in packages/server/src/db/schema.ts.

Current status:

- Enums and core tables are defined across M1-M12 domains.
- Startup default settings seed exists in start/services/parameters-seed.service.ts.
- Sprint 5 uses existing `penalties`, `installments`, `payments.allocation_target`, and `invoices.payment_status` schema to track weekly penalty accrual, penalty settlement, and principal-only payment status.
- Sprint 7 uses existing `stock_articles`, `stock_items`, `stock_movements`, and `shop_details.article_id` schema for article setup, row-locked stock balances, append-only movements, invoice issue OUT references, and cancellation compensation.
- Sprint 7 adds `proforma_shop_details` via migration `20260715180806_lazy_ultimo` so proforma shop lines can preserve article, supplier/selling price, and passenger metadata before invoice promotion.
- Remaining work is validation and runtime verification (migrations + smoke tests), not initial schema authoring.
