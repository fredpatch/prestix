# Changelog

## Sprint 0

- Monorepo scaffold created (npm workspaces, packages/shared/types, packages/server, packages/client)
- Deployment infra added (docker-compose dev/staging/prod, nginx, deploy scripts)
- Sprint 1 backend foundation committed (bootstrap/auth/users/settings + JWT cookie auth + RBAC)
- Documentation and exploration cache synchronized with repository state

## Sprint 2 (2026-07-13)

- Added Party backend draft: list/search/filter, create/update, manager+ activation toggle, audit logging, and `/api/parties` route mount.
- Added Credit/Avoir backend draft: derived balance, dated lots, FIFO spend service, manager+ refund action, expired-unconverted lot query, and `/api/credit` route mount.
- Added Party History backend scaffold: agent+ `/api/parties/:id/history` route with separate commercial and épargne pagination contracts, ready to fill from M4 invoices and M11 savings.
- Added Party client draft: nav/routes, Parties list with search/role filter, create + quick-add dialogs, Party detail page with credit balance/lots and history placeholder tabs.
- Added Party edit dialog on the Party detail page, wired to the existing party update API.
- Added `requireManager` RBAC helper for Sprint 2 money/activation actions.
- Validation: server typecheck and client build pass; API/client smoke still pending for Party/Credit/History flows.

## Sprint 3 (2026-07-13)

- Added document-engine backend draft: proforma, invoice, delivery-note controllers/routes/services and API mounts.
- Added `proforma_lines` schema and document line snapshots for proforma/invoice flows.
- Added row-locked counter allocation for continuous `PRO-` and `INV-` numbers.
- Added invoice draft creation, line add/remove, proforma promotion, issue with `requestId` idempotency, admin cancellation with audit, and BL scaffold.
- Added proforma 48h expiry cron registration in the server job registry.
- Validation: server typecheck/build and client build pass; API smoke still pending for document routes.

## Sprint 3 (2026-07-14)

- Added document client API wrappers for proformas, invoices, and delivery notes.
- Added Proformas and Invoices navigation/routes plus list pages.
- Added proforma creation/detail/promote flow with shared party search and line-item builder.
- Added direct invoice draft creation/detail flow with draft line add/remove, issue action, cancellation dialog, and BL generation/display.
- Added `proforma_lines` migration folder (`20260714090648_damp_ravenous`).
- Added optional document référent support in proforma/invoice create/detail screens, with filtered référent search and `referrer_party_id` migration (`20260714132909_cooing_mathemanic`).
- Validation: server typecheck/build and client build pass after référent changes; migration application and API/client smoke still pending.

## Sprint 4 (2026-07-14)

- Added payment backend draft: payment service/controller/routes mounted at `/api/payments`.
- Added invoice `paymentStatus` tracking and payment-plan creation during invoice issue.
- Added installment creation for full-payment or <=3-installment plans, with total-sum validation.
- Added FIFO payment allocation with optional target installment override, per-installment status updates, and invoice-level payment status recompute.
- Added overpayment handling with required change-vs-credit choice and credit-lot creation for credit overpayments.
- Added admin+ installment reschedule flow with forward-only guard, reason/audit, and invoice final due-date adjustment.
- Updated invoice cancellation to compute already-paid amounts from payment rows and move paid money to credit.
- Added payment client draft on invoice detail: issue payment-plan dialog, payment plan card, record-payment dialog, and admin reschedule dialog.
- Added `payment_status` migration folder (`20260714174707_motionless_toad_men`).
- Validation: server typecheck/build and client build pass; payment migration/API/client smoke still pending.

## Sprint 5 (2026-07-14)

- Added penalties backend draft: weekly overdue penalty accrual service, settings-backed penalty amount/grace defaults, and daily cron registration.
- Added creances backend draft at `/api/creances` with principal/penalty due aggregation and optional overdue filtering.
- Wired invoice cancellation to void active penalties with audit logging.
- Extended payment recording with principal-vs-penalty allocation support and exposed penalty accrued/paid/due totals on installment views.
- Validation: server typecheck/build pass; dedicated penalty tests, client creances UI, penalty/creance API smoke, and legacy Beta cross-compare still pending.

## Validation Notes (2026-07-12)

- `npm run typecheck -w packages/server`: FAIL (TS5103, invalid `ignoreDeprecations`)
- `npm run db:seed` in `packages/server`: FAIL (exit 1)
- `docker compose up -d postgres api`: blocked (Docker daemon unavailable)
- `npm run format` from repo root: PASS
