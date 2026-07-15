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

## Sprint 3 – Document Engine (M4) ✅ CLOSED (2026-07-14) | 2 weeks

> Line items are deliberately generic (`lineType` tag only, no typed capture) — M8/M9 (Sprint 6/7) own the real ticket/shop forms and the "attach order → mark invoiced" hooks inside `issue()`. BL's "after full payment" gate is a placeholder (`status === issued` only) until M5 (Sprint 4) supplies payment status. Cancellation's penalty-void/stock-reverse hooks are TODOs for M6/M9. All of this is intentional module sequencing, same pattern as Sprint 2's credit ledger — not scope cut for time. Runtime-tested end to end by hand: proforma with/without référent → promote to invoice → add/remove line → issue → generate BL.

- [x] **Proforma / Invoice / BL + InvoiceLine; FK proforma→invoice** — CRITICAL — runtime-tested full lifecycle both with and without référent
- [x] **Counters table (row-locked, continuous serial)** INV-/PRO- — CRITICAL — `getNextNumber(tx, "INV"|"PRO")`, `.for("update")` row-lock verified at typecheck and via real number allocation during testing
- [x] **issue() = one atomic transaction; requestId idempotency** — CRITICAL — verified real `INV-YYYYMM-XXXX` allocation on issue
- [x] Draft-only mutation guard; snapshots at creation — CRITICAL — add/remove line on draft confirmed blocked post-issue in UI
- [x] Proforma 48h expiry cron (auto Expirée, block invoice from expired) — HIGH — cron registered (15min interval); promotion correctly blocks expired/cancelled proformas
- [x] Cancellation (admin+, reason, audited) + hooks: penalty-void (S5), stock-reverse (S7) — HIGH — admin-gated, reason required, paid-amount→credit-lot path wired (unused until M5 supplies real paid amounts)
- [x] BL after full payment, no payment recap — MEDIUM — runtime-tested (BL generated on issued invoice, real `BL-####` number)

### Schema gap found and fixed during planning

- No `proformaLines` table existed — proformas had nowhere to store what was being quoted, and promotion (which snapshots lines into the new invoice) had nothing to snapshot from. Added, migrated, confirmed working end to end.
- No `referrerPartyId` on proformas/invoices — real business requirement (referent capture at document-creation time, feeds future M12 CA-contribution stats), not just a UI nicety. Added to both tables with promotion carry-forward, confirmed the reward-_system_ itself stays V2/deferred per the original decision — only tracking capture is V1.

### Deferred to Sprint 6 (M7) — added mid-sprint, cheap while schema was still open

- Line-level discount now gated manager+ (both service-side `assertCanDiscount` and client-side field hiding) — full M7 workflow (bounds validation, print summary) still Sprint 6 scope.

## Sprint 4 – Paiements & Échéancier (M5) ✅ CLOSED (2026-07-14) | 2 weeks

> Payment recording is one row per installment touched per payment event (not one collapsed running total) — a deliberate departure from the legacy MongoDB microservice's model, matching our own schema's row-per-(invoice,installment) design already established for M6 penalties. Legacy's own add-payment UI had no échéance-targeting at all; per-échéance override here is a genuine PrestiX improvement over legacy, not a port. Runtime-tested end to end: full-mode issue, installment-mode issue with avance, FIFO across échéances, override target, overpayment→credit (verified on party's real credit balance), reschedule forward-only, and cancel-with-real-paid-amount (including the two-separate-credit-lots case after a prior overpayment).

