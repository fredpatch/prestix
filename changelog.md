# Changelog

## Sprint 0

- Monorepo scaffold created (npm workspaces, packages/shared/types, packages/server, packages/client)
- Deployment infra added (docker-compose dev/staging/prod, nginx, deploy scripts)
- Sprint 1 backend foundation committed (bootstrap/auth/users/settings + JWT cookie auth + RBAC)
- Documentation and exploration cache synchronized with repository state

## Sprint 2 (2026-07-13)

- Added Party backend draft: list/search/filter, create/update, manager+ activation toggle, audit logging, and `/api/parties` route mount.
- Added Credit/Avoir backend draft: derived balance, dated lots, FIFO spend service, manager+ refund action, expired-unconverted lot query, and `/api/credit` route mount.
- Added Party History backend scaffold: agent+ `/api/parties/:id/history` route with separate commercial and épargne pagination contracts, ready to fill from M4 invoices and M11 savings.
- Added Party client draft: nav/routes, Parties list with search/role filter, create + quick-add dialogs, Party detail page with credit balance/lots and history placeholder tabs.
- Added Party edit dialog on the Party detail page, wired to the existing party update API.
- Added `requireManager` RBAC helper for Sprint 2 money/activation actions.
- Validation: server typecheck and client build pass; API/client smoke still pending for Party/Credit/History flows.

## Sprint 3 (2026-07-13)

- Added document-engine backend draft: proforma, invoice, delivery-note controllers/routes/services and API mounts.
- Added `proforma_lines` schema and document line snapshots for proforma/invoice flows.
- Added row-locked counter allocation for continuous `PRO-` and `INV-` numbers.
- Added invoice draft creation, line add/remove, proforma promotion, issue with `requestId` idempotency, admin cancellation with audit, and BL scaffold.
- Added proforma 48h expiry cron registration in the server job registry.
- Validation: server typecheck/build and client build pass; API smoke still pending for document routes.

## Validation Notes (2026-07-12)

- `npm run typecheck -w packages/server`: FAIL (TS5103, invalid `ignoreDeprecations`)
- `npm run db:seed` in `packages/server`: FAIL (exit 1)
- `docker compose up -d postgres api`: blocked (Docker daemon unavailable)
- `npm run format` from repo root: PASS
