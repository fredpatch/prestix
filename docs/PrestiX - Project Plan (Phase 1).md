# PrestiX — Project Plan (Phase 1)

> Project: **PrestiX** — Digitalisation du système de gestion, agence _Le Prestigieux_
> Client: Le Prestigieux · Vendor: ALPHA SOFTWARE DEVELOPMENT (Carmel Fred Patchelli)
> Document type: **Decision document** (Phase 1 of the planning methodology) — not a development spec
> Basis: Cahier des charges v2 + Feedback1 + Meetings 3/4 + legacy `tripwise-monorepo` audit
> Status: **DRAFT for sponsor validation** · Version 0.1 · 2026-07-11
> Language note: document body English (internal); domain/UI terms kept in French (Proforma, Facture, BL, Échéancier, Commission Divers, Épargne Voyage, apporteur…) as they are the product's real vocabulary.

---

## 0. Framing — Greenfield rewrite with legacy as logic oracle

PrestiX already runs a **Beta in production** on a legacy platform (`tripwise-monorepo`: 19-service microservices architecture, Kafka event bus, MongoDB/Mongoose, Meilisearch). The Beta validated the **business domain** but carried heavy accidental complexity — the legacy's own exploration-cache documents stubbed Kafka consumers, `party stats always 0`, port conflicts, and several Meeting-3 services existing only as UI stubs with no backend.

**Decision (this phase):** rebuild greenfield on the reference stack — **modular monolith + PostgreSQL/Drizzle** — keeping the legacy repo strictly as a **logic oracle**: mine its proven invoice-numbering, penalty math, ledger-balance flow, and document-first workflow; discard the distributed plumbing. The prod Beta keeps running until cutover.

---

## 1. Context & Justification

_Le Prestigieux_ is a travel/service agency currently operating (pre-PrestiX) on disconnected Excel files for invoicing, receivables, monthly statistics, financial reporting, and stock. The PrestiX Beta already replaced part of this; this project rebuilds it on a clean, durable foundation and extends it per the latest client feedback.

### Problems addressed

| Problem                                                                  | Impact                             | Level  |
| ------------------------------------------------------------------------ | ---------------------------------- | ------ |
| Double/triple data entry across files                                    | Time loss                          | High   |
| File proliferation, no single source of truth                            | Error risk                         | High   |
| Manual calculation errors (créances, pénalités)                          | Financial risk                     | High   |
| No real-time global visibility                                           | Blind management                   | High   |
| Excessive agent workload                                                 | Efficiency drop                    | Medium |
| Legacy Beta: distributed complexity, stubbed logic, schema drift (Mongo) | Maintenance cost, correctness risk | High   |

### Proposed solution

A centralized, automated backoffice (**PrestiX**, boutique module **PrestiShop**) built as a modular monolith, with financial data in PostgreSQL under ACID guarantees. Reliable operations, automated calculations, live activity visibility, fewer human errors, higher agent productivity. The objective is operational and strategic, not merely technical: PrestiX becomes a **piloting tool**, not a data-entry tool.

---

## 2. Objectives

**General objective:** deliver a reliable, centralized, evolutive system that replaces fragmented manual management and automates the agency's full commercial and financial workflow.

**Specific objectives** (cross-referenced to source):

| ID  | Objective                                                                                | Source                  |
| --- | ---------------------------------------------------------------------------------------- | ----------------------- |
| O1  | Centralize clients, referrers, and commercial history (single source of truth)           | CDC v2 §2, Legacy Party |
| O2  | Automate the Proforma → Facture → BL document lifecycle                                  | CDC v2 §1               |
| O3  | Automate échéancier, receivables, and parallel-accumulating penalties                    | CDC v2 §3/§4, Meeting 4 |
| O4  | Unify all commission services into one **Commission Divers** module                      | Meeting 4, Feedback1    |
| O5  | Track **Épargne Voyage** with correct CA treatment (fees in CA, transactions out)        | Meeting 4               |
| O6  | Provide a KPI dashboard with CA composition and date filtering                           | Meeting 4 §6            |
| O7  | Produce professional printed/exported documents (PDF/Excel)                              | CDC v2 Livrables        |
| O8  | Rebuild on a maintainable stack (monolith + PostgreSQL) without logic regression vs Beta | This phase              |

