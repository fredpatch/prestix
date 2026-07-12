# PrestiX — Feasibility Study (Phase 2)

> Methodology Phase 2 · module-by-module in dependency order · max 3 questions per module · edge cases decided, not left open.
> Basis: CDC v2 + legacy-reference/ + client answers. Accumulating doc — one fiche per module.
> Status: IN PROGRESS · started 2026-07-11

---

## M1 — Auth & Admin ✅ decided

### Confirmed for V1

- **Identity:** `User` (login by email). **Agent = User** → `agentId = userId`; Employee KPI (M12) attributes to `userId`.
- **RBAC — level-based hierarchy:** `agent=1 · manager=2 · admin=3 · super_admin=4`. Authorize = `user.level >= requiredLevel`; a higher level inherits every lower-level capability.
- **Auth stack:** JWT + bcrypt + OTP. Admin creates account → **OTP email activation** → user sets password. Password reset = OTP-based (legacy gap, now built).
- **Audit log:** append-only — auth events + every mutation on financial/business entities (issue, payment, penalty accrual, void, settings change).
- **Launch reality:** owner (super_admin) + daily operator (manager) active. Agent role provisioned but dormant until the attendance module (future).

### Design decisions retained

| Decision                                       | Value                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| Identity model                                 | User; login by email; `agentId = userId`                              |
| RBAC model                                     | Level-based: `user.level >= requiredLevel`; higher inherits lower     |
| Levels                                         | agent 1 · manager 2 · admin 3 · super_admin 4                         |
| Financial-constant & business-default mutation | **super_admin (4) only**                                              |
| Settings mutation gate                         | super_admin (maps legacy `SUPER_ADMIN`)                               |
| Account management                             | admin (3)+ manages manager/agent; only super_admin manages admins     |
| super_admin integrity                          | non-deletable; **≥1 active super_admin enforced**                     |
| Onboarding                                     | admin creates → OTP email activation → user sets password             |
| Password reset                                 | OTP-based                                                             |
| Password storage                               | bcrypt; `passwordHash` never leaves auth queries                      |
| Deletion                                       | soft-delete/deactivate only; historical `agentId` snapshots preserved |
| OTP policy                                     | reuse stack defaults: `OTP_EXPIRES_IN_MINUTES`, `OTP_MAX_ATTEMPTS`    |

### Edge cases decided

- **Self-lockout:** a user cannot remove their own last admin/super_admin role, nor deactivate the last super_admin. System enforces ≥1 active super_admin.
- **Deactivated user:** no login, but remains attributable in historical KPIs (agentId snapshots intact).
- **Inheritance direction:** upward only (a level-N user performs actions of levels 1..N). A few destructive/settings actions carry an explicit top-level gate beyond the simple `>=` check (financial constants, admin+ assignment, purge/export).
- **Deletion of a referenced user:** soft-delete; never hard delete (methodology golden rule). Snapshots preserve original attribution.

### Deferred to V2 (with reason)

- **Attendance module** — owner's future ask; new module tied to Agent activation. Reason: outside CDC v2 scope, no spec yet. Parked in scalability backlog.
- **Configurable/custom roles** beyond the 4 levels — the level model covers current need; revisit only if the org grows.
- **Multi-agence / multi-tenant** — deferred per Phase 1 §13.

### Reconciliation note

Phase 1 §9's RBAC matrix (Admin/Gérant/Comptable/Agent) is **superseded** by this 4-level hierarchy. "Comptable" removed (not in owner's role list). Update Phase 1 §9 at next plan revision.

---

## M2 — Settings & Catalog ✅ decided

### Confirmed for V1

- **Two-tier settings** (legacy pattern kept): **appearance** = client-local (localStorage theme/palette, applied immediately, no backend) · **server-side** = business defaults + feature flags + financial params, all super_admin-gated.
- **Business defaults:** `defaultCurrency` (XAF, uppercase 3-letter), `defaultDueDateOffsetDays` (>=0). **Prefill forms on mount only** (never on refetch — legacy bug avoided).
- **Financial params settings row** (super_admin-editable, server-side single source of truth): `PENALTY_AMOUNT` default **2500**, `PENALTY_GRACE` default **1 week**, `CREDIT_DECISION_PERIOD_DAYS` default **30**, `CREDIT_UNDERFEE_POLICY` default **HOLD_AND_NOTIFY** (see M3 credit flow).
- **Module feature flags:** sidebar show/hide per module. Papeterie ships hidden.
- **Commission-type catalog:** data-driven, super_admin-extensible from UI (structure only — see decisions).
- **Catalog seed:** idempotent.

### Design decisions retained

| Decision                  | Value                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Appearance settings       | client-local (localStorage), immediate, no backend call                                                  |
| Business defaults         | server-side, super_admin-gated, prefill-on-mount-only                                                    |
| defaultCurrency           | XAF, uppercase 3-letter                                                                                  |
| Penalty amount / grace    | **settings row**, defaults 2500 / 1 week, super_admin-editable, server-side                              |
| Penalty change semantics  | **forward-only** — accrued penalties unchanged; new value applies to future accruals                     |
| Penalty history stability | each penalty row **snapshots** the amount/grace it accrued under                                         |
| Module visibility         | module-level feature flags (sidebar); Papeterie off at launch                                            |
| Canal+ gating             | commission-**type** `active` flag in catalog (NOT a module flag), off until owner activates              |
| Commission types          | **data-driven catalog**: `code` slug + label + icon + `active` + custom field schema (→ JSONB `details`) |
| Commission amount         | **manual entry always** — no auto-calc, no formula engine, no calc strategies, any type                  |
| Catalog seed              | idempotent                                                                                               |

