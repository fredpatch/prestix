## Task

Sync cache/changelog after shared layout header polish, then commit and push all current changes.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Smoke-test shared layout header titles/back links across list, detail, and create pages.
- Smoke-test `/proformas/new`: party selection, referrer selection, ticket line validation, shop line validation, create submit, and navigation to detail.
- Smoke-test `/invoices/new`: direct invoice draft creation and navigation to detail.
- Smoke-test shared ticket fields: one-way, round-trip return date, GDS, PNR, and generated description.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Document creation now uses dedicated Proforma and Invoice create pages instead of dialogs, and routed pages register their title/back/badge through the shared layout header. Proforma creation has a guided React Hook Form/Zod UI with labeled ticket fields, a live completion summary, totals panel, animated line transitions, and extended ticket references for return dates/GDS. Client build pass is pending for this header polish batch; runtime create-flow/header smoke is still pending.
