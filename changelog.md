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
- Added creances client draft: `/creances` route/nav entry, creance API wrapper, overdue toggle, principal/penalty totals, and invoice links.
- Added penalty-aware invoice payment UI: installment penalty due display and principal-vs-penalty allocation choice with warning.
- Added penalty accrual unit coverage: extracted accrual-count calculation into a pure helper and covered grace boundary, weekly cadence, no-cap accumulation, longer grace, and midnight normalization with Vitest.
- Fixed payment record controller forwarding for `allocationTarget` so principal-vs-penalty allocation reaches the service.
- Validation: root typecheck, server build, and client build pass; `npm test` passes (8 penalty tests) after elevated rerun for Windows `spawn EPERM`; penalty/creance API/client smoke and legacy Beta cross-compare still pending.

## Document UI Hardening (2026-07-15)

- Replaced proforma and direct-invoice creation dialogs with dedicated `/proformas/new` and `/invoices/new` pages.
- Added a guided Proforma creation flow with React Hook Form/Zod validation, labeled ticket fields, completion summary, totals panel, and Framer Motion line transitions.
- Added a Proforma line composer with shadcn labels/inputs/selects, ticket-vs-shop line cards, collapse/remove controls, and clearer required-field feedback.
- Extended ticket detail shape for return dates and GDS references across client and server proforma types.
- Updated Proformas/Invoices list actions to link into the new creation pages.
- Added shared layout page-header state so routed pages can set the top-bar title, back target, and badge from one place.
- Moved list/detail/create page titles and back links into the shared layout header across Parties, Proformas, Invoices, Créances, Users, Settings, and document detail/create views.
- Simplified document line composers by removing duplicate generated-description panels now that ticket details are explicitly labeled.
- Validation: client build passes after elevated rerun for the known Vite/esbuild `spawn EPERM`; existing Vite chunk-size warning remains.

## Document PDF Export (2026-07-15)

- Added Proforma PDF export endpoint at `/api/proformas/:id/pdf`, reusing the shared invoice print template with the 48h validity note.
- Added Delivery Note PDF export endpoint at `/api/delivery-notes/invoice/:invoiceId/pdf`, reusing invoice line/party data without payment recap.
- Added `DOCUMENT_PRINTED` audit logging for invoice, proforma, and delivery-note PDF generation.
- Added client PDF actions on Proforma detail and generated delivery-note display on Invoice detail.
- Validation: server typecheck/build and client build pass; client build required elevated rerun for the known Vite/esbuild `spawn EPERM`, and the existing Vite chunk-size warning remains.

## Validation Notes (2026-07-12)

- `npm run typecheck -w packages/server`: FAIL (TS5103, invalid `ignoreDeprecations`)
- `npm run db:seed` in `packages/server`: FAIL (exit 1)
- `docker compose up -d postgres api`: blocked (Docker daemon unavailable)
- `npm run format` from repo root: PASS