### Edge cases decided

- **Penalty param change** is forward-only; amount/grace snapshotted onto each penalty row → editing the setting never rewrites financial history.
- **Disabling a commission type with historical transactions** → soft-disable (`active=false`), never hard delete; existing transactions keep their type. Cannot delete a type in use.
- **Module flag off with existing data** → hidden in sidebar, data preserved; re-enabling restores access.
- **Custom field removed from a type schema** → historical JSONB `details` retain the old value (no data destruction); the form simply stops showing it.

### Deferred to V2 (with reason)

- **Free-form formula / calc engine** for user-defined commission math — dropped entirely (client chose fully manual). Not revisited unless a real margin-tracking need appears.
- **Component-field capture** for Transfert (buy/sell rates) + Visa (supplier/TTC prices) — dropped per client decision; superseded CDC v2 §2 as written.

### Reconciliation notes

- **CDC v2 §2** — remove computed-commission language for Transfert ("écart calculé") and Visa ("frais de service auto-calculé") + their component fields at next CDC revision. All commissions are manual-amount.
- **legacy-reference/commission-divers.md** — annotate: per-type auto-calc section superseded; manual amount only.
- Exact seed field-list per commission type is finalized at **M10** feasibility (M2 fixes only the catalog _mechanism_).

---

## M3 — Party ✅ decided

### Confirmed for V1

- **One `parties` table** with role flags `isClient` / `isReferrer` — a party can be **both**. Plus contact, status, party code + search fields.
- **Snapshot rule** (kept): buyer/referrer details are **copied onto invoices at creation**, not re-read live. Historical documents stay stable if the party record later changes.
- **Party UI + stats built fresh** — legacy party backend is trustworthy, but its UI/stats were stubs (`stats always 0`). Don't port stubs.
- **History:** commercial (invoices) and épargne sections **separate, independently paginated** (`?page=` vs `?epargnePage=`).
- **Three distinct party balances, never merged:** `receivables` (owed **to** agency, invoice-side) · `credit/avoir` (owed **by** agency, pre-épargne) · `épargne` (savings account).
- **Référent = attribution only** (recorded on invoices/commissions → Apporteur KPI). No payout logic.

### Client Credit / Avoir flow (NEW — spans M3 / M5 / M11; not in CDC v2)

```
Invoice due 500 · client tenders 1000
 → 500 applied to invoice                 (CA / revenue)
 → 500 overpayment → agent prompt:
     (a) Rendre la monnaie → cash back, recorded, no credit
     (b) Laisser en crédit → +500 credit lot (NOT CA)
 → within decision window (default 30d, configurable), client may:
     · refund (cash back)
     · spend on a new invoice/purchase       ← credit is a payment source
     · convert to épargne now
 → on lot expiry (node-cron):
     · new saver  → inscription fee → CA, remainder → épargne
     · existing   → full lot → épargne
     · credit < fee → CREDIT_UNDERFEE_POLICY (default HOLD_AND_NOTIFY)
```

### Design decisions retained

| Decision                      | Value                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Party model                   | one table; `isClient` + `isReferrer` flags; can be both                                                                            |
| Party snapshot on invoice     | copied at creation, not re-read live                                                                                               |
| History sections              | commercial vs épargne separate, distinct pagination params                                                                         |
| Party balances                | receivables · credit/avoir · épargne — three separate, never merged                                                                |
| Credit ledger                 | append-only, **derived balance**, dated **lots** (FIFO consumption, per-lot expiry)                                                |
| Overpayment                   | excess over amount-due; agent prompted change-now vs credit                                                                        |
| Payment capture               | `amountTendered` / `amountApplied` / `changeGiven` / `creditedAmount` (cash-drawer reconciliation)                                 |
| Overpayment & credit in CA    | **never** — only amount applied to the invoice is revenue                                                                          |
| Credit within window          | refund · spend on new invoice · convert to épargne                                                                                 |
| Credit decision window        | `CREDIT_DECISION_PERIOD_DAYS`, default 30, super_admin-editable                                                                    |
| Auto-conversion               | node-cron; per-lot on expiry → épargne                                                                                             |
| Inscription fee at conversion | → CA (Meeting 4 rule); deposit portion → épargne; fee amount snapshotted on the conversion event                                   |
| Under-fee policy              | `CREDIT_UNDERFEE_POLICY`, default `HOLD_AND_NOTIFY` (keep credit + remind client + manager worklist flag); alt `WAIVE_AND_CONVERT` |
| Debt safety                   | **never** auto-create client debt or negative épargne                                                                              |
| Référent                      | attribution only (V1); recorded → Apporteur KPI                                                                                    |
| Deletion                      | soft-delete; snapshots preserve historical attribution                                                                             |

### Edge cases decided

