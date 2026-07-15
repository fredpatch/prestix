## Task

Sync cache/changelog after document PDF export work, then commit and push all current changes.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Smoke-test the generated PDF files after server typecheck/build and client build passed for proforma/BL PDF routes and client PDF links.
- Smoke-test `/api/proformas/:id/pdf`, `/api/invoices/:id/pdf`, and `/api/delivery-notes/invoice/:invoiceId/pdf`.
- Verify `DOCUMENT_PRINTED` audit rows for invoice, proforma, and BL exports.
- Smoke-test Proforma detail PDF action and Invoice detail BL PDF link.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-12)

- PDF preflight: PASS (`docker compose exec api npm run preflight:pdf`, exit 0)
- Server dev run: STOPPED (`npm run dev` interrupted, exit 130)
- Client deps install: PASS (`npm i` in `packages/client`, exit 0)
- Sprint 0 infra/schema/preflight checks: CLOSED

## Note

Document PDF export now covers invoices, proformas, and delivery notes using the shared print template. Invoice/proforma/BL print actions log `DOCUMENT_PRINTED`; proforma PDFs include the 48h validity note; invoice detail links to generated BL PDFs and proforma detail links to its PDF. Server typecheck/build and client build pass; runtime PDF smoke is still pending.
