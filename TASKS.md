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

## Sprint 7 – PrestiShop & Stock (M9) ✅ CLOSED (2026-07-15) | 1.5 weeks

> Shop items confirmed quotable on BOTH proforma and invoice (not invoice-only as first read from the spec) — a real business scenario from Lucrèce (client wants tickets + shop items priced together before committing) led to correcting that initial reading and adding a `proformaShopDetails` table mirroring the ticket pattern from Sprint 6. Two genuinely serious bugs found and fixed during this sprint, documented below — one of them (Zod silently stripping `shopDetails` on submit) was invisible in the UI and invisible in typecheck, only caught because the person checked the actual database directly instead of trusting the screen.

- [x] **Shop line: article, qty, price (editable), passenger (dropdown/free-text)** — CRITICAL — full runtime-tested: article selection auto-fills price, passenger dropdown sources from the document's own ticket passengers with free-text fallback, proactive low-stock warning shown at quoting time (not just blocked at issue)
- [x] Stock articles/items/movements (append-only IN/OUT/ADJUST) — CRITICAL — admin page runtime-tested: create article, restock (IN), toggle active
- [x] **Stock OUT on issue (idempotent refType+refId)** — CRITICAL — runtime-tested: onHand decremented correctly on real invoice issue, movement recorded with `SHOP_ORDER` ref
- [x] Negative-on-issue → manager+ override (new vs legacy); manual blocks negative — HIGH — both halves runtime-tested separately: agent correctly blocked with a real translated error message (not a raw error code); manager+ override chain works end-to-end (confirmed negative `onHand` after forcing); manual `ADJUST` toward negative correctly blocked even for manager+ (no override exists for that path, by design — confirmed, not assumed)
- [x] Restock IN/ADJUST (manager+); below-threshold → operational KPI only — HIGH — restock runtime-tested (onHand increases correctly); below-threshold KPI _display_ is explicitly M12 (Sprint 10) scope, same treatment as ticket margin in Sprint 6 — `listLowStockArticles()` query exists and is ready, no dashboard yet

### Real bugs found and fixed during Sprint 7

- `proformaShopDetails` table was specified at planning but never actually pasted/pushed — caught by direct DB inspection before building the frontend on top of a gap that would have silently discarded data.
- `invoice.service.ts` only ever _read_ `shopDetails` (for the stock-OUT lookup inside `issueInvoice()`) — nothing anywhere actually _wrote_ to it. The stock-OUT join would always have come back empty. Found via code review before frontend work started, not by testing.
- All three PDF services (invoice/proforma/BL) never read `shopDetails.passengerName` for the printed line's client name — always fell through to the buyer's name regardless of a designated passenger. Found by the person reviewing real printed output directly.
- **The big one:** `CreateProformaPage.tsx`/`CreateInvoiceDraftPage.tsx`'s Zod `lineSchema` never declared a `shopDetails` field. Since Zod's `z.object()` defaults to strip-unknown-keys mode, `zodResolver` silently deleted `shopDetails` from every submission before the submit handler ever saw it — no error, no warning, UI looked completely correct. Only caught because the person checked `proforma_shop_details` in the actual database and found it empty despite the form clearly working. General lesson for any future `zodResolver` form: every field the UI writes to form state must be explicitly declared in the schema, or it vanishes invisibly on submit.
- Issue-time `INSUFFICIENT_STOCK` error was displaying as the raw error code, not a translated message — easy to miss, looked like a bug rather than a real block. Fixed with a proper error-code-to-message map, same pass that added the manager+ override UI.

### Deliberately deferred, logged not built

- Reusable per-page "guide/help" panel — the person's own idea, correctly scoped as needing real content-authoring work (not just a mechanism) and a genuine UX design pass (panel vs. toggleable handle). Filed in Notion backlog.
- Papeterie/POS receipt mode — already V2/deferred per spec, owner decision pending. Confirmed during this sprint's planning that the stock schema is already reusable groundwork for it whenever that conversation happens (Papeterie would just be more `stockArticles` rows, not a separate system).

