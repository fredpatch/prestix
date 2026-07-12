# Decisions Log (append-only, newest first)

## 2026-07-12 — Cache synced to HEAD implementation

- Treat backend Sprint 1 foundation as implemented (not scaffold-only)
- Correct health endpoint reference to /api/health in cache docs
- Use canonical repository name "prestix" in quick references

## 2026-07-12 — Sprint framing update

- Keep Sprint 0 open for validation/pre-flight tasks while allowing committed Sprint 1 backend work to proceed

## 2026-07-12 — Blockers resolved

- EPARGNE_INSCRIPTION_FEE = 5000 XAF
- prm label = Premium, confirmed

## 2026-07-12 — Monorepo scaffold

- npm workspaces, packages/{shared/types,server,client}
- Express + Drizzle + PostgreSQL server; React + Vite + Tailwind client
- Matches fredpatch/sicot-monorepo convention
