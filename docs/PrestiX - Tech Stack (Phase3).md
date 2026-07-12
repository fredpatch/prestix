# PrestiX — Tech Stack (Phase 3)

> Methodology Phase 3 · the stack is a **team decision, documented once** so it's not reopened each sprint.
> Context: greenfield rewrite. The reference stack is the starting point; the legacy `tripwise-monorepo` is a **logic oracle only**, not an architectural template.
> Status: validated · 2026-07-11

---

## 1. Definitive stack

| Layer          | Technology                                                | Why (for PrestiX specifically)                                                                                            |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | **React 18 + TypeScript + Tailwind**                      | Typed components; French/English i18n; rich table/chart ecosystem for the dashboard                                       |
| UI kit         | **shadcn/ui** + TanStack Table + Chart.js                 | Data-dense backoffice: tables, KPI cards, forms                                                                           |
| Server         | **Node.js + Express + TypeScript** — **modular monolith** | One language end-to-end; clean `modules/` boundaries; no distributed tax                                                  |
| ORM            | **Drizzle**                                               | Schema-first (the whole point of this planning); readable SQL; schema → shared TS types; no Rust binary (Prisma rejected) |
| Database       | **PostgreSQL**                                            | Financial data is relational + needs ACID (invoices, penalties, ledgers, audit). JSONB for per-type commission `details`  |
| Auth           | **JWT + bcrypt + OTP**                                    | OTP activation + password reset; level-based RBAC (agent/manager/admin/super_admin)                                       |
| Scheduled jobs | **node-cron**                                             | Penalty accrual, proforma-expiry, credit-window auto-conversion, alerts                                                   |
| PDF export     | **Puppeteer**                                             | Invoices/proformas/BL/receipts from HTML/CSS with agency branding                                                         |
| Excel export   | **ExcelJS**                                               | Reporting/analysis exports                                                                                                |
| Email/SMTP     | **Nodemailer** (internal SMTP, else SendGrid)             | OTP, deadline/receivable alerts, credit-window reminders                                                                  |
| Container      | **Docker + Compose**                                      | dev / staging / prod per reference deployment infra                                                                       |

**Shared types:** entities defined in the Drizzle schema import directly into both server and client — single source of truth, zero drift.

---

## 2. Deviations from the reference stack

| Constraint                                 | Decision                                                             |
| ------------------------------------------ | -------------------------------------------------------------------- |
| Search volume (agency-scale)               | **PostgreSQL FTS in V1**; Meilisearch only if volume demands it (V2) |
| Per-type commission data (flexible fields) | **PostgreSQL JSONB** `details` column — no second database           |
| Everything else                            | **No deviation** — reference stack applies as-is                     |

No MongoDB. No second datastore in V1.

---

## 3. What we deliberately reject from the legacy (and why)

The legacy is a **19-service microservices platform (Kafka + MongoDB + gateway + Meilisearch)**. The rewrite keeps its _proven business logic_ and drops its _architecture_:

| Legacy                              | PrestiX                                    | Rationale                                                                                                |
| ----------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Microservices (×19) + gateway       | **Modular monolith**                       | Single-agency load; distributed tax never paid off (stubbed consumers, port conflicts, `stats always 0`) |
| Kafka event bus                     | **In-process calls in one DB transaction** | Kills the fire-and-forget drift class entirely (biggest simplification)                                  |
| MongoDB + Mongoose                  | **PostgreSQL + Drizzle**                   | Known domain now → schema-first; ACID for money; the Mongo "evolving schema" rationale expired           |
| JWT header-forwarding (`x-user-id`) | **Auth context from the request**          | No trust-the-header risk in a monolith                                                                   |
| Meilisearch from day one            | **PG FTS (V1)**                            | Volume doesn't justify it yet                                                                            |
| Per-service Mongo models            | **One schema, shared types**               | Zero client/server drift                                                                                 |

**Legacy stays useful as a logic oracle** — mine invoice numbering, penalty math, ledger-balance flow, document-first workflow, stock-linked-sales (all captured in `legacy-reference/`).

---

## 4. Repo shape (reference monorepo, npm workspaces)

```
prestix-monorepo/
├── packages/
│   ├── shared/types/          ← Drizzle-derived shared types (server + client)
│   ├── server/                ← Express monolith
│   │   └── src/
│   │       ├── db/schema.ts   ← Drizzle schema (all tables)
│   │       ├── modules/       ← auth · settings · party · documents · payments ·
│   │       │                     penalties · discounts · ticketing · shop · stock ·
│   │       │                     commission · savings · reporting
│   │       ├── middleware/    ← authenticate · authorize(level) · errorHandler
│   │       ├── utils/         ← pdf · excel · mailer · otp
│   │       └── jobs/          ← node-cron: penalty · proforma-expiry · credit-window
│   └── client/                ← React 18 + TS + Tailwind
├── docs/                      ← CDC v2 · Phase 1/2/3 · legacy-reference/
├── docker-compose*.yml
└── scripts/                   ← deploy-staging · deploy-prod
```

Each module follows **service → controller → route**; business rules live as **named constants**.

---

## 5. Environments & deployment

Per reference deployment infra: **dev** (local, hot reload, no Nginx) → **staging** (on prod server, isolated network/ports, UAT) → **prod** (Nginx + SSL/Certbot, zero-downtime rolling deploy). Core services only (api · client · postgres · nginx); no optional services in V1 (no OCR/translation/Meili/Redis).

> Nothing reaches prod without passing staging. Staging DB is separate from prod.

---

## 6. Stack decision log (frozen)

- **Monolith over microservices** — single agency, correctness-critical money flows, small team. Extract a service later only if real load demands.
- **PostgreSQL over MongoDB** — relational + ACID + schema-first; Mongo rationale expired once the domain was known.
- **Drizzle over Prisma** — no Rust binary, readable SQL, integrated migrations.
- **PG FTS over Meilisearch (V1)** — volume-driven, deferred.
- **No second datastore** — JSONB covers flexible per-type commission data.

_Phase 3 deliverable · PrestiX · methodology: github.com/fredpatch_
