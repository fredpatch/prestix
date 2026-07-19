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

export interface EmployeeActivityDetail {
  invoices: { id: number; number?: string; date: string; amount: number; partyName: string }[];
  payments: { id: number; invoiceId: number; invoiceNumber?: string; date: string; amount: number; method: string }[];
  commissions: { id: number; type: string; typeLabel: string; date: string; amount: number }[];
  stockMovements: { id: number; articleName: string; type: string; quantity: number; date: string }[];
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
  getCaTrend: (params: DateRangeParams) =>
    api.get<{ bucket: string; gross: number; gain: number }[]>("/reporting/ca-trend", { params }),
  getClientKpis: (params: DateRangeParams) =>
    api.get<KpiRow[]>("/reporting/kpis/clients", { params }),
  getApporteurKpis: (params: DateRangeParams) =>
    api.get<KpiRow[]>("/reporting/kpis/apporteurs", { params }),
  getEmployeKpis: (params: DateRangeParams) =>
    api.get<EmployeeKpiRow[]>("/reporting/kpis/employes", { params }),
  getEmployeeActivityDetail: (agentId: number, params: DateRangeParams) =>
    api.get<EmployeeActivityDetail>(`/reporting/employees/${agentId}/detail`, { params }),
  getRecentActivity: (limit = 10) =>
    api.get<ActivityRow[]>("/reporting/recent-activity", { params: { limit } }),
  exportExcelUrl: (params: DateRangeParams) =>
    `/api/reporting/export/excel?from=${params.from}&to=${params.to}&basis=${params.basis}`,
  exportPdfUrl: (params: DateRangeParams) =>
    `/api/reporting/export/pdf?from=${params.from}&to=${params.to}&basis=${params.basis}`,
};
