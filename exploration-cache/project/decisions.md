# Decisions Log (append-only, newest first)

## 2026-07-19 — Sprint 11 (Data migration) cancelled, not just blocked

- Original plan assumed a real production dataset existed in the legacy tripwise-monorepo (MongoDB) worth migrating to PostgreSQL. Confirmed with Fred this premise was wrong: tripwise-monorepo was itself a dev/test deployment used with Lucrèce, never mature production data — same status the whole session already treated Beta prod access as ("blocked"), but the actual answer was that there's nothing meaningful to migrate even if access were granted.
- Reframes the whole project's remaining goal: not "preserve historical data," but "get Lucrèce to adopt the new, simplified design" — PrestiX exists specifically because the old system felt too complicated, which is the whole reason a rebuild happened at all.
- tripwise-monorepo's role as UI/business-logic reference oracle is unaffected — that was always about validating patterns, never about data.
- Replaced with three real next priorities, not yet individually scoped: UI hardening & state improvement, notifications, and a full filterable audit journal page (already logged as backlog during Sprint 10).

## 2026-07-16 — Épargne withdrawal raised to admin+, reframed as exception (Sprint 9)

- Original spec reading treated standalone withdrawal as a routine manager+ action, same tier as deposit. Confirmed with Fred during smoke testing this is wrong: money only ever leaves an épargne account by being spent (a ticket or shop purchase via épargne-as-payment), never withdrawn as cash on demand.
- Kept the mechanism (Fred's explicit call — useful for admin-level exceptional cases, with real receipt/audit traceability), but raised the gate to admin+ and reframed the UI: red styling, explicit warning copy, "Retrait exceptionnel" label instead of a neutral peer of "Dépôt."

## 2026-07-16 — Épargne inscription fee recorded as a real ledger pair, not a snapshot (Sprint 9)

- Original design: fee amount snapshotted as a number on the savings_accounts row only, reasoning it was pure agency revenue that never touches the client's own balance. Confirmed with Fred this was invisible and insufficient for accounting traceability.
- Two options laid out explicitly: (a) on-screen confirmation only, fee never in the ledger; (b) real deposit+withdrawal pair, nets to zero, fully visible. Fred chose (b) — the more rigorous option.
- Applied to BOTH entry paths (direct subscription and credit-conversion's new-account branch) for consistency. Credit-conversion path flagged for deeper independent testing, not assumed correct just because the code mirrors the direct-subscription fix.

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