---

## 3. Scope — Modular view

Priority: **HIGH** = required for V1 acceptance · **MEDIUM** = V1 if capacity allows, else V2.
Order = dependency order (drives feasibility & sprint order).

| #   | Module                                                                                | Priority                     | Origin                                              |
| --- | ------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------- |
| M1  | Auth & Admin (accounts, roles, OTP, audit log)                                        | HIGH                         | Foundation / Legacy auth+audit                      |
| M2  | Settings & Catalog (service-type registry, reference data)                            | HIGH                         | Foundation / Legacy catalog                         |
| M3  | Party (clients/acheteurs, apporteurs/référents, crédit)                               | HIGH                         | CDC v2 §2, §6 / Legacy party                        |
| M4  | Document Engine (Proforma→Facture→BL, numérotation, expiry 48h)                       | HIGH                         | CDC v2 §1 / Legacy invoice                          |
| M5  | Paiements & Échéancier (max 3 échéances, statuts auto)                                | HIGH                         | CDC v2 §3 / Legacy payment                          |
| M6  | Créances & Pénalités (accumulation parallèle, +2500, no waiver)                       | HIGH                         | CDC v2 §4, Meeting 4                                |
| M7  | Remises (ligne / facture)                                                             | HIGH                         | CDC v2 §5 — _mechanics open_                        |
| M8  | Billetterie (bnss/eco/prem/premium)                                                   | HIGH                         | CDC v2 §1 / Legacy ticketing — _prem conflict open_ |
| M9  | PrestiShop + Stock (article↔passager, POS)                                            | HIGH (shop) / MEDIUM (stock) | CDC v2 §1, §8 / Legacy shop+stock                   |
| M10 | Commission Divers (MM, Transfert, Visa, Location, Hébergement, Assurance; +Canal+ V2) | HIGH                         | Meeting 3/4 / Legacy assurance+mobile-money+stubs   |
| M11 | Épargne Voyage (inscription→CA, transactions→solde)                                   | HIGH                         | Meeting 4 / Legacy travel-savings                   |
| M12 | Dashboard & KPI / Reporting (CA composition, filtres date)                            | HIGH                         | Meeting 4 §6 / Legacy reporting+analytics           |
| X1  | Notification (OTP, alertes email) — cross-cutting                                     | HIGH                         | Legacy notification                                 |
| X2  | Search (Meilisearch) — cross-cutting                                                  | V2                           | Legacy search — deferred per stack rule             |

---

## 4. Technical constraints

- **Hosting:** on-prem / VPS Ubuntu, Docker Compose (dev/staging/prod), per reference deployment infra.
- **Currency & locale:** XAF, French UI, French printed documents.
- **Outputs:** PDF export (Puppeteer, client branding), Excel export (ExcelJS).
- **Email:** internal SMTP (OTP account activation, deadline/receivable alerts) via Nodemailer.
- **Security:** JWT + bcrypt + OTP; role-based access; soft-delete on all business data (never hard delete); audit log.
- **Continuity:** prod Beta must keep running during the rewrite — new system built in parallel, migrated and cut over on sign-off.
- **Data migration:** existing prod data lives in MongoDB → must be mapped and migrated to PostgreSQL with reconciliation.
- **Accessibility:** desktop-first backoffice; responsive acceptable, mobile app is V2+.

---

## 5. Project team & Roles

> ⚠️ Team composition to confirm with sponsor — placeholder below.

