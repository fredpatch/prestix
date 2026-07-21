# Architecture

Modular monolith. See packages/server/src/modules/ for module boundaries.
Full architecture doc: PrestiX_-_Tech_Stack__Phase3_.md (project knowledge).

HEAD implementation status:

- API entry: packages/server/src/index.ts
- Mounted modules: bootstrap, auth, users, settings, party, party-history, credit, documents (proformas/invoices/delivery-notes/payments), penalties/creances, stock, commissions, savings, reporting, audit-log
- Cross-cutting middleware: authenticate.ts (JWT cookies), authorize.ts (role-level RBAC)
- Health endpoint: GET /api/health
- Document PDF exports: invoices, proformas, and delivery notes share the invoice print template and log `DOCUMENT_PRINTED` audit entries; invoice PDFs can render installment schedules and ticket rows can render return dates.
- Stock backend: `/api/stock` exposes agent+ article/movement reads and manager+ setup/restock actions; invoice issue records shop stock OUT movements in the invoice transaction, while cancellation creates compensating adjustments.
- Document shop details: proforma and invoice line services now persist/return shop metadata, and proforma promotion carries shop article/passenger/pricing details into invoice lines.
- Savings backend: `/api/savings` exposes direct subscription, deposits, manager withdrawals, admin reversals, transaction listing, withdrawal receipt PDFs, and super_admin credit auto-conversion trigger; daily credit-window auto-conversion is registered in jobs.
- Reporting backend: `/api/reporting` is agent+ read-only aggregation over existing module data. It serves dashboard summary, CA composition/trends, service trend, client/apporteur/employe KPIs, employee activity detail, recent activity, creances by party, accrual-vs-cash comparison, open engagements, and selectable-module PDF/Excel exports.
- Audit log backend: `/api/audit-log` is admin+ read-only over the existing `audit_log` table, with filters for user/action/entity/date and distinct action/entity helper endpoints.
- Party history: `/api/parties/:id/history` now fills both independent sections. Commercial history lists party invoices and proformas; epargne history lists savings ledger transactions.
- Client UI layer includes Sprint 1 admin screens, Sprint 2 Party list/detail/edit, Sprint 3 document list/detail/create/referrer flows, dedicated Proforma/Invoice creation pages, Sprint 4 invoice payment flow, Sprint 5 creances/payment-penalty flow, Sprint 7 stock article/client shop-detail flow, Sprint 8 commission UI, Sprint 9 savings UI, Sprint 10 dashboard, the `/analyse` tabbed analysis section, and the admin+ `/audit-log` page; routed pages set title/back/badge through `PageHeaderProvider`.
