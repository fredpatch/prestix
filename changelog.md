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
- Added `requireManager` RBAC helper for Sprint 2 money/activation actions.
- Validation: `npm run typecheck -w packages/server` passes; API smoke still pending for Party/Credit/History endpoints.

## Validation Notes (2026-07-12)

- `npm run typecheck -w packages/server`: FAIL (TS5103, invalid `ignoreDeprecations`)
- `npm run db:seed` in `packages/server`: FAIL (exit 1)
- `docker compose up -d postgres api`: blocked (Docker daemon unavailable)
- `npm run format` from repo root: PASS
