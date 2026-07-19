import api from "./axios";

export interface CreanceRow {
  invoiceId: number;
  invoiceNumber?: string;
  partyId: number;
  partyName: string;
  installmentId: number;
  sequence: number;
  expectedDate: string;
  expectedAmount: string;
  principalPaid: string;
  principalDue: string;
  penaltyAccrued: string;
  penaltyPaid: string;
  penaltyDue: string;
  isOverdue: boolean;
}

export const creanceApi = {
  list: (onlyOverdue = false, partyId?: number) =>
    api.get<CreanceRow[]>("/creances", { params: { overdue: onlyOverdue, partyId } }),

  accrueNow: () => api.post<{ inserted: number }>("/creances/accrue-now"),
};
