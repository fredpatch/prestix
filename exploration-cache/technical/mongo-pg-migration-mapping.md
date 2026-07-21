# Mongo → PG Migration Mapping (Sprint 0 pre-flight spike)

> Status: schema-mapping spike complete. Data dry-run deferred to Sprint 11 — no real
> Beta export was available (uploaded archive was empty, header-only). Source: legacy
> Mongoose models in `tripwise-monorepo`, cross-checked against `packages/server/src/db/schema.ts`
> and the Phase 2 feasibility study.

## Universal structural risk

Every legacy FK is a Mongo `ObjectId`; PG uses serial integers. Requires a persistent
`old_id → new_id` lookup table, built in strict dependency order:
users/parties → invoices/proformas → lines (tickets/shop) → payments/installments → credit → épargne → commissions

Each later pass reads the lookup table populated by earlier passes. Design the Sprint 11
migration script around this from the start — not an afterthought.

## Party (`party.schema.ts` → `parties`)

| Legacy field                                         | Migration action                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roles: ['CUSTOMER'\|'REFERRER']`                    | `roles.includes('CUSTOMER')` → `isClient`, same for referrer                                                                                                  |
| `type: PERSON\|COMPANY` + `company{tradeName,taxId}` | **Gap** — our `parties` table has no company fields. Open question: does real client base include COMPANY-type parties? If yes, add columns before Sprint 11. |
| `business.creditBalance`, `stats{}`                  | **Do not migrate** — legacy denormalized cache; ours is derived at query time by design (M3/M12). Read-only for reconciliation sanity-check.                  |
| `rewardEvents[]`                                     | Archive, don't import — reward system is V2/deferred (M3).                                                                                                    |

## Credit (`credit.model.ts`, `credit-movment.model.ts` → `credit_lots`, `credit_lot_entries`)

- **Confirmed:** legacy has no expiry/decision-window field anywhere. The credit-window/
  auto-conversion feature is entirely new (matches Phase 2 M3 note).
- **Open policy decision (Lucrèce):** every migrated `status: 'available'` credit needs a
  `decisionWindowExpiresAt` backfilled with no historical basis. Candidate rules: window
  starts at migration date, vs. treat as already-expired and route through underfee/
  conversion policy immediately.

## Épargne (`epargne.model.ts` → `savings_accounts`, `savings_transactions`)

- No `savings_account` entity in legacy — balance is summed from transactions per
  `buyerPartyId`. Must synthesize one account row per distinct legacy saver.
- No inscription-fee history to backfill — **open policy decision:** likely
  `inscriptionFeeAmount=0`, `subscriptionSource='legacy_migration'` sentinel value.
- Legacy `status: 'cancelled'` doesn't map 1:1 to our `draft|recorded` + compensating-entry
  model (M11). Needs a rule once real data volume/pattern is visible: skip if never
  financially real, else migrate as recorded + synthesize a reversal entry.

## Ticketing (`ticketing.model.ts` → `ticket_details`)

- **Clean confirmation, no risk:** legacy `travelClass` enum is `economy|business|first`
  only — no `premium`. Confirms Premium/`prm` is purely new for PrestiX.
- Legacy `passengers: [{fullName}]` array on one order → fans out to N of our
  `ticketDetails` rows (one per passenger), per M8 decision. Real transformation logic
  the migration script must implement, not a straight copy.

## Historical open decisions before Sprint 11 (now moot for migration)

1. Company-type parties — do they exist in real data? (schema gap if yes)
2. Credit-lot decision-window backfill rule for pre-existing legacy credit
3. Épargne inscription-fee/status backfill rule for pre-existing legacy savings

## Final status

- Sprint 11 Mongo->PG migration was cancelled on 2026-07-19 after confirming
  the legacy tripwise-monorepo was a dev/test reference, not mature production
  data. This mapping remains useful as historical/contextual reference only.
