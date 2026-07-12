## Task

Resolve backend validation blockers (typecheck, Docker runtime, db seed) and re-run smoke checks.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- Docker env validation (postgres+api up, /api/health reachable)
- Drizzle schema audit vs M1–M11 feasibility spec
- Puppeteer PDF pre-flight
- Mongo→PG migration spike
- Verify parameters-seed.service.ts covers catalog service-types + settings defaults correctly

## Immediate next technical check (after cache sync)

- Fix TypeScript config (`ignoreDeprecations`) so `npm run typecheck -w packages/server` passes
- Re-run `npm run db:seed` in `packages/server` and capture full failure output for triage
- Start Docker daemon and re-run `docker compose up -d postgres api`
- Confirm GET /api/health then validate bootstrap/auth happy path with cookies

## Last validation run (2026-07-12)

- Typecheck: FAIL (TS5103 invalid `ignoreDeprecations` value)
- DB seed: FAIL (`npm run db:seed`, exit 1)
- Compose startup: FAIL (Docker daemon unavailable)
- Health endpoint: NOT RUN (API not up)

## Note

Previous version of this file listed "Monorepo scaffold" as active task — stale. That item is done (verified via git log, commit bc459bc).
