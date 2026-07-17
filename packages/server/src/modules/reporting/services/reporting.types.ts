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
