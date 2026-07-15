1. Smoke `/api/proformas/:id/pdf`, `/api/invoices/:id/pdf`, and `/api/delivery-notes/invoice/:invoiceId/pdf`
2. Verify `DOCUMENT_PRINTED` audit rows for invoice, proforma, and delivery-note PDF exports
3. Smoke Proforma detail PDF action and Invoice detail BL PDF link
4. Smoke shared layout header titles, badges, and back links across list/detail/create pages
5. Smoke `/creances` and `/api/creances` aggregation with and without the overdue filter
6. Run legacy Beta cross-compare once sample data access is available
7. Keep migration/backfill decisions open: company parties, credit window, epargne backfill
