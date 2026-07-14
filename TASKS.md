# PrestiX — Task List

> Solo dev (Fred). Sequential sprints, server-first. Update at every session end.
> Priorities: **CRITICAL** (blocks delivery) · **HIGH** (essential business) · MEDIUM (deferrable).
> Markers: `[ ]` not started · `[~]` drafted in chat, not yet pasted into repo / typechecked / run · `[x]` done and in the repo.

## Phase 0 – Initialization | 1.5 weeks

- [x] **Kick-off with Lucrèce** — `EPARGNE_INSCRIPTION_FEE` = 5000 XAF; `prm` = Premium confirmed — CRITICAL
- [x] **Monorepo scaffold** — npm workspaces (packages/shared/types · server · client), ESLint/Prettier/tsconfig.base, concurrently root `dev` script — CRITICAL
- [x] **Deployment infra** — docker-compose dev/staging/prod, nginx, multi-stage Dockerfiles, deploy scripts — CRITICAL
- [x] **Docker env** — postgres + api + client compose validated end-to-end, migrations auto-apply on boot — CRITICAL
- [x] **Full Drizzle schema** — M1–M11 committed, audited vs feasibility spec; 3 gaps found and fixed (credit_lots FK, savings_accounts currency, penalties grace snapshot) — CRITICAL
- [x] Pre-flight: Puppeteer PDF render on real invoice/BL template — Alpine/Chromium fixed, legacy template ported and validated against real sample — HIGH
- [x] Pre-flight: **Mongo→PG migration spike** — schema-mapping done (see `exploration-cache/technical/mongo-pg-migration-mapping.md`); data dry-run deferred to Sprint 11 pending Beta prod access — HIGH
- [x] Seed: catalog service-types + feature flags + settings defaults + counters (idempotent) — verified correct against M2/M10 spec, auto-runs on boot — HIGH
- [x] ~~Seed: super_admin (owner) account~~ — superseded: no env-var seed, first-run bootstrap instead (see Sprint 1)

## Sprint 1 – Auth & Settings (M1, M2) ✅ CLOSED (2026-07-13) | 2 weeks

> Architecture mirrors fredpatch/sicot-monorepo `start/`, `modules/auth`, `modules/parametres`, `middleware/`, `components/layouts/Layout` — adapted to PrestiX's numeric-level RBAC, email-based login (not matricule), and gold brand palette. Backend audited against M1/M2 spec; frontend built and runtime-tested end-to-end (bootstrap → login → users → settings). Typecheck clean across server/client/shared-types.

- [x] **Settings redesigned as key-value table** (`settings`: key/value/type/module/description) — CRUD wired, admin+ read / super_admin write
- [x] **Bootstrap module** (`start/`) — `GET /api/bootstrap/status`, `POST /api/bootstrap/init`; runtime-tested, first super_admin created successfully
- [x] **Auth: users, 4-level roles, JWT + bcrypt** — access (15min) + refresh (7d) tokens in httpOnly cookies — CRITICAL
- [x] **OTP activation + password reset flow** (Nodemailer) — admin creates account → OTP email → user sets password — CRITICAL
- [x] `authorize(level)` middleware (agent1/manager2/admin3/super_admin4) — CRITICAL
- [x] Audit log (append-only) on all mutations — CRITICAL
- [x] Settings: appearance (client-local) — `ThemeProvider`, localStorage, applied immediately, no backend call; Layout + Button retrofitted to semantic tokens — HIGH. Remaining pages (Login/Bootstrap/Settings/Users card surfaces) still hardcoded, not dark-mode aware — tracked for a later hardening pass, not blocking.
- [x] Financial params as settings rows — HIGH
- [x] Data-driven commission-type catalog + feature flags; idempotent seed — HIGH — CRUD routes built and runtime-tested (create type, toggle module)
- [x] Self-lockout guard (≥1 active super_admin, count-based) — HIGH — deviation from SICOT confirmed correct per M1 decision
- [x] Client: first-run check → bootstrap vs login screen — HIGH — runtime-tested
- [x] Client admin screens (Users + Settings) with guarded navigation — HIGH — runtime-tested (create/edit/deactivate user, toggle flags, create commission type)
- [x] **Validation pass:** typecheck clean (server + client + shared-types), docker smoke-tested — CRITICAL

### Bugs found and fixed during Sprint 1 audit/testing