| Name                                | Function                | Role in project                                | Availability note                                                     |
| ----------------------------------- | ----------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| Carmel Fred Patchelli               | Software Engineer (ASD) | Lead dev, architecture, backend + frontend     | Also handles prod Beta support — load estimates must account for this |
| _[À CONFIRMER]_                     | _(second dev, if any)_  | Frontend / testing support                     | —                                                                     |
| Le Prestigieux — _[gérant]_         | Client sponsor          | Validation, UAT sign-off, business arbitration | Part-time                                                             |
| Le Prestigieux — _[agent référent]_ | Key user                | Acceptance testing, training relay             | Part-time                                                             |

---

## 6. Approach & Strategy

**Iterative, phased, dependency-driven.** No code before Phases 0–3 are documented and validated.

**Greenfield rewrite with legacy oracle** — the defining strategy of this project:

1. Build each module fresh on the reference stack (clean `modules/` boundaries, service→controller→route).
2. Before a module is marked "done," its business logic is **cross-compared against the legacy implementation** — keep what's proven (numbering, penalty math, ledger flow), fix what the legacy left weak or stubbed.
3. Legacy distributed plumbing (Kafka, gateway, per-service Mongo) is **not** carried over.
4. Prod Beta runs in parallel; migration + cutover is a dedicated late sprint.

**Why phased:** modules have hard dependencies (a Facture form needs the Party structure; the Dashboard needs every revenue/commission source). Building in dependency order prevents designing forms against unknown structures.

---

## 7. Provisional schedule

> Indicative — hours are estimates to be refined in Phase 4. Assumes ~1 primary dev with partial availability.

| Step         | Activities                                                                                   | Est. duration | Owner         |
| ------------ | -------------------------------------------------------------------------------------------- | ------------- | ------------- |
| Phase 0 init | Kick-off, CDC v2 validation, env setup, DB modeling, pre-flight (PDF/print, migration spike) | 1 week        | Lead          |
| Sprint 1     | M1 Auth & Admin + M2 Settings/Catalog                                                        | 2 weeks       | Lead          |
| Sprint 2     | M3 Party                                                                                     | 1.5 weeks     | Lead          |
| Sprint 3     | M4 Document Engine (Proforma→Facture→BL)                                                     | 2 weeks       | Lead          |
| Sprint 4     | M5 Paiements & Échéancier + M6 Créances & Pénalités                                          | 2 weeks       | Lead          |
| Sprint 5     | M7 Remises + M8 Billetterie                                                                  | 1.5 weeks     | Lead          |
| Sprint 6     | M9 PrestiShop + Stock                                                                        | 1.5 weeks     | Lead          |
| Sprint 7     | M10 Commission Divers                                                                        | 2 weeks       | Lead          |
| Sprint 8     | M11 Épargne Voyage                                                                           | 1 week        | Lead          |
| Sprint 9     | M12 Dashboard & KPI / Reporting                                                              | 2 weeks       | Lead          |
| Sprint 10    | Data migration (Mongo→PG) + reconciliation                                                   | 1.5 weeks     | Lead          |
| Sprint 11    | Testing + UAT (dedicated, +20% correction buffer)                                            | 2 weeks       | Lead + client |
| Sprint 12    | Deployment + training + cutover                                                              | 1 week        | Lead + client |

**Total indicative workload:** ~21 weeks calendar · **≈ 520–620 h** dev (to be firmed in Phase 4).

---

## 8. Features & Deliverables — V1 vs V2

| Feature                                      | V1        | V2                        |
| -------------------------------------------- | --------- | ------------------------- |
| Auth, roles, OTP, audit log                  | ✔         |                           |
| Party (clients, apporteurs, crédit)          | ✔         |                           |
| Proforma→Facture→BL + 48h expiry             | ✔         |                           |
| Échéancier (max 3) + auto statuses           | ✔         |                           |
| Pénalités parallel accumulation, no waiver   | ✔         |                           |
| Remises (ligne + facture) — basic            | ✔         | Advanced discount rules ➤ |
| Billetterie bnss/eco/prem/premium            | ✔         |                           |
| PrestiShop (article↔passager)                | ✔         |                           |
| Stock (POS-linked)                           | ✔ (basic) | Full POS/Papeterie ➤      |
| Commission Divers (6 current types)          | ✔         |                           |
| Canal+ commission type                       |           | ➤                         |
| Papeterie service (photocopie, impression…)  |           | ➤                         |
| Épargne Voyage (inscription + transactions)  | ✔         |                           |
| Dashboard KPI + CA composition + date filter | ✔         |                           |
| Meilisearch full-text search                 |           | ➤                         |
| Multi-agence                                 |           | ➤                         |
| Mobile app / advanced CRM                    |           | ➤                         |
| PDF / Excel export                           | ✔         |                           |

