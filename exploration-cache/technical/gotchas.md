# Gotchas

## [Category: Dev Environment]

### npm scripts on Windows MINGW64

Run scripts from within the target package (e.g. packages/server), not the monorepo root — EXCEPT `npm run dev` at root, which uses `concurrently` + `npm:` script refs (workspace-resolved by npm itself, not cwd-dependent). Safe from root on MINGW64.
