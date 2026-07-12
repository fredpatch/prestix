# Sprint 0 — Initialization

- [x] Kick-off with Lucrèce (EPARGNE_INSCRIPTION_FEE=5000 XAF, prm=Premium resolved)
- [x] Monorepo scaffold
- [x] Deployment infra (docker-compose dev/staging/prod, nginx, Dockerfiles, deploy scripts)
- [ ] Docker env — compose file exists, never run end-to-end (postgres+api up, /api/health reachable)
- [~] Full Drizzle schema — committed (packages/server/src/db/schema.ts, enums/tables for M1-M12) — completeness vs feasibility spec NOT verified
- [ ] Pre-flight: Puppeteer PDF render on real invoice/BL template
- [ ] Pre-flight: Mongo→PG migration spike on sample Beta data
- [x] ~~Seed: super_admin~~ — superseded, bootstrap flow instead (packages/server/src/start/)
- [~] Seed: settings defaults — committed and executed at server startup (start/services/parameters-seed.service.ts) — scope/correctness NOT verified

## Implemented ahead of Sprint 0 close-out

- Bootstrap module: /api/bootstrap/status and /api/bootstrap/init
- Auth module: /api/auth/login, /refresh, /set-password, /logout, /me
- Users module: admin-protected CRUD-lite + activation + OTP reset
- Settings module: admin/super_admin read/update routes
- Middleware: cookie-based JWT auth + RBAC role-level guards

> Note: as of 2026-07-12, Sprint 1 (auth/users/settings/bootstrap modules) is also already committed in the repo, ahead of Sprint 0 closing. Not yet typechecked or run.