## Sprint 8 – Commission Divers (M10) ✅ CLOSED (2026-07-16) | 2 weeks (ran long — see note)

> Foundational pieces (schema, commission-catalog module, QuickAddPartyDialog) were already built in Sprint 0/1/2 and matched spec exactly — genuinely no gaps found there this time. But the sprint still grew well past its checklist once real feedback started: a universal `note` column, a full field-schema editor for existing catalog types (create-new-type existed since Sprint 1, edit-existing-type never did), and — the big one — a complete correction-request approval workflow that isn't in the M10 spec at all. "Autonomous, no workflow" (spec) describes commission recording itself, not correcting a mistake after the fact; those are different concerns.

- [x] **commission_transactions: type enum + JSONB details** — CRITICAL — schema already correct from Sprint 0, confirmed not built-around-a-gap
- [x] 6 seed types + fields; manual amount; autonomous (no workflow) — CRITICAL — confirmed via runtime test across all 6 types (simple/no-fields, single-field, full-complexity with period range, enum dropdown); Mobile Money's opérateur field confirmed already free-text (Moov Money needs no schema change)
- [x] Client/référent Party FK + inline quick-add — HIGH — confirmed working from inside the commission entry dialog, reusing Sprint 2's QuickAddPartyDialog unchanged
- [x] Counts in CA + gain; agentId → Employee KPI — HIGH — data capture confirmed correct (agentId, type, commissionAmount all present); *display* is explicit M12 (Sprint 10) scope, same treatment as ticket margin (Sprint 6) and stock KPIs (Sprint 7)
- [x] Data-driven type add (super_admin) — MEDIUM — confirmed live: created a brand-new type ("Course du mois") through the UI with zero code changes, exactly proving the catalog design

### Beyond-scope work completed this sprint
- **`note` as a common optional column** — universal free-text field available on every type (present and future), not bolted onto each type's fieldSchema individually. Closed a real gap: Transfert et Change, Visa, and Canal+ all had no way to record "what this transaction actually was."
- **Commission type field-schema editor** (Settings) — the catalog's `updateCommissionType` already supported editing fields server-side since Sprint 1, but neither the client API method nor any UI ever called it. Built a real editor: add/remove/rename fields, pick kind (text/optional text/period/enum-with-options).
- **Full correction-request approval workflow** — new `commission_edit_requests` table, agent-submits/admin-reviews flow with mandatory reason, before/after diff in the review queue, approve applies the exact proposed patch atomically, reject leaves the transaction untouched. Chosen over two simpler alternatives (direct edit, or lock-amount-only) after laying out the tradeoffs explicitly.

### Real gaps found and fixed
- Client-side `CommissionType` never exposed `fieldSchema` even though the server already sent it — would have made the (not-yet-built) dynamic-field renderer silently show nothing for every type. Caught before it shipped.
- Attempted `<DialogTrigger asChild>` out of habit (Radix convention) — this project uses Base UI, which doesn't support that prop. Caught by typecheck, confirmed via grep that every other dialog in the codebase uses the plain pattern instead.

### Explicitly deferred, not forgotten
- Hard-delete for unused commission types — confirmed with Fred: soft-disable only is fine for now.
- Filter capability in the commission Settings tab — noted for later, not this sprint.
- Correction-request dialog is scoped to date/amount/note only, not client/référent/type-specific fields — stated explicitly, not silently limited.

## Sprint 9 – Épargne Voyage (M11) ✅ CLOSED (2026-07-16) | 2 weeks

> Two real corrections to the original spec reading, both confirmed with Fred during smoke testing: (1) standalone withdrawal is NOT a routine manager+ action — money only ever leaves an épargne account by being spent (ticket/shop purchase via épargne-as-payment), so withdrawal was raised to admin+ and reframed in the UI as an exceptional override, not a peer of deposit. (2) The inscription fee wasn't visible anywhere in the ledger — fixed to record as a real deposit+withdrawal pair (nets to zero) on both entry paths, not just a snapshotted number. One item explicitly flagged, not closed: deeper verification of the fee-ledger-pair specifically on the credit-conversion path (vs. direct subscription, which was more thoroughly exercised) — carried forward, not silently assumed correct.