---

## 9. User management & Roles

> **Updated per Phase 2 / M1 feasibility** — supersedes the earlier 4-profile matrix. Model is a **level-based hierarchy** where a higher level inherits every lower-level capability (`user.level >= requiredLevel`).

**Levels:** `agent = 1 · manager = 2 · admin = 3 · super_admin = 4`.

| Level               | Who                                   | Capability (inherits all below)                                                                                                                                                  |
| ------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **super_admin (4)** | Owner                                 | All admin powers **+** sole holder of irreversible/system actions: mutate financial constants & business defaults, assign admin+, data export/purge. Non-deletable; ≥1 enforced. |
| **admin (3)**       | Delegated admin                       | All operational actions **+** manage manager/agent accounts. Cannot touch financial rules or super_admin.                                                                        |
| **manager (2)**     | Daily operator (gérant)               | Full operational: party, documents, payments, commissions, épargne, discounts, withdrawals, reschedule, cancel.                                                                  |
| **agent (1)**       | Employee (future — attendance module) | Create/edit records; **cannot** apply discounts, withdraw épargne, or override negative stock (needs manager+).                                                                  |

**At launch:** only super_admin (owner) + manager active; agent provisioned but dormant until the attendance module (V2). "Comptable" profile dropped (not in the owner's role list).

**Privileged actions (manager+ / audited):** discounts (M7), épargne withdrawal & épargne-as-payment (M11), negative-stock override at issue (M9), échéance reschedule & invoice cancellation (admin+, M4/M5). **Penalty waiver removed entirely** — no level can waive a triggered penalty (M6).

---

## 10. Risk analysis

| Risk                                                                 | Probability | Impact | Mitigation                                                                                    |
| -------------------------------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------------------- |
| Logic regression vs legacy Beta                                      | Medium      | High   | Per-module cross-compare gate against legacy oracle before "done"                             |
| Financial calc errors (parallel penalties, CA composition)           | Medium      | High   | Business rules as **named constants** + dedicated test suite; validate against legacy outputs |
| Mongo→PostgreSQL migration data loss/mismatch                        | Medium      | High   | Dedicated migration sprint, mapping scripts, reconciliation report, dry-run on staging        |
| Scope creep (Canal+, Papeterie, advanced discounts)                  | High        | Medium | V1/V2 split enforced from day one; out-of-sprint requests → backlog only                      |
| Open decisions block implementation (prem abbrev., remise mechanics) | Medium      | Medium | Resolve in Phase 2 feasibility **before** M7/M8 sprints                                       |
| Single-dev availability (also runs prod support)                     | High        | Medium | Partial-availability buffer in schedule; phased load                                          |
| Cutover failure (legacy + new parallel run)                          | Low         | High   | Staging UAT sign-off gate; staged migration; rollback plan                                    |

---

## 11. Deliverables & Acceptance criteria

**Deliverable documents:** this Project Plan (Phase 1), Feasibility Study (Phase 2), documented tech stack (Phase 3), Dev Plan + TASKS.md + Notion (Phase 4), DB schema, deployment runbook, training material.

**Product deliverables:** functional web app (PrestiX + PrestiShop), secured PostgreSQL DB, all V1 modules operational, PDF/Excel export, initial support.

**Acceptance criteria (testable):**

- A proforma expires exactly 48h after creation and blocks invoice creation once expired.
- An invoice supports up to 3 échéances; final due date = last échéance date.
- Two overdue échéances produce two independent, simultaneously-accumulating +2500 XAF penalties; neither can be waived.
- Commission transactions count in CA/gain without generating a Proforma/Facture/BL.
- Épargne: inscription fee appears in CA; deposit/withdrawal transactions do **not**.
- A shop article on an invoice displays its **designated passenger**, not the buyer.
- Dashboard CA Global breaks down by composition (Billetterie/Commission/…); date filter (presets + custom range) works.
- Applied discount appears on the printed invoice.

---

## 12. Technical architecture

**Stack:** React 18 + TypeScript + Tailwind (client) · Node.js + Express + TypeScript (server, modular monolith) · Drizzle ORM · PostgreSQL · JWT+bcrypt+OTP · node-cron (penalty/alert jobs) · Puppeteer (PDF) · ExcelJS · Nodemailer · Docker Compose. Shared types from the Drizzle schema imported by both client and server (single source of truth).

**Component map (monolith modules):** `modules/{auth, settings, party, documents, payments, penalties, discounts, ticketing, shop, stock, commission, savings, reporting}` + `middleware/{authenticate, authorize, errorHandler}` + `utils/{pdf, excel, mailer, otp}` + `jobs/` (cron).

**Core DB entities (high-level):** User, Role, AuditLog, ServiceType/CatalogItem, Party (Client, Referrer), Proforma, Invoice, DeliveryNote, InvoiceLine, Payment, Installment (Échéance), Penalty, Discount, Ticket, ShopArticle, StockItem, StockMovement, CommissionTransaction (typed), SavingsAccount, SavingsTransaction, Counter (numbering).

**Non-negotiable core business rules** (implemented as named constants, not comments):

1. `PROFORMA_VALIDITY_HOURS = 48` → auto-status _Expirée_, no auto-cancel; invoice creation blocked from expired proforma.
2. Only **Billetterie** and **PrestiShop** enter the Proforma→Facture→BL workflow; all commissions are autonomous.
3. `MAX_INSTALLMENTS = 3`; final invoice due date = last échéance date.
4. `PENALTY_AMOUNT_XAF = 2500`, starts 1 week after a missed échéance, accumulates **in parallel and independently per échéance**, until that échéance is fully settled. **No manual waiver.**
5. All commissions count in **CA and gain** without a commercial document.
6. Épargne: inscription fee → CA; savings transactions → client balance only, **never** CA.
7. Shop article is linked to a **designated passenger**, distinct from the invoice buyer (customer).
8. Applied discounts must appear on the invoice; line-level discount on tickets.
9. **Soft-delete only** on business data — never hard delete.

---

## 13. Scalability

| V2+ feature                        | Prerequisite                                               |
| ---------------------------------- | ---------------------------------------------------------- |
| Canal+ commission type             | M10 Commission Divers typed registry in place              |
| Papeterie service (POS/stock)      | M9 Stock module matured to full POS/ledger                 |
| Advanced discount rules (%/global) | M7 remise mechanics decided (feasibility)                  |
| Meilisearch full-text search       | Search volume exceeds PostgreSQL FTS; add `search` service |
| Multi-agence                       | Tenant scoping in schema (party, documents, reporting)     |
| Mobile app / advanced CRM          | Stable API surface from V1                                 |

> The monolith keeps clean module boundaries so any single module (e.g. `reporting`, `search`) can be extracted into its own service later — only if real load demands it.

---

## Open points carried to Phase 2 (Feasibility)

1. **`prem` abbreviation collision** — Première/First already ships as `prem`; new Premium class needs a distinct abbreviation (proposal: `prm`, or full word on print). Client sign-off required before M8.
2. **Remise mechanics** — fixed amount vs %, line-level vs invoice-global. To decide before M7.
3. **Team composition & availability** — confirm with sponsor (affects §5, §7).
4. **RBAC** — resolved in Phase 2/M1 (4-level hierarchy, §9 updated); final client sign-off on level names still welcome.

---

_Phase 1 deliverable · PrestiX greenfield rewrite · methodology: github.com/fredpatch_
