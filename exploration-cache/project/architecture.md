# Architecture

Modular monolith. See packages/server/src/modules/ for module boundaries.
Full architecture doc: PrestiX_-_Tech_Stack__Phase3_.md (project knowledge).

HEAD implementation status:

- API entry: packages/server/src/index.ts
- Mounted modules: bootstrap, auth, users, settings, party, party-history, credit, documents (proformas/invoices/delivery-notes/payments)
- Cross-cutting middleware: authenticate.ts (JWT cookies), authorize.ts (role-level RBAC)
- Health endpoint: GET /api/health
- Client UI layer includes Sprint 1 admin screens, Sprint 2 Party list/detail/edit draft, Sprint 3 document list/detail/create/referrer draft, and Sprint 4 invoice payment draft; epargne data sources remain future work
