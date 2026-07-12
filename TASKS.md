# PrestiX — Task List

> Solo dev (Fred). Sequential sprints, server-first. Update at every session end.
> Priorities: **CRITICAL** (blocks delivery) · **HIGH** (essential business) · MEDIUM (deferrable).
> Markers: `[ ]` not started · `[~]` drafted in chat, not yet pasted into repo / typechecked / run · `[x]` done and in the repo.

## Phase 0 – Initialization | 1.5 weeks

- [x] **Kick-off with Lucrèce** — `EPARGNE_INSCRIPTION_FEE` = 5000 XAF; `prm` = Premium confirmed — CRITICAL
- [x] **Monorepo scaffold** — npm workspaces (packages/shared/types · server · client), ESLint/Prettier/tsconfig.base, concurrently root `dev` script — CRITICAL
- [x] **Deployment infra** — docker-compose dev/staging/prod, nginx, multi-stage Dockerfiles, deploy scripts — CRITICAL
- [ ] **Docker env** — postgres + api + client compose validated end-to-end, .env from template, dev up — CRITICAL
- [~] **Full Drizzle schema** — all M1–M11 entities drafted in chat (M12 is aggregation-only, no tables) — needs pasting into repo — CRITICAL
- [ ] Pre-flight: Puppeteer PDF render on real invoice/BL template — HIGH
- [ ] Pre-flight: **Mongo→PG migration spike** on sample Beta data — HIGH
- [~] Seed: catalog service-types + feature flags + settings defaults + counters (idempotent) — drafted in chat, needs pasting — HIGH
- [x] ~~Seed: super_admin (owner) account~~ — superseded: no env-var seed, first-run bootstrap instead (see Sprint 1)

## Sprint 1 – Auth & Settings (M1, M2) | 2 weeks

> Architecture mirrors fredpatch/sicot-monorepo `start/`, `modules/auth`, `modules/parametres`, `middleware/` — adapted to PrestiX's numeric-level RBAC. **Code drafted in chat 2026-07-12 — not yet pasted into repo, not typechecked, not run.** Marked [~] = drafted, needs Fred to commit + verify.

- [~] **Settings redesigned as key-value table** (`settings`: key/value/type/module/description) replacing single-row `global_settings` — generic admin UI, matches commission-catalog pattern
- [~] **Bootstrap module** (`start/`) — `GET /api/bootstrap/status`, `POST /api/bootstrap/init`; first-run creates super_admin with no OTP, no env-var password
- [~] **Auth: users, 4-level roles, JWT + bcrypt** — access (15min) + refresh (7d) tokens in httpOnly cookies — CRITICAL
- [~] **OTP activation + password reset flow** (Nodemailer) — admin creates account → OTP email → user sets password — CRITICAL
- [~] `authorize(level)` middleware (agent1/manager2/admin3/super_admin4) — CRITICAL
- [~] Audit log (append-only) on all mutations — `logAudit()` in `auth.service.ts`, used across auth/users/settings/bootstrap — CRITICAL
- [ ] Settings: appearance (client-local) — HIGH (server-side business defaults done via key-value table above)
- [~] Financial params as settings rows (penalty, grace, credit window, underfee policy, inscription fee, OTP expiry, lockout) — HIGH
- [~] Data-driven commission-type catalog + feature flags; idempotent seed — HIGH
- [~] Self-lockout guard (≥1 active super_admin, count-based) — HIGH — **deviation from SICOT**: SICOT blocks deactivating any super_admin unconditionally; PrestiX uses the stricter/more correct count-based rule per M1 feasibility decision
- [ ] Client: first-run check (`GET /api/bootstrap/status`) → setup screen vs login screen — HIGH (not started, client work)
- [ ] **Paste drafted code into repo, `npm install` (cookie-parser, @types/cookie-parser), typecheck, run** — CRITICAL next step

## Sprint 2 – Party & Credit ledger (M3) | 2 weeks

- [ ] **Parties: isClient/isReferrer flags, contact, search** — CRITICAL
- [ ] **Credit/avoir ledger** — append-only, dated lots, derived balance — CRITICAL
- [ ] Party history scaffold — commercial vs épargne separate, distinct pagination — HIGH
- [ ] Party quick-add (for use in commissions later) — HIGH
- [ ] Party UI + stats (build fresh — legacy stubs) — HIGH

## Sprint 3 – Document Engine (M4) | 2 weeks

- [ ] **Proforma / Invoice / BL + InvoiceLine; FK proforma→invoice** — CRITICAL
- [ ] **Counters table (row-locked, continuous serial)** INV-/PRO- — CRITICAL
- [ ] **issue() = one atomic transaction; requestId idempotency** — CRITICAL
- [ ] Draft-only mutation guard; snapshots at creation — CRITICAL
- [ ] Proforma 48h expiry cron (auto Expirée, block invoice from expired) — HIGH
- [ ] Cancellation (admin+, reason, audited) + hooks: penalty-void (S5), stock-reverse (S7) — HIGH
- [ ] BL after full payment, no payment recap — MEDIUM

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

- [ ] `EPARGNE_INSCRIPTION_FEE` amount — Lucrèce (owner)
- [ ] `prm` printed label confirmation — Lucrèce (client)
- [ ] Access to legacy Beta prod data for migration — owner/hosting

## Done

- [x] Phase 0 Brief — CDC v2 + legacy audit
- [x] Phase 1 Project Plan (§9 reconciled)
- [x] Phase 2 Feasibility (M1–M12)
- [x] Phase 3 Tech Stack (documented + frozen)
- [x] Phase 4 Dev Plan + TASKS.md