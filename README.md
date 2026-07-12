# PrestiX

Travel agency management app for Le Prestigieux (client: Lucrèce BOUTOMBA).
Greenfield rewrite of `tripwise-monorepo`, modular monolith, PostgreSQL + Drizzle.

See `plan.md` and `exploration-cache/` for project state.

## Dev

Run npm scripts from within each package (`packages/server`, `packages/client`), not from root, per Windows MINGW64 convention.

```bash
npm install
npm run dev:server
npm run dev:client
```
