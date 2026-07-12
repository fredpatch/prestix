# Gotchas

## [Category: Dev Environment]

### npm scripts on Windows MINGW64

Run scripts from within the target package (e.g. packages/server), not the monorepo root — EXCEPT `npm run dev` at root, which uses `concurrently` + `npm:` script refs (workspace-resolved by npm itself, not cwd-dependent). Safe from root on MINGW64.

## [Category: TypeScript Tooling]

### TS5103 on `ignoreDeprecations`

`npm run typecheck -w packages/server` can fail when TypeScript version and tsconfig `ignoreDeprecations` value are incompatible. Keep tsconfig aligned with the installed `typescript` version before using typecheck as a quality gate.

## [Category: Docker Runtime]

### Compose commands fail when Docker Desktop engine is down

If `docker compose up` reports named pipe `//./pipe/dockerDesktopLinuxEngine` unavailable, the daemon is not running. Start Docker Desktop/engine first; then retry compose and health checks.