- [x] **Savings accounts + append-only ledger; derived balance; withdrawal guard (SERIALIZABLE)** — CRITICAL — runtime-tested: deposit/balance derivation confirmed correct, withdrawal balance guard confirmed (blocked over-balance attempt with a clean translated error, not a raw code)
- [x] **Subscription: direct + credit-conversion paths; inscription fee → CA** — CRITICAL — direct subscription runtime-tested including the corrected fee-visibility fix (real deposit+withdrawal pair, confirmed in the ledger). ⚠️ Credit-conversion path's fee-pair specifically flagged for deeper testing later — code mirrors the direct-subscription fix but wasn't independently re-verified with the same rigor after the correction.
- [x] **Credit-window auto-conversion cron** (consumes S2 credit lots; underfee policy) — CRITICAL — runtime-tested via manual trigger: new-account branch (fee deducted, account created) and existing-account branch (no second fee, straight deposit) both confirmed working. Found via testing: auto-converted deposits show as generic "Dépôt," indistinguishable from a cash deposit — logged as a hardening item, not blocking.
- [x] Withdrawal (**admin+, corrected from manager+**, receipt); épargne-as-payment (wire into M5) — HIGH — épargne-as-payment runtime-tested end-to-end on a real invoice (success case and over-balance-blocked case both confirmed). Standalone withdrawal confirmed working, role gate corrected to admin+ mid-sprint per real business clarification — this is a deliberate deviation from the spec's literal wording, not an oversight.
- [x] Reversal (compensating entry); party history épargne section — HIGH — reversal mechanics built (compensating entry, never mutates original, admin+ gated); party-history épargne section fills in the Sprint-2-scaffolded placeholder correctly. Noted in passing, not this sprint's job: the "commercial" half of party-history is *also* still an unfilled Sprint-3 TODO — pre-existing gap, flagged not fixed.

### Real gaps found and fixed during Sprint 9
- A schema edit accidentally dropped the `recordedAt` column entirely while making `agentId` nullable — caught before it shipped.
- `getStringValue` didn't exist in the settings service at all (only `getIntValue`/`getBoolValue`) — added properly rather than working around it inline.
- The inscription fee was snapshotted as a number but never actually recorded as money moving — invisible in the ledger. Fixed per Fred's explicit choice (real deposit+withdrawal pair over a lighter on-screen-only confirmation).
- Original spec reading treated standalone withdrawal as a routine manager+ action; real business rule is money only leaves via spend, never direct withdrawal — corrected to admin+, reframed as an exception in the UI.
- Quantity field on deposit/withdraw was over-engineered by mirroring invoice-line shape; cash deposits don't have a meaningful "quantity" — removed.

### Explicitly flagged, not closed
- Credit-conversion path's fee-visibility fix needs deeper independent verification (see note above).
- Auto-converted deposits need a visible "Converti" distinction from ordinary cash deposits (UI/status hardening, deferred).

## Sprint 10 – Dashboard & Reporting (M12) ✅ CLOSED (2026-07-19) | 2 weeks

> M12 grew from a dashboard-only slice into a two-surface reporting experience:
> the operational Dashboard remains the quick overview, while `/analyse` is the
> deeper decision screen. No new reporting tables were added; all metrics are
> derived from the data captured in M4-M11. The remaining confidence item is
> runtime/API smoke against real-ish data, not missing implementation.

