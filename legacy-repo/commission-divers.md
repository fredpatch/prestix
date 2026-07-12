# Legacy Reference - Commission Divers (M10)

> Source: legacy `assurance-service`, `mobile-money-service` (real, active) + `visa-service`, `housing-rental-service`, `vehicle-rental-service` (stubs) + Meeting 3/4 field specs. Target: monolith + PG.
> This is a **merge** module: one unified `commission` module with a `type` discriminator replaces all the legacy per-service commission modules.

## Oracle coverage - uneven, know what's real

| Commission type     | Legacy status                               | Oracle value                                    |
| ------------------- | ------------------------------------------- | ----------------------------------------------- |
| Assurance Voyage    | ✅ Real service (`assurance-service`)       | **High** - proven model, use it                 |
| Mobile Money        | ✅ Real service (`mobile-money-service`)    | **High** - proven, but strip fields (see below) |
| Visa                | ⚠️ Service dir exists, model **empty/stub** | Low - spec from Meeting 3, build fresh          |
| Location de Voiture | ⚠️ `vehicle-rental-service` stub            | Low - spec from Meeting 3, build fresh          |
| Hébergement         | ⚠️ `housing-rental-service` stub            | Low - spec from Meeting 3, build fresh          |
| Transfert et Change | ❌ **No legacy service at all**             | **None - net new**, spec from Meeting 3         |
| Canal+              | ❌ Not built (V2)                           | None - V2                                       |

> Takeaway: only Assurance + Mobile Money have real backend logic to mine. The rest are greenfield from the CDC v2 §2 / Meeting 3 field lists - do **not** waste time hunting for legacy code that's a UI stub.

## KEEP from legacy real services

- **Assurance model (proven fields):** `referrerPartyId`, `agentId`, `coverageStartDate`, `coverageEndDate`, `supplierPrice`, `commission`. Note `sellingPriceHT/TTC` were commented out in legacy - Meeting 4 confirms Assurance is commission-amount driven, so keep it simple: fournisseur (assureur), commission amount, référent, agent, client, période, référence (optional).
- **Autonomy invariant (critical):** commission orders in legacy attached to invoices, BUT **CDC v2 §2 overrides this** - in PrestiX, **commissions do NOT enter the Proforma→Facture→BL workflow.** They are standalone transactions. Drop the invoice-attach path entirely for M10.
- **CA rule:** every commission counts in **CA and gain** without any commercial document. (Feedback1 §6 + Meeting 4.)
- **agentId in snapshots:** legacy persisted `agentId` into service details for employee KPIs - keep, feeds M12 Employee KPI.

## Meeting 4 field changes (authoritative)

- **Mobile Money - REMOVE:** `agence`, `notes`, `internalNotes`, `currency` (devise). **KEEP/ADD:** agent, montant, opérateur. (Legacy Mongo model has the fields to drop - do not port them.)
- **Assurance Voyage - fields:** client, référent, agent, fournisseur (assureur), référence (optional), montant commission, période.

## Field spec per type (from Meeting 3, for the greenfield ones)

- **Transfert et Change:** devise, taux d'achat, taux/montant de revente, **commission = écart calculé**, agent, date.
- **Visa:** type de visa (e-visa | visa tampon), référent, client, agent, date, fournisseur, prix fournisseur, prix TTC pax, **frais de service (auto-calculé)**.
- **Location de Voiture:** référent, client, agent, période, montant commission.
- **Hébergement:** référent, client, agent, fournisseur, prix fournisseur, prix TTC pax, date.

## Target design (monolith + PG)

- Single `commission` module, one `commission_transactions` table with a `type` enum (`mobile_money | transfert_change | visa | location_voiture | hebergement | assurance_voyage | canalplus`).
- Common columns: `type`, `agentId`, `referrerPartyId`, `clientPartyId`, `date`, `commissionAmount`, `supplierId`, `supplierPrice`, timestamps, soft-delete.
- Type-specific fields: use **typed columns where shared** + a JSONB `details` column for the genuinely type-unique bits (visa type, taux d'achat/revente, coverage period, TTC pax) - Postgres JSONB is the reference-stack pattern for flexible-per-type data. Auto-calculated fields (frais de service, commission=écart) computed server-side, never trusted from client.
- `commissionAmount` (or the computed écart / frais de service) is what flows into CA - one grouped query by `type` feeds the M12 CA-composition breakdown.

## Feasibility questions to resolve at M10 (append answers later)

- [ ] Transfert: is commission strictly `revente − achat`, or can it be a manual override?
- [ ] Visa `frais de service` auto-calc formula (from prix fournisseur vs prix TTC pax?)
- [ ] Which types need a supplier (`fournisseur`) as a first-class Party vs a free-text field?
- [ ] Canal+ (V2): confirm it's just another `type` value, no special logic.
