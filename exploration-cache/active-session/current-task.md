## Task

Monorepo scaffold (Sprint 0, item 2)

## Acceptance criteria

- npm workspaces resolve across packages/shared/types, packages/server, packages/client
- `npm run dev:server` boots Express on :3000 with /health
- `npm run dev:client` boots Vite on :5173

## Files involved

- package.json (root)
- packages/server/src/index.ts
- packages/client/src/main.tsx

## Approach

Scaffold matches fredpatch/sicot-monorepo convention.
