import api from "./axios";

export interface DateRangeParams {
  from: string;
  to: string;
  basis: "accrual" | "cash";
}

export interface CaCompositionBucket {
  bucketKey: string;
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
  id: number;
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
  unpaidCount: number;
  unpaidAmount: number;
  lowStockCount: number;
  epargneSoldeNetPeriode: EpargneSoldeNetPeriode;
}

export interface ActivityRow {
  id: number;
  action: string;
  entityType: string;
  entityId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const reportingApi = {
  getSummary: (params: DateRangeParams) =>
    api.get<DashboardSummary>("/reporting/summary", { params }),
  getCaComposition: (params: DateRangeParams) =>
    api.get<CaCompositionResult>("/reporting/ca-composition", { params }),
  getClientKpis: (params: DateRangeParams) =>
    api.get<KpiRow[]>("/reporting/kpis/clients", { params }),
  getApporteurKpis: (params: DateRangeParams) =>
    api.get<KpiRow[]>("/reporting/kpis/apporteurs", { params }),
  getEmployeKpis: (params: DateRangeParams) =>
    api.get<KpiRow[]>("/reporting/kpis/employes", { params }),
  getRecentActivity: (limit = 10) =>
    api.get<ActivityRow[]>("/reporting/recent-activity", { params: { limit } }),
  exportExcelUrl: (params: DateRangeParams) =>
    `/api/reporting/export/excel?from=${params.from}&to=${params.to}&basis=${params.basis}`,
  exportPdfUrl: (params: DateRangeParams) =>
    `/api/reporting/export/pdf?from=${params.from}&to=${params.to}&basis=${params.basis}`,
};
