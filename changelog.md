# Changelog

## Sprint 0

- Monorepo scaffold created (npm workspaces, packages/shared/types, packages/server, packages/client)
- Deployment infra added (docker-compose dev/staging/prod, nginx, deploy scripts)
- Sprint 1 backend foundation committed (bootstrap/auth/users/settings + JWT cookie auth + RBAC)
- Documentation and exploration cache synchronized with repository state

## Validation Notes (2026-07-12)

- `npm run typecheck -w packages/server`: FAIL (TS5103, invalid `ignoreDeprecations`)
- `npm run db:seed` in `packages/server`: FAIL (exit 1)
- `docker compose up -d postgres api`: blocked (Docker daemon unavailable)
- `npm run format` from repo root: PASS
