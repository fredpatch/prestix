## Task

Sync cache/changelog after Sprint 7 stock backend draft, then commit and push all current changes.

## Current Sprint 7 State

Sprint 7 - PrestiShop & Stock (M9) is underway. The backend stock module is drafted
and mounted at `/api/stock`, with article setup, row-locked on-hand balances,
append-only movements, manual restock/adjust actions, invoice issue-time shop
stock OUT hooks, negative override audit, and cancellation compensation.

Shop-line client/passenger association is still carried forward for the client/UI
layer. The schema already has `shopDetails.passengerName`; capture UI and article
picker are not built yet.

## Last Validation Run (2026-07-15)

- Server typecheck: PASS (`npm run typecheck -w packages/server`)
- Server build: PASS (`npm run build -w packages/server`)

## Immediate Next Technical Check

- Smoke `/api/stock` list/create/update/active/restock/movements with agent vs manager role gates.
- Smoke invoice issue with shop lines carrying `articleId` to verify stock OUT movements are created inside the issue transaction.
- Smoke insufficient stock rejection and manager negative override audit behavior.
- Smoke invoice cancellation stock compensation for recorded shop OUT movements.
- Plan/build client stock article picker and shop-line passenger/article capture.

## Note

Sprint 6 is closed. Sprint 7 now has the backend stock foundation in place, but
runtime API smoke and client UI wiring are still pending.
