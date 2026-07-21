// M12 — Dashboard & Reporting. Deliberately NO new tables (per the
// architecture decision logged back at project kickoff) — this whole module
// is aggregation over data every prior sprint already captured correctly:
// ticket/shop margin (M8/M9), commission agentId/type/amount (M10), épargne
// inscription fee (M11), penalty accrual (M6). "Capture now, display later"
// finally pays off here.

export interface DateRangeParams {
  from: string; // ISO date, inclusive
  to: string; // ISO date, inclusive
  basis: "accrual" | "cash";
}

export interface CaCompositionBucket {
  bucketKey: string; // stable key, e.g. "billetterie", "commission:visa"
  label: string;
  gross: number;
  gain: number;
  volume: number; // transaction count — "most used" per Lucrèce's ask, distinct from CA value
}

export interface CaCompositionResult {
  buckets: CaCompositionBucket[];
  totalGross: number;
  totalGain: number;
}

export interface KpiRow {
  id: number; // partyId or agentId depending on context
  name: string;
  volume: number;
  value: number;
}

// Employé KPI specifically needs a per-activity-type breakdown, not just one
// combined volume number — Lucrèce's own framing: "volume d'action des
// employés, dépendamment des différentes activités de l'agence." The person
// who CREATES an invoice isn't always the person who later RECORDS a payment
// on it, so these are tracked as five genuinely separate counts, not one.
export interface EmployeeActivityBreakdown {
  invoicesIssued: number;
  paymentsRecorded: number;
  commissionsLogged: number;
  stockMovements: number;
  savingsTransactions: number;
}

export interface EmployeeKpiRow extends KpiRow {
  breakdown: EmployeeActivityBreakdown;
}

// The actual drill-down — real transaction rows, not aggregated numbers.
// This is what makes the Employé KPI usable for prime/incentive decisions
// rather than just a scoreboard.
export interface EmployeeActivityDetail {
  invoices: { id: number; number?: string; date: string; amount: number; partyName: string }[];
  payments: {
    id: number;
    invoiceId: number;
    invoiceNumber?: string;
    date: string;
    amount: number;
    method: string;
  }[];
  commissions: { id: number; type: string; typeLabel: string; date: string; amount: number }[];
  stockMovements: {
    id: number;
    articleName: string;
    type: string;
    quantity: number;
    date: string;
  }[];
  savingsTransactions: { id: number; nature: string; amount: number; date: string }[];
}

export interface EpargneSoldeNetPeriode {
  totalDeposits: number;
  totalWithdrawals: number;
  netChange: number;
}

export interface DashboardSummary {
  caComposition: CaCompositionResult;
  overdueCount: number;
  overdueAmount: number;
  unpaidCount: number; // "Impayées ≠ En retard" — deliberately distinct from overdue
  unpaidAmount: number;
  lowStockCount: number;
  epargneSoldeNetPeriode: EpargneSoldeNetPeriode;
}

export interface ActivityRow {
  id: number;
  action: string;
  entityType: string;
  entityId?: string;
  actorName?: string; // undefined for system-originated rows (e.g. auto-conversion cron)
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface RecentSaleRow {
  id: string;
  kind: "invoice" | "payment" | "commission";
  title: string;
  subtitle?: string;
  amount: number;
  partyName?: string;
  agentName?: string;
  occurredAt: Date;
  href?: string;
}

export interface CommissionTypeTrendRow {
  bucket: string;
  series: Record<string, number>;
}

export interface CreanceByParty {
  partyId: number;
  partyName: string;
  principalDue: number;
  penaltyDue: number;
  totalDue: number;
  overdueCount: number;
  unpaidCount: number;
}

// "Combien on gagne" (accrual) vs "combien on gagne réellement" (cash) —
// Lucrèce's own framing, shown SIDE BY SIDE, not toggled like everywhere
// else in this app. Two full CA composition runs, one per basis.
export interface AccrualVsCashComparison {
  accrual: { totalGross: number; totalGain: number };
  cash: { totalGross: number; totalGain: number };
}

export interface OpenEngagements {
  draftInvoiceCount: number;
  draftInvoiceValue: number;
  openProformaCount: number;
  openProformaValue: number;
}
