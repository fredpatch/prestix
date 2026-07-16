import api from "./axios";

export interface CommissionPeriod {
  start: string;
  end: string;
}

export type CommissionDetails = Record<string, string | number | CommissionPeriod | undefined>;

export interface CommissionTransaction {
  id: number;
  type: string;
  agentId: number;
  clientPartyId?: number;
  referrerPartyId?: number;
  date: string;
  commissionAmount: string;
  details?: CommissionDetails;
  active: boolean;
  createdAt: string;
}

export interface CreateCommissionInput {
  type: string;
  clientPartyId?: number;
  referrerPartyId?: number;
  date: string;
  commissionAmount: number;
  details?: CommissionDetails;
}

export interface CommissionFilter {
  type?: string;
  agentId?: number;
  dateFrom?: string;
  dateTo?: string;
  includeInactive?: boolean;
}

export const commissionApi = {
  list: (filter: CommissionFilter = {}) => api.get<CommissionTransaction[]>("/commissions", { params: filter }),
  create: (data: CreateCommissionInput) => api.post<CommissionTransaction>("/commissions", data),
  softDelete: (id: number) => api.delete<CommissionTransaction>(`/commissions/${id}`),
};