- **Partial spend** reduces the credit lot; the remainder keeps its **original** expiry (clock doesn't reset).
- **Multiple overpayments** = multiple dated lots, each with its own window; FIFO on spend, independent conversion on expiry.
- **Under-fee at expiry** → policy setting (default hold + notify); credit preserved, no forced conversion, no debt.
- **Change given immediately** is recorded on the payment (not a credit entry) for cash reconciliation.

### Deferred to V2 (with reason)

- **Reward system** (buyer/référent, based on real CA — shop gifts, ticket/article remises) — client intends it but **management spec pending**. V1 captures the attribution hooks (référent + client on records); the reward engine is V2.

### Cross-module impacts

- **M2 Settings:** + `CREDIT_DECISION_PERIOD_DAYS` (30), + `CREDIT_UNDERFEE_POLICY` (HOLD_AND_NOTIFY) — already added to M2 registry.
- **M5 Payments:** overpayment capture + agent prompt; credit as a payment source within window.
- **M11 Épargne:** conversion target; inscription fee → CA on auto-enroll.
- **M12 KPI:** credit/overpayment excluded from CA; inscription fee included.

### Reconciliation / doc-drift

- **NEW feature "Crédit client / Avoir"** — not in CDC v2. Add a section (relates to §3 Paiements / §4 Créances) at next CDC revision.
- **Reward system** → add to CDC v2 §Évolutivité + V2 backlog.

### To capture at code-level (M3 legacy pull, append later)

- [ ] Inspect legacy party **credit engine** — see if any is reusable (our spec is authoritative regardless).
- [ ] Referrer → referred-invoice linkage shape.
- [ ] Party code / search field definitions.

---

## M4 — Document Engine (Proforma → Facture → BL) ✅ decided

### Confirmed for V1

- **Documents:** `Proforma`, `Invoice`, `DeliveryNote` + `InvoiceLine`. Proforma is **optional** (an invoice can be created directly as a draft).
- **Proforma → Invoice = SEPARATE documents, FK-linked** (audit-safe lineage). Promotion **creates a new invoice** that snapshots its lines; the proforma is **retained** as a historical artifact. No id reuse — kills the legacy id-rebinding bug.
- **`issue()` = single commitment point**, one DB transaction: status → `issued`, allocate invoice number, mark attached orders `invoiced`, decrement stock. All-or-nothing. **Idempotent via `requestId`**.
- **Draft-only mutations** — add/remove/edit lines throw if the doc isn't `draft`.
- **Snapshots** — buyer/référent + service details copied onto the document at creation, never re-read live.
- **Proforma 48h expiry** — node-cron sets `Expirée`; no auto-cancel; invoice creation **blocked** from an expired proforma (proforma retained).
- **Numbering** — row-locked `counters` table (`SELECT … FOR UPDATE`), **continuous serial, never resets**. Invoice `INV-YYYYMM-XXXX` (XXXX continuous, YYYYMM display only); separate continuous `PRO-…` counter. Proforma numbered at creation (48h clock starts); invoice numbered at issue.
- **Payment only when `issued`**; delivery notes separate, don't re-trigger issuance.
- **BL rule** (Feedback1) — BL generated **after full payment**, stays clean (no payment recap).
- **UI** — menu "Documents commerciaux" → **"Documents comptabilité"** (Meeting 4). Print acquis carried: "Reçu le" on Proforma/Facture/BL, signature order destinataire→émetteur, footer (Centre-Ville, Galerie Hollando Bureau 06), payment detail (avance/reste/dates) on Facture only.

### Design decisions retained

| Decision               | Value                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Proforma→Invoice model | separate documents, FK-linked; proforma retained                                               |
| Proforma               | optional; numbered + 48h clock at creation                                                     |
| issue()                | one atomic transaction; idempotent via requestId                                               |
| Numbering              | continuous serial, row-locked counter; INV-YYYYMM-XXXX (YYYYMM display); separate PRO- counter |
| Mutations              | draft-only                                                                                     |
| Snapshots              | buyer/référent/service copied at creation                                                      |
| Proforma expiry        | node-cron → Expirée; blocks invoice creation; no auto-cancel                                   |
| Cancellation (issued)  | privileged **admin+**, **reason required**, audited, terminal                                  |
| Cancel → stock         | **auto-reverse via compensating IN** movement (original OUT retained; append-only ledger)      |
| Cancel → penalties     | **voided** (whole document void; not a waiver; gated + audited)                                |
| Cancel → paid money    | **→ credit/avoir (V1)**; refund choice + standalone refund = V2                                |
| Payment gate           | only when `issued`                                                                             |
| BL                     | generated after full payment; no payment recap                                                 |
| Audit                  | every mutating action logged (append-only)                                                     |

### Edge cases decided

- **Add-line after issue** → not allowed; add before conversion or make a new invoice.
- **Double-issue** → prevented by `requestId` idempotency.
- **Numbering race / concurrent issue** → row-locked counter, no gaps/duplicates.
- **Cancel of a paid invoice** → money→credit, penalties voided, stock reversed, reason required, admin+.
- **Issue over insufficient stock** → allowed (auto-OUT permits negative — see M9); never blocks issuance.

### Deferred to V2 (with reason)

- **Refund / cash-out flow** + refund-vs-credit choice at cancel — client wants it later; V1 routes to credit.
- **Formal credit-note document type** — cancellation + credit covers V1; a dedicated avoir document can come later if audit needs it.

### Cross-module impacts

- **M5 Payments:** payment only when issued; overpayment prompt; cancel routes paid money to credit.
- **M6 Penalties:** voided on cancellation.
- **M8/M9 Orders:** ticket/shop orders attach to draft, marked `invoiced` at issue.
- **M9 Stock:** OUT on issue, compensating IN on cancel.
- **M3 Credit:** cancellation of a paid invoice feeds the credit ledger.

### To capture at code-level (M4 legacy pull, append later)

- [ ] Exact counter implementation + serial width/format (leading zeros).
- [ ] `requestId` idempotency mechanism in legacy `issue()`.
- [ ] Confirm legacy BL "after full payment" rule and print template structure.
- [ ] Line-snapshot shape on proforma→invoice promotion.

---

## M5 — Paiements & Échéancier ✅ decided

### Confirmed for V1

- `MAX_INSTALLMENTS = 3`; payment mode (**full** or **échelonné**) chosen at issue.
- **Installment mode:** **avance required at issue** = échéance 1 (dated issue-day, paid immediately); reste split into up to **2 further future échéances**. ≤3 scheduled amounts total, **Σ = invoice total** (enforced).
- **Full mode:** single expected payment; due date = issue + `defaultDueDateOffsetDays` (M2 business default).
- **Invoice final due date = last échéance date.**
- **Payment allocation:** **FIFO** to oldest unpaid échéance by default; **agent can override** the target échéance.
- **Status** `unpaid → partial → paid`, auto-derived at invoice and per-installment level.
- Échéancier visible on invoice detail + printed invoice.
- **Payment only when `issued`** (M4). **Overpayment → change/credit prompt** (M3). **Cancel → credit** (M4).

### Design decisions retained

| Decision                | Value                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Installments            | ≤3, Σ = invoice total (enforced at issue)                                                                                  |
| Avance                  | required in installment mode; = échéance 1, dated issue-day, paid now                                                      |
| Full mode               | single payment; due = issue + defaultDueDateOffsetDays                                                                     |
| Final due date          | = last échéance                                                                                                            |
| Allocation              | FIFO default; agent can retarget a specific échéance                                                                       |
| Payment status          | auto-derived, invoice + per-installment                                                                                    |
| Payment record          | **append-only**: amountTendered / amountApplied / changeGiven / creditedAmount / method / date / agentId                   |
| Payment methods         | enum: cash · mobile money · virement · **credit/avoir** (M3, within window) · **épargne** (M11, manager+, balance-guarded) |
| Corrections             | reversal entry, never edit (audit integrity)                                                                               |
| Reschedule              | privileged **admin+**, reason-required, audited, **forward-only**                                                          |
| Reschedule vs penalties | **accrued penalties locked/retained**; only future accrual date shifts — no waiver loophole                                |
| Overpayment             | → M3 change/credit prompt; never CA                                                                                        |

### Edge cases decided

- **Payment > remaining due** → overpayment → M3 prompt (change now vs credit).
- **Partial payment** → applied FIFO; échéance stays `partial` until fully covered.
- **Reschedule of an overdue échéance** → allowed (privileged) but accrued penalty stays owed; new grace clock from the new date.
- **Credit/avoir as payment** → only valid within its decision window (M3); after conversion it's épargne, not a payment source.
- **Σ installments ≠ total** → rejected at issue.

### Deferred to V2 (with reason)

- **Refund / cash-out** — V2 (from M4); V1 routes to credit.

### Cross-module impacts

- **M3 Credit:** overpayment→credit; credit spent as a payment method; cancel→credit.
- **M4 Documents:** payment gated on issued; cancel consequences.
- **M6 Penalties:** échéance overdue drives penalty accrual; reschedule is forward-only vs accrued penalties.
- **M12 KPI:** payments feed receivables/overdue; overpayment excluded from CA.

### To capture at code-level (M5 legacy pull, append later)

- [ ] Legacy applyPayment allocation logic (confirm FIFO shape).
- [ ] Per-installment status transition implementation.
- [ ] Confirm avance modeling against legacy printed "avance / reste à payer".

---

## M6 — Créances & Pénalités ✅ decided

### Confirmed for V1

- **Penalty = 2500 XAF per full week late, ACCUMULATING** (wk1=2500, wk2=5000, wk3=7500…), per échéance, **parallel & independent** across échéances.
- Starts **1 week after** the missed échéance; anchored to échéance date + 7-day multiples; `node-cron` daily accrual.
- **Flat, not proportional** to remaining balance; accrues **until the échéance is fully settled** — partial payment does **not** stop it.
- `PENALTY_AMOUNT` / `PENALTY_GRACE` are super_admin-editable settings (default 2500 / 1 week); changes **forward-only**, each accrual **snapshots** the amount/grace used (M2).
- **No manual waiver.** Voided only via invoice cancellation (privileged, audited — M4).
- **Payment allocation:** agent chooses **principal-first or penalty-first** at payment time (extends M5 FIFO/override). Penalty-first leaves principal open → **accrual continues; UI warns**.
- **Penalty income** = its **own KPI bucket**, separate from sales CA, counted in **total gain** (M12).
- **Créance** = unpaid principal + accrued penalties; surfaced in invoice detail + a créances view.

### Design decisions retained

| Decision           | Value                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Accrual model      | +2500 per full week late, accumulating, per échéance                                        |
| Parallelism        | independent penalty stream per overdue échéance                                             |
| Anchor / cadence   | échéance date + 7-day multiples; node-cron daily                                            |
| Proportionality    | flat 2500/week, never proportional to balance                                               |
| Stop condition     | échéance fully settled (partial payment doesn't stop)                                       |
| Amount/grace       | editable setting, forward-only, snapshotted per accrual                                     |
| Waiver             | none; void only via cancellation (M4)                                                       |
| Payment allocation | agent chooses principal-first / penalty-first; penalty-first → accrual continues (UI warns) |
| Penalty rows       | append-only; each weekly accrual = a row keyed (invoiceId, installmentId)                   |
| Penalty income     | own KPI bucket, separate from sales CA, in total gain                                       |
| Créance total      | unpaid principal + accrued penalties                                                        |

### Edge cases decided

- **Penalty-first payment** → principal stays open, meter keeps running; UI warns explicitly.
- **Multiple overdue échéances** → independent parallel penalty streams (natural from per-(invoice,installment) rows).
- **Reschedule** (M5) → forward-only; accrued penalties locked, new grace from new date.
- **Setting change mid-life** → forward-only; historical accruals unchanged (snapshotted).
- **Cancellation** → penalties voided (M4), gated + audited.

### Deferred to V2 (with reason)

- **Relance / reminder document** (formal overdue notice) — nice-to-have, not V1-blocking.

### Cross-module impacts

- **M2:** amount/grace settings (forward-only).
- **M5:** allocation choice; reschedule forward-only.
- **M4:** void on cancellation.
- **M12:** penalty income = own bucket; **overdue source of truth = receivables aggregation** (NOT ad-hoc invoice filters — this is the legacy bug to avoid).

### Implementation guardrail (money module)

- Back all penalty math with a **dedicated test suite** (named constants, no magic numbers).
- **Cross-compare gate:** validate accrual outputs against the legacy Beta on migrated data before sign-off.

### To capture at code-level (M6 legacy pull, append later)

- [ ] Legacy penalty engine was thin — confirm what (if anything) is reusable; build fresh otherwise.
- [ ] Exact weekly-tick boundary (calendar week vs rolling 7 days from échéance) — default: rolling 7-day multiples.

---

## M7 — Remises ✅ decided

### Confirmed for V1

- **Fixed-amount, line-level** discount (per ticket/article line) — the proven legacy model. Invoice-level discount = **derived sum** of line discounts (never stored separately).
- **Authorization: manager+ only** (level ≥2). Agents (level 1) cannot apply discounts. Every discount audited.
- **Discount ≥ 0 and ≤ line amount**; **draft-only** (M4).
- **Appears on printed invoice** — per-line discount + total-discount summary row (Puppeteer template).
- **CA = net of discount**; échéancier + penalties compute on the **net** principal.

### Design decisions retained

| Decision               | Value                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------- |
| Model                  | fixed-amount, line-level; invoice discount = derived sum                                |
| Authorization          | manager+ (level ≥2) only; agents cannot discount                                        |
| Bounds                 | ≥ 0, ≤ line amount                                                                      |
| Mutability             | draft-only                                                                              |
| Print                  | per-line + total-discount summary row                                                   |
| CA treatment           | net of discount                                                                         |
| Échéancier / penalties | computed on net total / net principal                                                   |
| Storage                | `discount` column on invoice-line (numeric, default 0); invoice-level is a computed sum |

### Edge cases decided

- **Discount > line amount** → rejected (no negative net line).
- **Discount after issue** → blocked (draft-only).
- **Agent attempts discount** → blocked (role gate manager+).
- **Discount vs CA** → CA nets the discount; M12 must not double-count.

### Deferred to V2 (with reason)

- **Percentage discounts** — not needed for stated V1 use; add if client insists.
- **Global invoice-level discount** — line-level covers CDC §5; global is advanced-rules territory (Phase 1 §8 ➤).

### Cross-module impacts

- **M4:** draft-only mutation rule.
- **M5:** échéancier builds on net total.
- **M8/M9:** line-level discount on tickets + shop articles.
- **M12:** CA net of discount (no double-count).

### To capture at code-level (M7 legacy pull, append later)

- [ ] Reuse legacy `invoice.calculation.ts` line-sum logic (`items.reduce(... + discount)`).
- [ ] Print template surfacing of per-line + summary discount.

---

## M8 — Billetterie ✅ decided

### Confirmed for V1

- **In the document workflow** (Proforma→Facture→BL, M4): ticket order attaches to draft → marked `invoiced` at issue.
- **Travel class = 4-value enum:** `economy · business · first · premium`. **Abbreviations are a display/print layer** (not stored): eco · bnss · prem · **prm** (Premium). Changing a label = no data migration.
- **One ticket line per passenger** (single pax/line; multi-pax = multiple lines) — mirrors the shop-line→passenger pattern (M9).
- **Ticket shape reused from legacy** (real oracle): route **segments** (`one_way|round_trip`, departureDate, returnDate, flightNumber, `supplierPrice`, `sellingPrice`) + **passenger** (name) + **references** (PNR, ticketNumber, supplierReference, destination, travelClass, travelDate/returnDate).
- **Margin captured:** `sellingPrice − supplierPrice` → feeds M12 **gain** KPI. CA (Billetterie bucket) = sellingPrice, net of discount.
- **Line-level discount** (manager+, M7) applies to sellingPrice.

### Design decisions retained

| Decision         | Value                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Workflow         | in Proforma→Facture→BL; attach → invoiced at issue                                                      |
| Travel class     | enum economy·business·first·premium (stored); abbrev display-only                                       |
| Abbreviations    | eco · bnss · prem (Première/First) · **prm** (Premium)                                                  |
| prem/prm         | Première/First keeps `prem` (live/printed history); Premium = `prm` — **final label pending client OK** |
| Line granularity | one passenger per ticket line                                                                           |
| Ticket fields    | reuse legacy: segments + passenger + references (PNR etc.)                                              |
| Pricing          | supplierPrice + sellingPrice both stored                                                                |
| CA / gain        | CA = sellingPrice (net of discount); gain = sellingPrice − supplierPrice − discount                     |
| Discount         | line-level, manager+ (M7)                                                                               |

### Edge cases decided

- **Abbreviation change later** → trivial (display layer over enum), no migration.
- **Multi-passenger booking** → multiple ticket lines, each with its own passenger + price.
- **Round-trip** → handled by segments (departure + return) within one line.

### Deferred to V2

- None module-specific.

### Cross-module impacts

- **M4:** attach/issue lifecycle.
- **M7:** line-level discount on sellingPrice.
- **M9:** passenger-per-line pattern shared.
- **M12:** Billetterie CA bucket (sellingPrice net of discount) + gain (selling − supplier).

### Pending external validation

- **`prm` label for Premium** — client to confirm final printed abbreviation (technical model locked regardless).

### To capture at code-level (M8 legacy pull, append later)

- [ ] Reuse legacy ticketing model + invoice mappers (segments/passenger/references).
- [ ] Status transitions (draft → attached_to_invoice_draft → invoiced).
- [ ] Add `premium` to the class enum + `prm` to the abbreviation display map.

---

## M9 — PrestiShop + Stock ✅ decided

### Confirmed for V1

- **Shop = invoice-line only** (POS receipt = V2). A walk-in buying only a shop item still gets a **shop-only invoice**.
- **Shop line** (reuse legacy shape): `articleName · quantity · unitPrice · supplierPrice · sellingPrice · optional stockArticleId · designated passenger`.
- **Pricing:** stock article `sellingPrice` is the **default, editable per line**; `supplierPrice` default from article → margin.
- **Designated passenger:** dropdown of the invoice's **ticket passengers**; **free-text** on a shop-only invoice (CDC §1 — passenger ≠ buyer).
- **Stock OUT on `issue()`** (same DB transaction), idempotency guard `refType='SHOP_ORDER' + refId=lineId`. Movements append-only (IN/OUT/ADJUST).
- **Negative stock on issue:** blocked for agents; **manager+ override** required to oversell (records negative movement + warning + audit). Manual OUT/ADJUST still **blocks negative** (blockNegative=true).
- **Restock:** manager+ records IN/ADJUST movements.
- **Margin** = sellingPrice − supplierPrice → M12 gain. **Below-threshold** (onHand < minLevel) → operational KPIs only, never revenue cards.
- **Line-level discount** (manager+, M7).

### Design decisions retained

| Decision          | Value                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| Sale channel (V1) | invoice-line only; shop-only invoice for walk-ins                                 |
| Shop line shape   | articleName·qty·unitPrice·supplierPrice·sellingPrice·stockArticleId?·passenger    |
| Pricing           | article sellingPrice = default, editable per line                                 |
| Passenger         | dropdown of invoice ticket passengers; free-text if shop-only                     |
| Stock trigger     | OUT on issue(), in the issue transaction                                          |
| Idempotency       | refType+refId guard (no double movement on re-issue)                              |
| Negative on issue | manager+ override only (agents blocked); audited                                  |
| Manual OUT/ADJUST | blocks negative                                                                   |
| Restock           | manager+ IN/ADJUST                                                                |
| Margin / CA       | CA = sellingPrice (net discount); gain = selling − supplier                       |
| Below-threshold   | operational KPIs only                                                             |
| stock module      | stock_articles · stock_items(onHand,minLevel,unit) · stock_movements(append-only) |

### Edge cases decided

- **Pure service item** (no stockArticleId) → no stock movement.
- **Insufficient stock at issue** → agent blocked; manager+ override records the negative, warns, audits.
- **Re-issue / retry** → idempotency guard prevents duplicate movement.
- **Per-line price edit** → margin recomputed from edited selling vs supplier.
- **Stock article with movement history** → soft-delete only.

### Deferred to V2 (with reason)

- **POS receipt mode (Papeterie)** — standalone high-frequency low-value sales; separate receipt + stock flow. Prototype for owner decision (Phase 1 §13).

### Cross-module impacts

- **M4:** stock OUT inside issue() transaction; negative-override gate is new issue() logic.
- **M7:** line-level discount.
- **M8:** passenger dropdown sourced from ticket passengers on the invoice.
- **M12:** PrestiShop CA bucket (sellingPrice net discount) + gain; below-threshold operational only.

### To capture at code-level (M9 legacy pull, append later)

- [ ] Reuse legacy shop + stock models + stock-linked-sales mapper.
- [ ] Idempotency guard implementation (refType+refId).
- [ ] **NEW vs legacy:** add manager+ override gate to the issue() stock-insufficiency check (legacy allowed negative freely).

---

## M10 — Commission Divers ✅ decided

### Confirmed for V1

- **Single `commission_transactions` table**; `type` enum + JSONB `details`; **data-driven catalog** (super_admin-extensible — M2).
- **Common columns:** `type · agentId(req) · clientPartyId(FK, nullable) · referrerPartyId(FK, nullable) · date(req) · commissionAmount(req, manual, >0)` + timestamps + soft-delete.
- **Type-specific → JSONB `details`:** opérateur, fournisseur (**free-text**), référence, visa type (e-visa/tampon), période `{start,end}`, etc.
- **Client & référent** = optional **Party FKs** with **inline quick-add** (enables Client/Apporteur KPI + future rewards). Absent where N/A (e.g. Mobile Money).
- **Autonomous** — never enters Proforma→Facture→BL. **Counts in CA + gain**; each type is its **own CA-composition bucket** (M12).
- **agentId → Employee KPI.**
- **6 types active at launch:** mobile_money · transfert_change · visa · location_voiture · hebergement · assurance_voyage. **Canal+ seeded inactive** (V2).

### Per-type seed fields (beyond agent/date/commissionAmount)

| Type                | Fields                                                                        |
| ------------------- | ----------------------------------------------------------------------------- |
| Mobile Money        | opérateur                                                                     |
| Assurance Voyage    | client, référent, fournisseur (assureur, free-text), référence (opt), période |
| Visa                | type de visa (e-visa/tampon), référent, client, fournisseur (free-text)       |
| Location de Voiture | référent, client, période                                                     |
| Hébergement         | référent, client, fournisseur (free-text), période                            |
| Transfert et Change | (agent/amount/date only)                                                      |
| Canal+ (V2)         | same pattern, inactive until activated                                        |

### Design decisions retained

| Decision          | Value                                                          |
| ----------------- | -------------------------------------------------------------- |
| Table             | single commission_transactions; type enum + JSONB details      |
| Catalog           | data-driven, super_admin-extensible (M2); per-type active flag |
| Amount            | manual always; no auto-calc, no formula engine                 |
| Client / référent | optional Party FK + inline quick-add                           |
| Supplier          | free-text (in details) — no Party entity in V1                 |
| période           | structured `{start,end}` in details                            |
| Workflow          | autonomous; no document; counts in CA + gain                   |
| CA composition    | one bucket per type                                            |
| Employee KPI      | via agentId                                                    |
| Deletion          | soft-delete; disabling a type in use = soft-disable (M2)       |

### Edge cases decided

- **Commission with no client** (Mobile Money) → clientPartyId null; no Client-KPI attribution for that row.
- **Quick-add party** inline when client/référent not yet registered.
- **New UI-created type** → manual amount + custom descriptive fields (JSONB); no calc.
- **Disable a type with history** → soft-disable, transactions retain type (M2).

### Deferred to V2 (with reason)

- **Canal+ activation** — seeded inactive; flip active flag when owned.
- **Supplier as first-class Party** — upgrade path from free-text if reporting需要.
- **Reward system** (M3) — pending management spec.

### Cross-module impacts

- **M3:** client/référent Party FKs + quick-add.
- **M2:** type registry, custom fields, active flags.
- **M12:** CA composition per type; Employee KPI (agentId); Apporteur/Client KPI (party FKs).

### To capture at code-level (M10 legacy pull, append later)

- [ ] Mine legacy **assurance-service** + **mobile-money-service** (real) for field/validation patterns.
- [ ] visa / location / hébergement / transfert = greenfield from field lists above (legacy stubs/none).

---

## M11 — Épargne Voyage ✅ decided

### Confirmed for V1

- **Append-only ledger; balance derived, never stored** — `Σ(recorded deposits) − Σ(recorded withdrawals)` per `(partyId, currency)`. **XAF-only V1** (currency column kept for future).
- **SavingsTransaction:** nature `deposit|withdraw`; `totalAmount` server-computed (`amount×quantity`, amount>0, qty≥1); **draft → recorded (immutable)**.
- **Withdrawal:** manager+, balance-guarded in `SERIALIZABLE`/row-locked txn, **generates a receipt**.
- **Épargne as invoice payment source** — paying from épargne = a withdrawal applied to the invoice (payment method `épargne`), **manager+ gated**, balance-guarded, generates withdrawal receipt + payment record (M5).
- **Subscription / registration sub-module** — monitors savers. **Two entry paths**, both charge inscription fee → CA:
  - **Direct** — client pays the inscription fee out of pocket; account opened.
  - **Credit conversion** (M3) — fee deducted from credit.
- **One savings_account per party** (per currency); inscription fee **once per party**; fee amount **snapshotted** + `entryPath` recorded.
- **`EPARGNE_INSCRIPTION_FEE`** = super_admin setting — **amount pending owner value**.
- **Two flows never merged:** inscription fee → CA (own bucket); deposits/withdrawals → **never** CA.
- **Reversal via compensating entry** (build the cancel the legacy left unimplemented); gated + audited.
- **Party history** épargne section separate, distinct pagination (M3). **"Solde net (période)"** = global metric, **not** a client available balance (labels explicit).

### Design decisions retained

| Decision           | Value                                                                     |
| ------------------ | ------------------------------------------------------------------------- |
| Balance            | derived, never stored; per (partyId, currency)                            |
| Currency           | XAF-only V1; column kept                                                  |
| Transaction        | draft → recorded (immutable); totalAmount server-computed                 |
| Withdrawal         | manager+, balance-guarded, receipt generated                              |
| Épargne as payment | withdrawal applied to invoice; manager+; balance-guarded (M5)             |
| Subscription paths | direct (out-of-pocket) OR credit-conversion (M3)                          |
| Account            | one per party/currency; inscription fee once; fee + entryPath snapshotted |
| Inscription fee    | super_admin setting (amount pending); → CA                                |
| CA treatment       | fee → CA (own bucket); deposits/withdrawals never CA                      |
| Reversal           | compensating entry, gated + audited                                       |
| History            | épargne section separate, distinct pagination                             |

### Edge cases decided

- **Withdraw / épargne-payment > balance** → `400 INSUFFICIENT_EPARGNE_BALANCE`.
- **Duplicate subscription** → blocked (one account/party).
- **Credit < inscription fee at conversion** → M3 `CREDIT_UNDERFEE_POLICY` (default HOLD_AND_NOTIFY).
- **Migration negative balances** → warn, don't hide.
- **Recorded transaction** → immutable; correction only via reversal entry.

### Deferred to V2 (with reason)

- **Multi-currency épargne** — XAF covers V1; column already present for later.

### Cross-module impacts

- **M2:** `EPARGNE_INSCRIPTION_FEE` setting.
- **M3:** credit conversion → deposit; party history épargne section.
- **M5:** épargne = payment method (manager+, guarded).
- **M12:** inscription fee → CA bucket; deposits/withdrawals excluded; "Solde net période" global metric only.

### Pending external value

- **`EPARGNE_INSCRIPTION_FEE` amount** — owner to provide (seed default).

### To capture at code-level (M11 legacy pull, append later)

- [ ] Reuse legacy ledger-balance-flow (well-audited oracle).
- [ ] Build cancel/reversal properly (legacy route unimplemented); drop legacy stale invoice dead code.
- [ ] Withdrawal guard in SERIALIZABLE/row-locked txn.

---

## M12 — Dashboard & KPI / Reporting ✅ decided (capstone)

### Confirmed for V1 — two surfaces

**A. Dashboard** — gross CA + composition + core KPIs, date-filterable, **accrual/cash toggle**.

- **CA Global = GROSS** (ticket/shop selling price net discount; commission amount; épargne-inscription fee; penalty income), broken down by **composition bucket** (Meeting 4).
- **Overdue** = receivables aggregation, **single source** (legacy bug fix); **Impayées ≠ En retard** (distinct cards); **revenue = issued only**.
- **Stock KPIs** → operational section only. **Épargne "Solde net période"** = global metric, not client balance, not CA.
- KPIs: **Client/Acheteur · Apporteur/Référent · Employé**. **Employé = volume (count) + value (CA/gain) per agent** (agentId).

**B. Reporting / Analysis section** (V1 basic; advanced → V2) — manager-facing:

- **Gross CA** + **real profit/gain** (margin) + KPIs + **Excel/PDF export** (CDC deliverable).

### CA vs Gain buckets

| Bucket                   | Gross CA                                    | Profit/Gain        |
| ------------------------ | ------------------------------------------- | ------------------ |
| Billetterie              | sellingPrice (net disc)                     | selling − supplier |
| PrestiShop               | sellingPrice (net disc)                     | selling − supplier |
| Commission ×6 (per type) | commission amount                           | full (no cost)     |
| Épargne-inscription      | fee                                         | full               |
| Penalty income           | penalty                                     | full               |
| **Excluded from CA**     | credit/avoir · épargne deposits/withdrawals | —                  |

### Design decisions retained

| Decision               | Value                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| Dashboard CA           | gross; composition by bucket; filterable                                      |
| Date basis             | **selectable toggle**: accrual (issue/transaction date) ↔ cash (payment date) |
| Overdue source         | receivables aggregation, single query (bug fix)                               |
| Unpaid vs overdue      | distinct cards                                                                |
| Revenue scope          | issued invoices only                                                          |
| Stock / épargne        | operational / global-metric sections, never revenue cards                     |
| Employé KPI            | volume + value per agent (agentId)                                            |
| Client / Apporteur KPI | value (+ volume) attributed via Party FKs; feeds future rewards               |
| Reporting section      | gross CA + profit + KPIs + Excel/PDF export (V1 basic)                        |
| Architecture           | one reporting module, one PG DB, `GROUP BY` bucket, shared from/to            |

### Edge cases decided

- **Empty DB / initial state** → clean zero-state (no broken cards).
- **Cancelled/draft** → excluded from revenue + composition.
- **Consistent `from`/`to`** across all sections; each section filters on its relevant date within the toggle.
- **Overdue never from ad-hoc filters** — single receivables source (the exact legacy bug).

### Deferred to V2 (with reason)

- **Advanced analytics** (trends, forecasts, drill-downs) — dashboard + basic report cover V1.
- **Reward system** (feeds off Apporteur/Client KPI) — pending management spec (M3).

### Cross-module impacts (consumes all)

- **M4** issued invoices (CA) · **M5** payments (cash-basis toggle) · **M6** overdue source + penalty income · **M8/M9** gross + margin · **M10** commission buckets + agentId · **M11** inscription→CA, deposits/withdrawals excluded, solde net.

### To capture at code-level (M12 legacy pull, append later)

- [ ] Reproduce + root-cause the exact legacy KPI/overdue bug (confirm it's the source-mismatch).
- [ ] Finalize the composition `GROUP BY` bucket query (gross + gain variants).

---

## Phase 2 — Status: COMPLETE ✅ (M1–M12)

All 12 modules analyzed in dependency order; edge cases decided, none left open.

### Pending external values (non-blocking, needed before relevant sprint)

- `prm` printed label for Premium class — **client** OK.
- `EPARGNE_INSCRIPTION_FEE` amount — **owner**.
- Team composition + hour estimates — **sponsor** (Phase 1 §5/§7).

### CDC v2 revision backlog (fold in at next doc pass)

- Remove Transfert `écart`/Visa `frais auto` computed language → all commissions manual amount.
- Add **"Crédit client / Avoir"** section (overpayment → credit → auto-épargne).
- Add **Épargne subscription** (direct + credit paths) + **épargne-as-payment**.
- Add **reward system** under Évolutivité (V2).
- Phase 1 §9 RBAC → replace with 4-level hierarchy (agent/manager/admin/super_admin).

### New settings registered (M2)

`PENALTY_AMOUNT` (2500) · `PENALTY_GRACE` (1wk) · `CREDIT_DECISION_PERIOD_DAYS` (30) · `CREDIT_UNDERFEE_POLICY` (HOLD_AND_NOTIFY) · `EPARGNE_INSCRIPTION_FEE` (pending) · `defaultCurrency` (XAF) · `defaultDueDateOffsetDays`.

### Implementation guardrails

- **Money modules** (M5/M6/M11 + credit): dedicated test suites, business rules as named constants, **cross-compare gate** vs legacy Beta on migrated data before sign-off.
- **Single-source aggregations** (overdue, CA composition) — one query, shared date range.