- Privilege escalation: admin could create/promote users to admin/super_admin (`users.service.ts` — actor-role guard added to both `createUser` and `updateUser`)
- OTP expiry setting bypassed on 2 of 3 issuing paths (hardcoded const vs settings-driven — unified)
- `EditUserDialog` didn't sync state when target user changed — Save button appeared to force an email edit
- `tsconfig.base.json ignoreDeprecations` reverted to invalid value twice during the sprint — now fixed and verified via direct typecheck run
- `packages/client/tsconfig.json composite: true` broke JSON module imports (i18n) — disabled, client is a leaf package

## Sprint 2 – Party & Credit ledger (M3) | 2 weeks

- [~] **Parties: isClient/isReferrer flags, contact, search** — CRITICAL — backend module/routes mounted (`/api/parties`), client list/search/filter/detail/edit flow drafted; pending API/client smoke
- [~] **Credit/avoir ledger** — append-only, dated lots, derived balance — CRITICAL — backend service/routes mounted (`/api/credit`), FIFO spend/refund/expired-lot query drafted; server typecheck clean, pending API smoke and M5/M11 wiring
- [~] Party history scaffold — commercial vs épargne separate, distinct pagination — HIGH — backend response contract/routes mounted (`/api/parties/:id/history`), client detail tabs drafted with placeholders until M4 invoices and M11 savings transactions exist; pending API/client smoke
- [~] Party quick-add (for use in commissions later) — HIGH — agent+ create endpoint and client quick-add/create dialogs drafted; pending smoke in downstream commission/document flows
- [~] Party UI + stats (build fresh — legacy stubs) — HIGH — Parties nav/list/detail/edit drafted with credit balance/lots and placeholder receivables/epargne stat cards; pending runtime polish and smoke

## Sprint 3 – Document Engine (M4) | 2 weeks

- [~] **Proforma / Invoice / BL + InvoiceLine; FK proforma→invoice** — CRITICAL — backend routes + client list/detail/create/promote flows drafted for proformas/invoices/BL; `proforma_lines` migration generated; pending API/client smoke
- [~] **Counters table (row-locked, continuous serial)** INV-/PRO- — CRITICAL — `getNextNumber(tx, "INV"|"PRO")` row-locks seeded counters and formats `KEY-YYYYMM-####`; pending concurrency smoke
- [~] **issue() = one atomic transaction; requestId idempotency** — CRITICAL — invoice issue flow allocates number, stores requestId, sets due date/status inside transaction; ticket/stock hooks left TODO for S6/S7
- [~] Draft-only mutation guard; snapshots at creation — CRITICAL — draft guards and party snapshots implemented; client can add/remove draft invoice lines; pending API/client smoke
- [~] Proforma 48h expiry cron (auto Expirée, block invoice from expired) — HIGH — cron registered every 15 minutes and promotion blocks expired/cancelled proformas; pending runtime smoke
- [~] Cancellation (admin+, reason, audited) + hooks: penalty-void (S5), stock-reverse (S7) — HIGH — admin route, reason guard, audit, optional credit-lot refund path and cancel dialog drafted; penalty/stock hooks deferred
- [~] BL after full payment, no payment recap — MEDIUM — BL endpoint/service and invoice detail action drafted for issued invoices; full-payment gate deferred until M5 payment status exists

## Sprint 4 – Paiements & Échéancier (M5) | 2 weeks

- [ ] **Payment records (append-only): tendered/applied/change/credited/method** — CRITICAL
- [ ] **Échéancier ≤3, avance at issue, Σ = total** — CRITICAL
- [ ] Allocation FIFO + agent override — CRITICAL
- [ ] **Overpayment → change/credit prompt** (writes credit ledger) — CRITICAL
- [ ] Status auto-update (invoice + per-installment) — HIGH
- [ ] Reschedule (admin+, forward-only, audited) — HIGH
- [ ] Cancel → money to credit (V1) — HIGH

## Sprint 5 – Créances & Pénalités (M6) | 1.5 weeks

- [ ] **Penalty accrual cron: +2500/week accumulating, per-échéance, snapshot** — CRITICAL
- [ ] **Dedicated test suite** (named constants) — CRITICAL
- [ ] **Cross-compare gate** vs legacy Beta on sample data — CRITICAL
- [ ] Payment allocation: agent chooses principal/penalty (+UI warn) — HIGH
- [ ] Créances view; overdue = receivables aggregation (single source) — HIGH

