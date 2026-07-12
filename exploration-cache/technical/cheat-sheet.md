# Cheat Sheet

- API dev: `npm run dev -w packages/server` -> :3000
- Client dev: `npm run dev -w packages/client` -> :5173
- Health check: GET /api/health
- Drizzle generate: `npm run db:generate` (root script delegates to packages/server)
- Drizzle migrate: `npm run db:migrate` (root script delegates to packages/server)
