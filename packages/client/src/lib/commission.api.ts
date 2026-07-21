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
  note?: string;
  active: boolean;
  createdAt: string;
  pendingEditRequestId?: number;
}

export interface CommissionEditProposedChanges {
  date?: string;
  commissionAmount?: number;
  clientPartyId?: number | null;
  referrerPartyId?: number | null;
  details?: CommissionDetails;
  note?: string | null;
}

export interface CommissionEditRequest {
  id: number;
  commissionTransactionId: number;
  requestedBy: number;
  reason: string;
  proposedChanges: CommissionEditProposedChanges;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
}

export interface CreateCommissionInput {
  type: string;
  clientPartyId?: number;
  referrerPartyId?: number;
  date: string;
  commissionAmount: number;
  details?: CommissionDetails;
  note?: string;
}

export interface CommissionFilter {
  type?: string;
  agentId?: number;
  dateFrom?: string;
  dateTo?: string;
  includeInactive?: boolean;
}

export const commissionApi = {
  list: (filter: CommissionFilter = {}) =>
    api.get<CommissionTransaction[]>("/commissions", { params: filter }),
  create: (data: CreateCommissionInput) => api.post<CommissionTransaction>("/commissions", data),
  softDelete: (id: number) => api.delete<CommissionTransaction>(`/commissions/${id}`),

  // Correction workflow — see commission-edit.service.ts server-side for why
  // this exists instead of a plain PATCH.
  requestEdit: (
    commissionId: number,
    reason: string,
    proposedChanges: CommissionEditProposedChanges,
  ) =>
    api.post<CommissionEditRequest>(`/commissions/${commissionId}/edit-requests`, {
      reason,
      proposedChanges,
    }),
  listEditRequests: (status: "pending" | "approved" | "rejected" = "pending") =>
    api.get<CommissionEditRequest[]>("/commissions/edit-requests", { params: { status } }),
  listAllEditRequests: async () => {
    const [pending, approved, rejected] = await Promise.all([
      commissionApi.listEditRequests("pending"),
      commissionApi.listEditRequests("approved"),
      commissionApi.listEditRequests("rejected"),
    ]);
    return {
      data: [...pending.data, ...approved.data, ...rejected.data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    };
  },
  approveEditRequest: (requestId: number) =>
    api.post<CommissionEditRequest>(`/commissions/edit-requests/${requestId}/approve`),
  rejectEditRequest: (requestId: number, reviewNote?: string) =>
    api.post<CommissionEditRequest>(`/commissions/edit-requests/${requestId}/reject`, {
      reviewNote,
    }),
};
