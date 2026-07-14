1. Validate server and client builds after document référent/migration changes
2. Apply/check `20260714090648_damp_ravenous` and `20260714132909_cooing_mathemanic` migrations in dev/staging stack
3. API smoke document routes with/without `referrerPartyId`: proforma create/list/get/promote, invoice draft/detail
4. Client smoke référent selection/display on `/proformas`, `/proformas/:id`, `/invoices`, `/invoices/:id`
5. Keep migration/backfill decisions open: company parties, credit window, epargne backfill