- [x] **CA composition (gross buckets) + gain; single reporting module** — CRITICAL — `/api/reporting` aggregates billetterie, PrestiShop, commissions, epargne inscription fees, and penalties with accrual/cash support; buckets now include `volume` for "most used" analysis.
- [x] **Overdue single-source (fix legacy KPI bug)** — CRITICAL — dashboard/reporting/party-detail creance views call the shared `getCreances()` aggregation; `partyId` filtering was added without forking the overdue logic.
- [x] Date filter presets + custom; accrual/cash toggle — HIGH — Dashboard and Analyse share the period/basis controls; reporting date bounds use an `endOfDay()` helper to include same-day activity correctly.
- [x] Client/Apporteur/Employé KPIs (volume + value) — HIGH — client/referrer KPI panels built, employee KPIs include per-activity breakdown and drill-down rows for invoices, payments, commissions, stock, and savings.
- [x] Dashboard + basic report + Excel/PDF export; clean empty-state — HIGH — dashboard summary, recent activity, Excel/PDF exports, selectable report modules, and dedicated Analyse tabs are in the repo.

### Beyond-scope work completed this sprint

- Added `/analyse` route/nav with six tabs: Vue globale, Employés, Clients & Référents, Services, Créances & Engagements, and Rapports.
- Added `ChartCanvas` as a Chart.js wrapper for line/bar/doughnut visuals, including StrictMode-safe cleanup.
- Added CA trend, service trend, creances-by-party, accrual-vs-cash comparison, and open-engagement reporting endpoints.
- Expanded Excel/PDF exports so the Rapports tab can choose report modules (`global`, `employes`, `clients_referents`, `services`, `creances`) instead of exporting one fixed dashboard-shaped report.
- Filled the Party History commercial section from invoices and proformas, closing the old Sprint 3 TODO.
- Removed obsolete `docs/diffs/*.diff` working artifacts.

### Still flagged, not closed

- Full reporting/analyse API-runtime smoke is still needed end-to-end before beta confidence.
- Sprint 9 credit-conversion fee-pair verification and auto-converted epargne deposit labeling remain open hardening items.

## Sprint 11 – Data migration ❌ NOT NEEDED (2026-07-19)

> Not "blocked" — genuinely cancelled. Confirmed with Fred: the legacy
> tripwise-monorepo was itself in a dev/test phase with Lucrèce, never a
> mature production system. PrestiX exists specifically because that version
> felt too complicated to use and needed simplifying — there's no real
> production dataset worth migrating, and no access to it either way. The
> actual goal going forward is getting Lucrèce to accept and adopt the new,
> simplified design — not preserving old data. Reference material only:
> tripwise-monorepo remains the UI/business-logic oracle it always was, that
> role is unaffected by this decision.

- [x] ~~Mongo→PG migration scripts + field mapping~~ — not needed
- [x] ~~Reconciliation report; historical negative-balance warnings~~ — not needed
- [x] ~~Dry-run on staging~~ — not needed

## Sprint 11c-1 – UI Hardening: Foundations ✅ CLOSED (2026-07-20) | scope TBD

> Phase 1 of 3 — nothing else in this initiative works well without these
> pieces in place first. Confirmed with Fred: font changes from Mulish to
> Plus Jakarta Sans (Mulish was already the declared/loaded font, not
> Candara as first assumed — Candara was only ever the CSS fallback).

- [x] Install `sonner`, `@tanstack/react-query`, `@tanstack/react-table` (none currently installed — confirmed via package.json audit)
- [x] Font swap: Mulish → Plus Jakarta Sans
- [x] Define a real type scale — fixed-px tokens `--text-xs` (11px) through `--text-xl` (20px)
- [x] React Query provider + query client setup — `query-client.ts`, `query-keys.ts` central registry established
- [x] Sonner `<Toaster />` + shared API-error-to-toast helper — `api-error.ts` (`getApiErrorMessage`, `getApiErrorCode`)

## Sprint 11c-2 – UI Hardening: Contained Fixes ✅ CLOSED (2026-07-20) | scope TBD

> Phase 2 of 3 — small, self-contained wins, don't require the Phase 3
> architectural migration to land first.

- [x] Replace the 2 raw `alert()` calls with Sonner toasts
- [x] Convert the 8 files still using native `<select>` to shadcn `<Select>` — `__all__` sentinel value pattern for the empty-string constraint
- [x] Add shadcn Calendar component — `DatePicker` wired to commission/payment date inputs
- [x] Split the two largest components (~700 lines each) into `LineItemsComposer.tsx` (shared generic) + two thin wrappers

