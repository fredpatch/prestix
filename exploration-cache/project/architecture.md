# Architecture

Modular monolith. See packages/server/src/modules/ for module boundaries.
Full architecture doc: PrestiX_-_Tech_Stack__Phase3_.md (project knowledge).

HEAD implementation status:

- API entry: packages/server/src/index.ts
- Mounted modules: bootstrap, auth, users, settings, party, party-history, credit, documents (proformas/invoices/delivery-notes/payments), penalties/creances, stock
- Cross-cutting middleware: authenticate.ts (JWT cookies), authorize.ts (role-level RBAC)
- Health endpoint: GET /api/health
- Document PDF exports: invoices, proformas, and delivery notes share the invoice print template and log `DOCUMENT_PRINTED` audit entries; invoice PDFs can render installment schedules and ticket rows can render return dates.
- Stock backend: `/api/stock` exposes agent+ article/movement reads and manager+ setup/restock actions; invoice issue records shop stock OUT movements in the invoice transaction, while cancellation creates compensating adjustments.
- Document shop details: proforma and invoice line services now persist/return shop metadata, and proforma promotion carries shop article/passenger/pricing details into invoice lines.
- Client UI layer includes Sprint 1 admin screens, Sprint 2 Party list/detail/edit draft, Sprint 3 document list/detail/create/referrer draft, dedicated Proforma/Invoice creation pages, Sprint 4 invoice payment draft, Sprint 5 creances/payment-penalty draft, and Sprint 7 stock article/client shop-detail draft; routed pages set title/back/badge through `PageHeaderProvider`; epargne data sources remain future work
