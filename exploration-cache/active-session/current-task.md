## Task

Sync cache/changelog after Sprint 7 create-page shopDetails validation update, then commit and push all current changes.

## Current Sprint 7 State

Sprint 7 - PrestiShop & Stock (M9) is underway. The backend stock module is drafted
and mounted at `/api/stock`, with article setup, row-locked on-hand balances,
append-only movements, manual restock/adjust actions, invoice issue-time shop
stock OUT hooks, negative override audit, and cancellation compensation.

Shop-line server persistence is now drafted for both proformas and invoices:
`proforma_shop_details` stores article, supplier/selling price, and passenger
metadata before promotion; invoice `shop_details` is populated from direct invoice
drafts, added lines, and proforma promotion. Client stock UI is drafted with a
`/stock` page, stock API wrapper, manager create/restock/activate controls, and
stock article/passenger fields in both Proforma and Invoice line composers.
The Proforma/Invoice create-page validation schemas now accept `shopDetails` so
those fields survive form validation/submission.

## Last Validation Run (2026-07-15)

- Server typecheck: PASS (`npm run typecheck -w packages/server`)
- Server build: PASS (`npm run build -w packages/server`)
- Migration generation: PASS (`npm run db:generate -w packages/server`, generated `20260715180806_lazy_ultimo`)
- Client build: PASS after elevated rerun for known Vite/esbuild `spawn EPERM` (`npm run build -w packages/client`)
- Client build: PASS after create-page `shopDetails` validation update (`npm run build -w packages/client`, elevated rerun for known Vite/esbuild `spawn EPERM`)

## Immediate Next Technical Check

- Smoke `/api/stock` list/create/update/active/restock/movements with agent vs manager role gates.
- Smoke invoice issue with shop lines carrying `articleId` to verify stock OUT movements are created inside the issue transaction.
- Smoke proforma shop details create/read/promote into invoice shop details.
- Smoke insufficient stock rejection and manager negative override audit behavior.
- Smoke invoice cancellation stock compensation for recorded shop OUT movements.
- Smoke `/stock` page create/restock/active toggle and article list behavior.
- Smoke stock article picker and passenger assignment in Proforma/Invoice line composers.
- Smoke Proforma/Invoice create submit with shop `shopDetails` payloads.

## Note

Sprint 6 is closed. Sprint 7 now has the backend stock foundation, document-side
shop-detail persistence, and a client stock draft in place, but runtime smoke is still pending.
