1. Smoke `/api/proformas/:id/pdf`, `/api/invoices/:id/pdf`, and `/api/delivery-notes/invoice/:invoiceId/pdf`
2. Verify multi-installment invoice PDFs show the payment schedule
3. Verify round-trip ticket rows show return dates in invoice/proforma/BL PDFs
4. Verify `DOCUMENT_PRINTED` audit rows for invoice, proforma, and delivery-note PDF exports
5. Smoke Proforma detail PDF action and Invoice detail BL PDF link
6. Smoke `/creances` and `/api/creances` aggregation with and without the overdue filter
7. Run legacy Beta cross-compare once sample data access is available
