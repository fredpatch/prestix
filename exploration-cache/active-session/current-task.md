## Task

Sync cache/changelog after Sprint 7 shop-detail persistence update, then commit and push all current changes.

## Current Sprint 7 State

Sprint 7 - PrestiShop & Stock (M9) is underway. The backend stock module is drafted
and mounted at `/api/stock`, with article setup, row-locked on-hand balances,
append-only movements, manual restock/adjust actions, invoice issue-time shop
stock OUT hooks, negative override audit, and cancellation compensation.

Shop-line server persistence is now drafted for both proformas and invoices:
`proforma_shop_details` stores article, supplier/selling price, and passenger
metadata before promotion; invoice `shop_details` is populated from direct invoice
drafts, added lines, and proforma promotion. Client article/passenger capture UI
and runtime smoke are still pending.

## Last Validation Run (2026-07-15)

- Server typecheck: PASS (`npm run typecheck -w packages/server`)
- Server build: PASS (`npm run build -w packages/server`)
- Migration generation: PASS (`npm run db:generate -w packages/server`, generated `20260715180806_lazy_ultimo`)

## Immediate Next Technical Check

- Smoke `/api/stock` list/create/update/active/restock/movements with agent vs manager role gates.
- Smoke invoice issue with shop lines carrying `articleId` to verify stock OUT movements are created inside the issue transaction.
- Smoke proforma shop details create/read/promote into invoice shop details.
- Smoke insufficient stock rejection and manager negative override audit behavior.
- Smoke invoice cancellation stock compensation for recorded shop OUT movements.
- Plan/build client stock article picker and shop-line passenger/article capture.

## Note

Sprint 6 is closed. Sprint 7 now has the backend stock foundation and document-side
shop-detail persistence in place, but runtime API smoke and client UI wiring are still pending.
