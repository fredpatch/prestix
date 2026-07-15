## Where We Left Off

Sprint 6 is closed. Sprint 7 - PrestiShop & Stock (M9) is now underway.

## What's In Scope Today

Cache/changelog sync after the Sprint 7 stock client/PDF shop-line update, then commit and push.

## State Of The Codebase

Backend has working Express routes for bootstrap, auth, users, settings, Party,
Party History, Credit/Avoir, Proformas, Invoices, Delivery Notes, Payments,
Creances, and Stock. The server uses JWT cookie auth, RBAC middleware, default
settings seed, job registration, generated document migrations, optional document
referent linkage, and audit logging.

Client includes bootstrap-status route gating, bootstrap initialization, upgraded
login/set-password UX, settings/users management, Party screens, document
list/detail/create/promote/issue/cancel/BL flows, dedicated `/proformas/new` and
`/invoices/new` creation pages, invoice-detail payment issue/record/reschedule
flows, penalty-aware payment allocation controls, the `/creances` page, and the
draft `/stock` page.
Routed pages set their top-bar title/back/badge through the shared page-header
context. Stock client UI is drafted but not runtime-smoked yet.

Document PDFs exist for invoices, proformas, and delivery notes, with return
dates and invoice payment schedules in the shared print template.

Sprint 7 stock backend is drafted: `/api/stock` exposes article/movement reads,
manager article setup/restock actions, append-only stock movements, row-locked
stock balances, issue-time shop stock OUT hooks, negative override audit, and
invoice cancellation compensation.

Document-side shop details are drafted for Sprint 7: proforma shop lines persist
article, supplier/selling price, and passenger metadata in `proforma_shop_details`;
direct invoice drafts/add-line flows persist invoice `shop_details`; proforma
promotion carries shop details into invoice lines.

Stock client draft is in place: `/stock` route/nav, stock API wrapper, article
list/inactive toggle, manager create/restock/activate controls, and stock
article/passenger fields in Proforma and Invoice line composers. Document PDFs
now print shop lines as PrestiShop rows and use assigned shop passengers when set.

## Validation Snapshot (2026-07-15)

- `npm run typecheck -w packages/server`: PASS after stock backend draft.
- `npm run build -w packages/server`: PASS after stock backend draft.
- `npm run db:generate -w packages/server`: PASS, generated `20260715180806_lazy_ultimo`.
- `npm run typecheck -w packages/server`: PASS after shop-detail persistence update.
- `npm run build -w packages/server`: PASS after shop-detail persistence update.
- `npm run build -w packages/client`: PASS after elevated rerun for the known Vite/esbuild `spawn EPERM`; existing chunk-size warning remains.
- Runtime stock API smoke is pending.
- Shop-detail create/read/promote smoke is pending.
- Invoice issue/cancel stock movement smoke is pending.
- PDF visual smoke, penalty/creance runtime smoke, and legacy Beta cross-compare are still pending.

## Key Constraints Active Right Now

- npm workspaces, run scripts from within each package.
- Windows dev environment.
- Health check is `/api/health`, not `/health`.
- Migration dry-run is blocked until Beta production data access is available.
