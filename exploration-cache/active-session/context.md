## Where we left off

Sprint 0 baseline is in place and key Sprint 1 backend modules are now committed.
Latest commit a54ce04 updated README with canonical repo name: prestix.

## What's in scope today

Cache/docs sync against HEAD implementation.

## State of the codebase

Backend has working Express routes for bootstrap, auth, users, and settings,
with JWT cookie auth, RBAC middleware, and default settings seed.
Client remains mostly scaffold-level (placeholder App/Login, axios stub).

## Key constraints active right now

- npm workspaces, run scripts from within each package
- Windows MINGW64 dev environment
- Health check is /api/health (not /health)