- [x] **Payment records (append-only): tendered/applied/change/credited/method** — CRITICAL — runtime-tested across all 8 smoke-test scenarios
- [x] **Échéancier ≤3, avance at issue, Σ = total** — CRITICAL — Σ-must-equal-total validated client-side before submit, enforced again server-side
- [x] Allocation FIFO + agent override — CRITICAL — both paths confirmed working
- [x] **Overpayment → change/credit prompt** (writes credit ledger) — CRITICAL — confirmed real credit-lot creation, verified on party detail page balance
- [x] Status auto-update (invoice + per-installment) — HIGH — `unpaid → partial → paid` confirmed at both levels
- [x] Reschedule (admin+, forward-only, audited) — HIGH — backward-date rejection confirmed, final due-date shift on last échéance confirmed
- [x] Cancel → money to credit (V1) — HIGH — confirmed `cancelInvoice` computes the real paid amount from payment rows (no longer caller-supplied); confirmed correct behavior on the double-credit-lot edge case (prior overpayment + cancellation reimbursement are two separate legitimate lots, not double-counted)

### Schema gap found and fixed during planning

- `invoices` had no `paymentStatus` column — the M5 spec's `unpaid → partial → paid` axis is separate from the document-lifecycle `status` (draft/issued/expired/cancelled). Added, reusing the existing `installment_status` enum, migrated.
- `InvoiceView`/`toView()` initially didn't expose the new `paymentStatus` field in the API response after the schema addition — caught before shipping (client logic gating the "record payment" button on it would have silently always read `undefined`).

### Real integration points closed this sprint

- Sprint 2's `createCreditLot()` got its first real caller (overpayment, and cancellation).
- Sprint 3's `cancelInvoice(paidAmountToCredit)` placeholder param replaced with a real computed value.
- Sprint 3's `issueInvoice()` extended (not replaced) to create installments inside the same atomic transaction as numbering.

### Known follow-up (filed in Notion, Sprint 12 hardening)

- `recordPayment`'s overpayment→credit path calls `createCreditLot()` in a second transaction after the payment transaction commits. A failure in that second call after a successful payment commit would leave `creditedAmount` set with no matching lot — rare, not reproduced, flagged for the Sprint 12 cross-compare hardening pass.

## Sprint 5 – Créances & Pénalités (M6) | 1.5 weeks

- [~] **Penalty accrual cron: +2500/week accumulating, per-échéance, snapshot** — CRITICAL — backend service and daily cron drafted; accrual count extracted into pure named-constant function with unit coverage; pending runtime smoke
- [x] **Dedicated test suite** (named constants) — CRITICAL — Vitest accrual-count suite added and passing (8 cases: grace boundary, weekly cadence, no cap, longer grace, midnight normalization)
- [ ] **Cross-compare gate** vs legacy Beta on sample data — CRITICAL
- [~] Payment allocation: agent chooses principal/penalty (+UI warn) — HIGH — backend accepts `allocationTarget`, splits principal vs penalty rows, keeps principal status separate, and invoice payment dialog now exposes principal/penalty priority with warning; runtime smoke pending
- [~] Créances view; overdue = receivables aggregation (single source) — HIGH — `/api/creances` backend route and client page drafted with principal/penalty due aggregation, overdue filter, nav, and invoice links; runtime smoke pending

## Cross-sprint document PDF hardening (2026-07-15)

- [~] Invoice/Proforma/BL print exports — shared template now renders ticket return dates, invoice payment schedules, denser table/signature/footer spacing, and print audit logging; server typecheck/build and client build pass; visual endpoint smoke and audit-row verification still pending

## Sprint 6 – Remises & Billetterie (M7, M8) ✅ CLOSED (2026-07-15) | 2 weeks (ran long — see note)

> Grew well past its original checklist. Original scope (discount bounds/print, ticket class/passenger capture) is a fraction of what actually shipped: proforma/invoice/BL PDF generation (never itemized in TASKS.md — surfaced when asked "how do we send the proforma to the client"), the échéancier print restoration, and a full Layout page-header mechanism (cross-cutting UI work, not M7/M8 scope). Future planning should treat document-output/print work as its own cost center, not an assumed-included afterthought.

