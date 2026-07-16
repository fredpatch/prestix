// M10 — Commission Divers. Unlike every other module built so far this
// session, commission transactions are deliberately AUTONOMOUS: they never
// touch a proforma, invoice, or BL. Recording one is a single, standalone
// action — an agent closes a Mobile Money transfer, a visa application, a car
// rental referral, etc., and logs it directly here. No document engine
// involvement at all.

export interface CommissionPeriod {
  start: string; // ISO date
  end: string;
}

// `details` is intentionally untyped/JSONB at the DB level — each commission
// type's shape is defined by its own catalog fieldSchema (commission-catalog
// module, Sprint 1), not by a fixed TS interface here. This keeps the type
// system honest: Claude/TS can't guarantee the shape of a super_admin-created
// custom type at compile time, only the catalog's fieldSchema can describe it
// at runtime.
export type CommissionDetails = Record<string, string | number | CommissionPeriod | undefined>;

export interface CreateCommissionTransactionParams {
  type: string; // must match an ACTIVE commission_type_catalog.code
  agentId: number; // whoever is recording it — feeds Employee KPI (M12)
  clientPartyId?: number;
  referrerPartyId?: number;
  date: string; // ISO date, required
  commissionAmount: number; // manual, always > 0 — no auto-calc anywhere (spec: "no formula engine")
  details?: CommissionDetails;
  note?: string; // universal, common to every type — not part of any per-type fieldSchema
}

export interface CommissionTransactionView {
  id: number;
  type: string;
  agentId: number;
  clientPartyId?: number;
  referrerPartyId?: number;
  date: string;
  commissionAmount: string;
  details?: CommissionDetails;
  note?: string;
  active: boolean;
  createdAt: Date;
  pendingEditRequestId?: number; // set when there's an unreviewed correction request on this row
}

export interface ListCommissionTransactionsFilter {
  type?: string;
  agentId?: number;
  dateFrom?: string;
  dateTo?: string;
  includeInactive?: boolean;
}
