1. Docker env — bring up postgres+api via docker-compose, confirm /api/health responds
2. Drizzle schema audit — cross-check schema.ts against M1–M11 feasibility entities
3. Verify parameters-seed.service.ts (catalog service-types + settings defaults, idempotency)
4. Typecheck and run committed auth/users/settings/bootstrap modules (currently ahead of Sprint 0 closure)
5. Pre-flight: Puppeteer PDF render on real invoice/BL template
6. Pre-flight: Mongo→PG migration spike on sample Beta data