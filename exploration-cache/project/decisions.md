# Decisions Log (append-only, newest first)

## 2026-07-16 — Commission correction model: full approval queue (Sprint 8)

- Three options laid out explicitly: (A) direct edit fully audited, (B) lock commissionAmount only, (C) full approval queue with mandatory reason. Chose C — Fred's explicit call, not decided unilaterally.
- Agent submits proposed changes + reason; commission stays unchanged until admin/super_admin approves or rejects. Only one pending request per transaction at a time.
- Scoped to date/amount/note fields for the request dialog in this first pass — client/référent and type-specific dynamic fields deliberately excluded, stated explicitly rather than silently limited.

## 2026-07-16 — Commission `note` is a common column, not per-type (Sprint 8)

- Real gap: Transfert et Change, Visa, and Canal+ had no fieldSchema entry for recording transaction context, and adding it to every type's fieldSchema individually would duplicate the same field across the catalog forever.
- Added `note` (optional text) as a fixed column on `commission_transactions`, same tier as `date`/`commissionAmount` — available on every type automatically, including future super_admin-created ones.

## 2026-07-16 — Commission type deletion stays soft-disable only (Sprint 8)

- Confirmed with Fred: no hard-delete for commission types, even unused ones, for now. Matches the existing stock-article precedent (Sprint 7) — same reasoning (history integrity), same call.
- Filter capability for the commission Settings tab explicitly deferred to a later pass.

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
