# PrestiX

Travel agency management app for Le Prestigieux (client: Lucrèce BOUTOMBA).
Greenfield rewrite of `tripwise-monorepo`, modular monolith, PostgreSQL + Drizzle.
repo : prestix

See `plan.md` and `exploration-cache/` for project state.

## Current status (2026-07-12)

- Sprint 0 scaffold is complete.
- Sprint 1 backend foundation is committed (`bootstrap`, `auth`, `users`, `settings`, RBAC, default settings seed).
- Validation blockers remain before functional QA:
  - server typecheck fails (`TS5103`, invalid `ignoreDeprecations` value)
  - `npm run db:seed` fails in `packages/server` (exit 1)
  - Docker daemon unavailable, so compose smoke checks are pending

## Dev

Run npm scripts from within each package (`packages/server`, `packages/client`), not from root, per Windows MINGW64 convention.

```bash
npm install
npm run dev:server
npm run dev:client
```
