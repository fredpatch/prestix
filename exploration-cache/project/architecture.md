# Architecture

Modular monolith. See packages/server/src/modules/ for module boundaries.
Full architecture doc: PrestiX_-_Tech_Stack__Phase3_.md (project knowledge).

HEAD implementation status:

- API entry: packages/server/src/index.ts
- Mounted modules: bootstrap, auth, users, settings, party, party-history, credit
- Cross-cutting middleware: authenticate.ts (JWT cookies), authorize.ts (role-level RBAC)
- Health endpoint: GET /api/health
- Client UI layer still scaffold-level; backend is currently ahead of frontend integration