## Sprint 6 – Remises & Billetterie (M7, M8) | 2 weeks

- [ ] Line-level fixed discount (manager+), ≥0, ≤ line — HIGH
- [ ] Discount on printed invoice (per-line + summary) — HIGH
- [ ] **Ticketing: class enum economy/business/first/premium; abbrev eco/bnss/prem/prm** — CRITICAL
- [ ] Ticket line = one passenger; segments + passenger + references (reuse legacy shape) — HIGH
- [ ] Ticket margin (selling − supplier); attach → invoiced at issue — HIGH

## Sprint 7 – PrestiShop & Stock (M9) | 1.5 weeks

- [ ] **Shop line: article, qty, price (editable), passenger (dropdown/free-text)** — CRITICAL
- [ ] Stock articles/items/movements (append-only IN/OUT/ADJUST) — CRITICAL
- [ ] **Stock OUT on issue (idempotent refType+refId)** — CRITICAL
- [ ] Negative-on-issue → manager+ override (new vs legacy); manual blocks negative — HIGH
- [ ] Restock IN/ADJUST (manager+); below-threshold → operational KPI only — HIGH

## Sprint 8 – Commission Divers (M10) | 2 weeks

- [ ] **commission_transactions: type enum + JSONB details** — CRITICAL
- [ ] 6 seed types + fields; manual amount; autonomous (no workflow) — CRITICAL
- [ ] Client/référent Party FK + inline quick-add — HIGH
- [ ] Counts in CA + gain; agentId → Employee KPI — HIGH
- [ ] Data-driven type add (super_admin) — MEDIUM

## Sprint 9 – Épargne Voyage (M11) | 2 weeks

- [ ] **Savings accounts + append-only ledger; derived balance; withdrawal guard (SERIALIZABLE)** — CRITICAL
- [ ] **Subscription: direct + credit-conversion paths; inscription fee → CA** — CRITICAL
- [ ] **Credit-window auto-conversion cron** (consumes S2 credit lots; underfee policy) — CRITICAL
- [ ] Withdrawal (manager+, receipt); épargne-as-payment (wire into M5) — HIGH
- [ ] Reversal (compensating entry); party history épargne section — HIGH

## Sprint 10 – Dashboard & Reporting (M12) | 2 weeks

- [ ] **CA composition (gross buckets) + gain; single reporting module** — CRITICAL
- [ ] **Overdue single-source (fix legacy KPI bug)** — CRITICAL
- [ ] Date filter presets + custom; accrual/cash toggle — HIGH
- [ ] Client/Apporteur/Employé KPIs (volume + value) — HIGH
- [ ] Dashboard + basic report + Excel/PDF export; clean empty-state — HIGH

## Sprint 11 – Data migration | 1.5 weeks

- [ ] **Mongo→PG migration scripts + field mapping** — CRITICAL
- [ ] Reconciliation report; historical negative-balance warnings — CRITICAL
- [ ] Dry-run on staging — CRITICAL

## Sprint 12 – Testing & UAT | 2 weeks (+20% buffer)

- [ ] End-to-end test pass — CRITICAL
- [ ] Money cross-compare gates (penalties, ledgers, CA) — CRITICAL
- [ ] **UAT with Lucrèce + Agency Manager; sign-off** — CRITICAL
- [ ] Correction buffer — HIGH

## Sprint 13 – Deploy & Training | 1 week

- [ ] Prod deploy (Docker, Nginx, SSL/Certbot), smoke test — CRITICAL
- [ ] Training material + session — HIGH
- [ ] **Cutover from Beta; monitor logs** — CRITICAL

## Waiting On

- [ ] Access to legacy Beta prod data for migration — owner/hosting
- [ ] Company-type party fields decision — do real clients include COMPANY-type parties? (Sprint 2/M3)
- [ ] Credit-lot decision-window backfill rule for pre-existing legacy credit — Lucrèce (Sprint 11)
- [ ] Épargne inscription-fee/status backfill rule for legacy savings — Lucrèce (Sprint 11)

## Done

- [x] Phase 0 Brief — CDC v2 + legacy audit
- [x] Phase 1 Project Plan (§9 reconciled)
- [x] Phase 2 Feasibility (M1–M12)
- [x] Phase 3 Tech Stack (documented + frozen)
- [x] Phase 4 Dev Plan + TASKS.md
