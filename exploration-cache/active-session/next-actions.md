1. Fix TypeScript config mismatch (TS5103 on `ignoreDeprecations`) and re-run `npm run typecheck -w packages/server`
2. Start Docker daemon, then bring up postgres+api via docker-compose and confirm /api/health responds
3. Validate bootstrap/auth happy path once API is reachable
4. Drizzle schema audit — cross-check schema.ts against M1–M11 feasibility entities
5. Verify parameters-seed.service.ts (catalog service-types + settings defaults, idempotency)
6. Pre-flight: Puppeteer PDF render on real invoice/BL template
7. Pre-flight: Mongo→PG migration spike on sample Beta data