- [x] Line-level fixed discount (manager+), ≥0, ≤ line — HIGH — role gate + bounds check both live-tested; over-line-amount discount confirmed rejected
- [x] Discount on printed invoice (per-line + summary) — HIGH — confirmed on real printed proforma output (Remise column + Sous-total/Remise/TOTAL summary)
- [x] **Ticketing: class enum economy/business/first/premium; abbrev eco/bnss/prem/prm** — CRITICAL — confirmed on real printed output ("prm" rendering correctly)
- [x] Ticket line = one passenger; segments + passenger + references (reuse legacy shape) — HIGH — passenger/route/PNR/GDS/ticket-number all captured and printing correctly; supplier-ref dropped per real business feedback (agent doesn't need it)
- [x] Ticket margin (selling − supplier); attach → invoiced at issue — HIGH — data capture correct (supplierPrice/sellingPrice on both proforma and invoice ticket details); margin _display_/reporting is explicitly M12 (Sprint 10) scope, not built here; "attach→invoiced" satisfied by design (no separate booking-cart — confirmed at planning, document engine's own status transition covers it)

### Beyond-scope work completed this sprint

- **Full print/PDF generation for all 3 document types** — proforma, invoice, delivery note. Only invoice PDF existed going in; proforma/BL PDF never existed as a feature until this sprint.
- **Échéancier (payment schedule) restored on invoice print** — cut during the Sprint 0 pre-flight port pending M5; M5 now exists, restored with real installment data.
- **Print-audit logging** — every PDF download now logs `DOCUMENT_PRINTED`, matching a legacy pattern worth keeping (who printed what, when).
- **Layout page-header mechanism** (`usePageHeader` hook + Layout integration) — retrofitted across all 10 pages for consistent, non-scrolling page titles/back-navigation. Real UX problem, not originally scoped, fixed properly instead of patched locally.
- **Full react-hook-form + Zod rewrite** of proforma/invoice line-item capture (replacing the original plain-useState version), including collapse/expand per line, live validation, and a progress-checklist sidebar.

### Real bugs found and fixed during Sprint 6

- Discount upper bound (`≤ line amount`) was never actually enforced — only the manager+ role gate existed. Found during planning, fixed before shipping.
- `proformaLines` had no linked ticket-details table — schema gap found during planning (proforma quoting a ticket had nowhere to store passenger/segment/class data), fixed before building on top of it.
- `CreateInvoiceDraftPage` was left completely broken after a mid-sprint UI refactor — the line-builder UI was deleted with nothing replacing it, making the page unusable. Found via direct repo inspection when the person reported confusion, not caught by typecheck.
- `usePageHeader` hook-order violation ("Rendered more hooks than during the previous render") — hook was called after an early-return loading guard in 3 detail pages, violating Rules of Hooks. Fixed by moving the call before any conditional return, with null-safe title values.
- Footer color, 48h-banner placement, and table density were all off from the intended design — fixed based on direct visual review of real printed output, not assumption.

## Sprint 7 – PrestiShop & Stock (M9) | 1.5 weeks

- [ ] **Shop line: article, qty, price (editable), passenger (dropdown/free-text)** — CRITICAL
- [~] Stock articles/items/movements (append-only IN/OUT/ADJUST) — CRITICAL — backend service/controller/routes mounted at `/api/stock`; row-locked on-hand updates and movement history drafted; runtime smoke pending
- [~] **Stock OUT on issue (idempotent refType+refId)** — CRITICAL — `issueInvoice()` records shop `articleId` OUT movements inside the invoice transaction; runtime smoke pending
- [~] Negative-on-issue → manager+ override (new vs legacy); manual blocks negative — HIGH — service enforces manual negative blocking and issue-only override/audit flag; controller gates override to manager+; runtime smoke pending
- [~] Restock IN/ADJUST (manager+); below-threshold → operational KPI only — HIGH — manager restock/adjust endpoint and low-stock query helper drafted; client/dashboard surfacing pending

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