## Sprint 11c-3 – UI Hardening: Architectural Migration ✅ CLOSED (2026-07-21) | scope TBD

> Phase 3 of 3 — the actual big lift. `react-hook-form`/`zod` are already
> installed and used in 6 files (the larger creation forms); this extends
> that pattern to the remaining simple dialogs still on plain `useState`.

- [x] Generic TanStack Table components — `ReadOnlyTable` (KPI/display, supports `title` as ReactNode, optional `footer`, `bare` mode for nesting) and `DataTable` (sortable/filterable), both built on shadcn's `Table` primitives — migrated every reachable hand-rolled table to them
- [x] Migrated data-fetching from `useState`+`useEffect`+axios to React Query — `hooks/queries/` + `hooks/mutations/` convention, one hook per query/mutation, real `useMutation` adopted everywhere (previously only `useQuery` was in use; `defaultOptions.mutations.onError` global toast was dead code until this pass activated it)
- [x] Extended React Hook Form to the 5 remaining simple create/edit dialogs (`CreateParty`, `EditParty`, `CreateStockArticle`, `RecordPayment`, `CreateCommission`)
- [x] API error messages → toast universally via the global mutation `onError` default; per-dialog overrides preserved for bespoke branching (overpayment choice, stock-override offer, error-code message maps)
- [x] Scanned for and fixed unhandled cases surfaced during the migration — `UsersPage` OTP-reset and `CommissionsPage` delete previously had **no error handling at all** (unhandled promise rejections); both now correctly toast on failure as a side effect of adopting `useMutation`

**Deliberately out of scope, staying hand-rolled:** `InvoiceDetailPage`/`ProformaDetailPage` line-items tables (inline row-editing state doesn't map cleanly onto `DataTable`) and `CommissionEditQueuePage`'s per-request comparison grid (a 3-column diff, not a record list). `SettingsPage` (sub-component-local loading pattern) and `BootstrapPage` (one-time wizard) were never brought onto the hooks pattern — neither needs cross-component cache sharing.

**Correction during this sprint:** an earlier session's handoff/memory claimed "11 pages migrated to React Query." Audited against the actual repo — only 8 were, and 3 dialogs described as "migrated in sandbox" had never actually been committed (sandbox containers are ephemeral; that work was silently lost between sessions). All were redone and verified in this sprint.

## Sprint 11d – Notifications | scope TBD

> Third of Fred's three real next priorities, replacing the cancelled
> migration sprint. Not yet scoped — no design decisions made (which events
> to notify on, in-app vs. email, real-time vs. polling, etc.). Sequenced
> after UI hardening since Sonner (installed in 11c-1) will likely be part
> of how in-app notifications actually render.

- [ ] To be planned

## Sprint 11e – Journal d'audit ✅ CLOSED IN CODE (2026-07-21) | scope TBD

> Already logged as a backlog item during Sprint 10. Full filterable audit
> log page (dedicated page or Paramètres tab), filters by user/action/date/
> entity, reads the existing `audit_log` every module already writes to via
> `logAudit()` — no new tracking needed, purely a display layer. Likely
> benefits from the TanStack Table work in 11c-3 landing first.

- [x] Dedicated admin+ `/audit-log` route/nav entry, separate from super_admin-only Paramètres
- [x] Filterable list over existing `/api/audit-log`: user, action, entity type, from/to dates
- [x] Paginated `DataTable` display with metadata popover and refetch indicator
- [x] React Query hook corrected/standardized as `useAuditLog.ts`

**Still pending:** runtime smoke in a running app with admin and super_admin users.

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

- [ ] Company-type party fields decision — do real clients include COMPANY-type parties? (Sprint 2/M3)

## Done

- [x] Phase 0 Brief — CDC v2 + legacy audit
- [x] Phase 1 Project Plan (§9 reconciled)
- [x] Phase 2 Feasibility (M1–M12)
- [x] Phase 3 Tech Stack (documented + frozen)
- [x] Phase 4 Dev Plan + TASKS.md
