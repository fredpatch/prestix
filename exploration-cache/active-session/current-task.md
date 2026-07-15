## Task

Sync cache/changelog after document PDF print refinement, then commit and push all current changes.

## Remaining Sprint 0 items (unordered, awaiting priority call)

- None. Sprint 0 is closed.

## Immediate next technical check (after cache sync)

- Smoke-test the generated PDF files after payment schedule/return-date/template spacing refinements.
- Smoke-test `/api/proformas/:id/pdf`, `/api/invoices/:id/pdf`, and `/api/delivery-notes/invoice/:invoiceId/pdf`.
- Verify multi-installment invoice PDFs show the payment schedule.
- Verify round-trip ticket rows show return dates in invoice/proforma/BL PDFs.
- Verify `DOCUMENT_PRINTED` audit rows for invoice, proforma, and BL exports.
- Smoke-test Proforma detail PDF action and Invoice detail BL PDF link.
- Keep migration mapping notes ready for Sprint 11 once Beta access is granted.

## Last validation run (2026-07-15)

- Server typecheck: PASS (`npm run typecheck -w packages/server`)
- Server build: PASS (`npm run build -w packages/server`)
- Client build: PASS after elevated rerun for known Vite/esbuild `spawn EPERM` (`npm run build -w packages/client`)

## Note

Document PDF export now covers invoices, proformas, and delivery notes using the shared print template. The print template now includes ticket return dates, multi-installment invoice schedules, denser table/spacing styles, and print audit logging. Server/client validation passes for this refinement batch; runtime PDF visual smoke is still pending.
