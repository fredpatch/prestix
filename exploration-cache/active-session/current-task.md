## Task

Update exploration-cache session/context/tasks/quick-ref/manifest, root
`changelog.md`, and root `TASKS.md` after the Sprint 11f UI/reporting polish
session, then commit and push all documentation changes.

## Current Project State

Sprint 11c is closed. Sprint 11e Journal d'audit is closed in code. Sprint
11f UI/reporting polish is also closed in code:

1. Admin UI polish pass: Party/User pages and details, Login, Commission
   request queue, Commissions, Creances, Stock, Dashboard, Settings, and
   mobile ergonomics.
2. Proforma/Invoice document pass: list KPIs/filters/grid/quick views and
   split detail workspaces with shared document components.
3. Dashboard export pass: PDF charts and recent sales now match the upgraded
   dashboard; Excel exports carry graph data through safe static visual
   columns after Excel rejected conditional-formatting data bars.

## Not Yet Done

- Manual runtime smoke of the Sprint 11c/11e/11f UI flows.
- Full reporting/analyse API-runtime smoke end-to-end.
- Validate freshly generated PDF and Excel reports in a real browser/Excel
  session after the latest export repair.
- Sprint 9 credit-conversion fee-pair deep check remains flagged.
- Auto-converted epargne deposits still need a visible converted/source label.

## Validation Snapshot (2026-07-21)

- `npm run typecheck`: PASS.
- `npm run build -w packages/server`: PASS.
- `npm run build -w packages/client`: PASS during document UI passes after
  elevated rerun for known Vite/esbuild Windows `spawn EPERM`.

## Next Up

Sprint 11d Notifications remains the next unscoped product/UX priority.
